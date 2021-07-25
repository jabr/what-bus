import { Optional } from "./utils.ts"

type NodeId = number
interface Node {
    id: NodeId
    recv(d: any): void
}

const nodes: Node[] = []
function addNode() {
    const node = new Consensus(nodes.length)
    nodes.push(node)
    return node
}

enum State { Follower, Candidate, Leader, Dead }

class Consensus implements Node {
    state = State.Follower
    term = 0
    votedFor: Optional<NodeId>
    votesReceived = 0
    lastTouch = 0
    heartbeatInterval: Optional<number>
    touchExpiration: number = 0

    constructor(public id: NodeId, public service = 'default') {
        this.start()
    }

    touch() {
        this.lastTouch = performance.now()
    }

    updateTouchExpiration() {
        // set new, random expiration time in range [150, 300)
        this.touchExpiration = 150 + Math.random() * 150
    }

    start() {
        this.becomeFollower(0)
        this.heartbeatInterval = setInterval(this.heartbeat.bind(this), 50)
    }

    stop() {
        if (this.heartbeatInterval !== undefined) clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = undefined
        this.state = State.Dead
    }

    close() {
        this.stop()
        // @todo: dispose channels
    }

    send(n: NodeId, d: any) {
        const m = { service: this.service, term: this.term, from: this.id, data: d }
        if (n !== this.id) setTimeout(() => nodes[n].recv(m), 0)
    }
    broadcast(d: any) { nodes.forEach(cn => this.send(cn.id, d)) }

    recv(m: any) {
        if (m.service !== this.service) return
        if (this.state === State.Dead) return

        switch (m.data[0]) {
            case 'leader':
            case 'update': 
                {
                    if (m.term > this.term) this.becomeFollower(m.term)
                    if (m.term === this.term) {
                        if (this.state !== State.Follower) this.becomeFollower(m.term)
                        this.touch()
                    }
            
                    this.send(m.from, ['ack']) // @todo: only reply if m.term is old?
                }
                break
            case 'ack':
                {
                    if (m.term > this.term) this.becomeFollower(m.term)
                }
                break
            case 'candidate':
                {
                    console.log(`[${this.id}] receives candidate from ${m.from}, for term ${m.term}`)
                    if (m.term > this.term) this.becomeFollower(m.term)
                    if (m.term === this.term && (
                        this.votedFor === undefined ||
                        this.votedFor === m.from
                    )) {
                        this.votedFor = m.from
                        this.touch()
                        this.send(m.from, ['vote'])
                    } else {
                        this.send(m.from, ['abstain']) // @todo: only reply if m.term is old?
                    }
                }
                break
            case 'vote':
                {
                    if (this.state === State.Candidate) {
                        if (m.term > this.term) {
                            this.becomeFollower(m.term)
                        } else {
                            console.log(`[${this.id}] receives vote from ${m.from}, term ${this.term}`)
                            this.votesReceived++
                            if (this.votesReceived * 2 > nodes.length) {
                                this.becomeLeader()
                            }
                        }
                    }
                }
                break
            case 'abstain':
                {
                    if (m.state === State.Candidate) {
                        if (m.term > this.term) {
                            this.becomeFollower(m.term)
                        }
                    }
                }
                break
        }
    }

    heartbeat() {
        // just in case a heartbeat sneaks through, make sure we do nothing when Dead
        if (this.state === State.Dead) return

        const elapsed = performance.now() - this.lastTouch
        if (this.state === State.Leader) {
            if (elapsed >= 50) {
                this.broadcast(['update'])
                this.touch()
            }
            return
        }

        // Candidate or Follower
        if (elapsed >= this.touchExpiration) this.startElection()
    }

    becomeFollower(term: number) {
        this.state = State.Follower
        this.term = term
        console.log(`[${this.id}] becomes follower, term ${this.term}`)
        this.votedFor = undefined
        this.touch()
        this.updateTouchExpiration()
    }

    becomeLeader() {
        this.state = State.Leader
        console.log(`[${this.id}] becomes leader, term ${this.term}`)
        this.broadcast(['leader'])
        this.touch()
    }

    startElection() {
        this.state = State.Candidate
        this.term++
        console.log(`[${this.id}] starts election, new term ${this.term}`)
        this.touch()
        this.updateTouchExpiration()
        this.votedFor = this.id
        this.votesReceived = 1
        this.broadcast(['candidate'])
    }
}

if (import.meta.main) {
    const n1 = addNode()
    const n2 = addNode()
    // const n3 = addNode()
}
