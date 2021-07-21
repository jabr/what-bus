import { delay, spec, asserts } from "./deps.ts"
import { createFakeChannel } from "./utils.ts"

import { Channel, Cache } from "../channel.ts"

const cc = new Cache(2)
cc.set('a', createFakeChannel('a.0'))
cc.set('b', createFakeChannel('b.0'))
console.log(cc)

cc.set('a', createFakeChannel('a.1'))
console.log(cc)

cc.set('c', createFakeChannel('c.0'))
await delay(1) // wait for trim to run...
console.log(cc)

await delay(1_000)
console.log('finished')

const { describe, it } = spec
const { assertEquals } = asserts

describe('Channel', () => {
    describe('interface', () => {})
    describe('Cache', () => {
        describe('constructor', () => {
            it('has a default maxSize', ctx => {
                const c = new Cache()
                asserts.assert(c.maxSize > 0)
            })

            it('accepts an alternate maxSize', ctx => {
                const c = new Cache(2)
                assertEquals(c.maxSize, 2)
            })
        })
    })
})
