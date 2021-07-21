import { delay, spec, asserts } from "./deps.ts"
const { describe, it } = spec
const { assert } = asserts

import { Channel, Cache } from "../channel.ts"

const fakeChannel = (name: string): Channel => {
    return {
        name, disposed: false,
        dispose() {
            console.log(`dispose: ${this.name}`)
            this.disposed = true
        }
    } as any as Channel
}

const cc = new Cache(2)
cc.set('a', fakeChannel('a.0'))
cc.set('b', fakeChannel('b.0'))
console.log(cc)

cc.set('a', fakeChannel('a.1'))
console.log(cc)

cc.set('c', fakeChannel('c.0'))
await delay(1) // wait for trim to run...
console.log(cc)

await delay(1_000)
console.log('finished')
