import { delay, spec, Context, asserts } from "./deps.ts"
const { describe, before, it, after } = spec
const { assertEquals, assertNotEquals } = asserts
import { TestService } from "./utils.consensus.ts"

import Consensus, { State } from "../consensus.ts"

describe('Consensus', () => {
    before(ctx => {
        console.group('\n')
        ctx.service = new TestService()
    })

    after(ctx => {
        ctx.service.close()
        console.groupEnd()
    })

    describe('elections', () => {
        const assertNoLeader = (ctx: Context) => {
            const leaders = ctx.service.nodesWithState(State.Leader)
            assertEquals(leaders.length, 0)
        }

        const assertLeader = (ctx: Context) => {
            const leaders = ctx.service.nodesWithState(State.Leader)
            assertEquals(leaders.length, 1)
            return leaders[0]
        }

        const assertFollowers = (ctx: Context, count: number) => {
            const followers = ctx.service.nodesWithState(State.Follower)
            assertEquals(followers.length, count)
            return followers
        }

        describe('with one node', () => {
            before(ctx => {
                ctx.node = ctx.service.addNode('A')
                assertEquals(ctx.service.clusterSize, 1)
            })

            it('does not elect a leader', async ctx => {
                assertEquals(ctx.node.state, State.Follower)
                await delay(350)
                assertEquals(ctx.node.state, State.Candidate)
                await delay(350)
                assertNoLeader(ctx)
            })
        })

        const assertNewLeader = (ctx: Context) => {
            const leader = assertLeader(ctx)
            assertNotEquals(leader.id, ctx.orig.leader)
            assertNotEquals(leader.term, ctx.orig.term)
            return leader
        }

        describe('with three nodes', () => {
            before(ctx => {
                for (const name of 'ABC') ctx.service.addNode(name)
                assertEquals(ctx.service.clusterSize, 3)
            })

            it('elects a single leader', async ctx => {
                assertNoLeader(ctx)
                await delay(500)
                assertLeader(ctx)
            })

            describe('and leader disconnects', () => {
                before(async ctx => {
                    await delay(500)
                    ctx.node = assertLeader(ctx)
                    ctx.orig = { leader: ctx.node.id, term: ctx.node.term }
                    ctx.service.disconnectNode(ctx.orig.leader)
                })

                it('elects a new leader with a new term', async ctx => {
                    await delay(350)
                    assertNewLeader(ctx)
                })

                describe('and a follower disconnects', () => {
                    before(ctx => {
                        const follower = assertFollowers(ctx, 2)[0]
                        ctx.other = follower.id
                        ctx.service.disconnectNode(ctx.other)
                    })

                    it('has no leader until the follower reconnects', async ctx => {
                        await delay(450)
                        assertNoLeader(ctx)

                        ctx.service.reconnectNode(ctx.other)
                        await delay(350)
                        assertLeader(ctx)
                    })
                })

                describe('then reconnects', () => {
                    before(async ctx => {
                        await delay(350)
                        const newLeader = assertNewLeader(ctx)
                        ctx.new = { leader: newLeader.id, term: newLeader.term }
                        ctx.service.reconnectNode(ctx.orig.leader)
                    })

                    it('is now a follower and the new leader/term do not change', async ctx => {
                        await delay(150)
                        assertEquals(ctx.node.state, State.Follower)

                        const leader = assertLeader(ctx)
                        assertEquals(leader.id, ctx.new.leader)
                        assertEquals(leader.term, ctx.new.term)
                    })
                })
            })

            it('all disconnect and reconnect', async ctx => {
                await delay(100)
                for (const name of 'ABC') ctx.service.disconnectNode(name)
                await delay(450)
                assertNoLeader(ctx)

                for (const name of 'ABC') ctx.service.reconnectNode(name)
                await delay(500)
                assertLeader(ctx)
            })

            it('follower disconnects and reconnects', async ctx => {
                await delay(500)
                let leader = assertLeader(ctx)
                const term = leader.term

                const follower = assertFollowers(ctx, 2)[0]
                ctx.service.disconnectNode(follower.id)
                await delay(650)
                ctx.service.reconnectNode(follower.id)
                await delay(350)

                leader = assertLeader(ctx)
                // We can't be certain who the leader is now, but we can
                // assert that a re-election (and thus a new term) occurred.
                asserts.assert(leader.term > term)
            })

            it('leader and a follower repeatedly disconnect and reconnect', async ctx => {
                let cycles = 5
                while(cycles-- > 0) {
                    await delay(350)
                    const leader = assertLeader(ctx)
                    ctx.service.disconnectNode(leader.id)
                    const follower = assertFollowers(ctx, 2)[0]
                    ctx.service.disconnectNode(follower.id)

                    await delay(310)
                    assertNoLeader(ctx)

                    ctx.service.reconnectNode(follower.id)
                    ctx.service.reconnectNode(leader.id)
                    await delay(150)
                }
            })
        })

        describe('with five nodes', () => {
            before(ctx => {
                for (const name of 'ABCDE') ctx.service.addNode(name)
                assertEquals(ctx.service.clusterSize, 5)
            })

            describe('and leader disconnects then reconnects', () => {
                before(async ctx => {
                    await delay(500)
                    ctx.node = assertLeader(ctx)
                    ctx.orig = { leader: ctx.node.id, term: ctx.node.term }
                    ctx.service.disconnectNode(ctx.orig.leader)
                    await delay(350)
                    const newLeader = assertNewLeader(ctx)
                    ctx.new = { leader: newLeader.id, term: newLeader.term }
                    ctx.service.reconnectNode(ctx.orig.leader)
                })

                it('is now a follower and the new leader/term do not change', async ctx => {
                    await delay(150)
                    assertEquals(ctx.node.state, State.Follower)

                    const leader = assertLeader(ctx)
                    assertEquals(leader.id, ctx.new.leader)
                    assertEquals(leader.term, ctx.new.term)
                })
            })
        })
    })
})
