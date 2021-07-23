import { delay } from "./deps.ts"

import WhatBus from "../core.ts"
import { create } from "../cluster.ts"

const core = new WhatBus
// core.subscribe('twb:i', (e) => console.log('cluster broadcast', e.data))

interface ClusterInternals {
    post(data: any, direct?: string): number
    onBroadcast(event: MessageEvent): void
    onDirect(event: MessageEvent): void
    onHeartbeat():void
}
const wb = await create('twb:')
// core.subscribe(
//     `twb:i:${wb.uuid}`, (e) => console.log(`cluster direct to wb`, e.data)
// )
// core.publish(`twb:i`, { test: 'direct' })
// core.publish(`twb:i:${wb.uuid}`, { test: 'direct' })

const pwb = wb as any as ClusterInternals
// console.log(pwb.post({ev: 'foobar'}))
// console.log(wb)

wb.subscribe('1', event => console.log('n0.1', event.data))
wb.subscribeOnce('1', event => console.log('n0.2', event.data))

wb.publish('1', { m: 101 })
wb.publish('1', { m: 102 })

await delay(1_000)

const wbo = await create('twb:')
// console.log(pwb.post({ev: 'foobar'}, wbo.uuid))

wbo.subscribeOnce('1', event => console.log('n1.1', event.data))

wbo.publish('1', { m: 201 })

await delay(1_000)
console.log(wb.nodes.nodes)

await delay(5_000)
wbo.close()

await delay(5_000)
wb.close()
console.log(wb.nodes.nodes)

core.close()
console.log('finished')
