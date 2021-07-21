import { delay } from "https://deno.land/std/async/mod.ts"

import { create } from "./cluster.ts"

const wb = await create('twb:')

wb.subscribe('1', event => console.log('n0.1', event.data))
wb.subscribeOnce('1', event => console.log('n0.2', event.data))

wb.publish('1', { m: 101 })
wb.publish('1', { m: 102 })

await delay(1_000)

const wbo = await create('twb:')

wbo.subscribeOnce('1', event => console.log('n1.1', event.data))

wbo.publish('1', { m: 201 })

await delay(1_000)
wbo.close()

await delay(1_000)
wb.close()

console.log('finished')
