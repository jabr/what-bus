import { delay } from "./deps.ts"
import { createFakeChannel } from "./utils.ts"

import { XXH64 } from "../deps.ts"
import { Channel } from "../channel.ts"
import Nodes from "../nodes.ts"

const bus = {
    uuid: '6b6a1935-2d10-4b06-a82f-419aa480c8c0',
    hasher: await XXH64.create(),
    channel: createFakeChannel
}

const ns = new Nodes(bus)
console.log(ns)

const sn = ns.nodeFor(bus.uuid)
console.log(sn, sn.isSelf)

const uuids = [
    '2d3f917f-0ce8-4a6b-8e73-bde36d6aa61c',
    'a35de363-ae3a-4cec-9f53-2fa6689e0a5c',
    'b99c244e-6292-44d6-9aad-295831843569',
    '5d9ef3a7-3ffc-436a-bb5f-aa7915d1ba20',
]

let on1 = ns.nodeFor(uuids[0])
console.log(on1, on1.isSelf)

console.log(ns.channelFor(uuids[0]))
console.log(ns.channelFor(uuids[0]))
console.log(ns.channelFor(uuids[1]))
console.log(ns.nodes)

function rendezvous(key: string) {
    const [ node, hash ] = ns.rendezvousForKey(key)
    console.log('rendezvous', key, '\n -',
        hash, node?.uuid, node?.isSelf)
    return hash
}

function rendezvousUnder(key: string, under: bigint) {
    const [ node, hash ] = ns.rendezvousForKey(key, under)
    console.log('rendezvous', key, 'under', under, '\n -',
        hash, node?.uuid, node?.isSelf)
    return hash
}

rendezvous('abc')
rendezvous('123')
rendezvous('xyz')
let hash = rendezvous('xxx')
hash = rendezvousUnder('xxx', hash)
hash = rendezvousUnder('xxx', hash)
hash = rendezvousUnder('xxx', hash) // no more nodes

await delay(1_000)
console.log('finished')
