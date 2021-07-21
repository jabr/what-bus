import { delay } from "https://deno.land/std/async/mod.ts"

import { XXH64 } from "./deps.ts"
import { Channel } from "./channel.ts"
import Nodes from "./nodes.ts"

const bus = {
    uuid: '6b6a1935-2d10-4b06-a82f-419aa480c8c0',
    hasher: await XXH64.create(),
    channel: (name: string) => {
        console.log(`create fake channel: ${name}`)
        return {} as Channel
    }
}

const ns = new Nodes(bus)

console.log(ns)

const sn = ns.nodes.get(bus.uuid)
if (sn) console.log(sn.isSelf, sn)

await delay(1_000)
console.log('finished')
