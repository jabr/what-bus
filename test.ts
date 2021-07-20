import { delay } from "https://deno.land/std/async/mod.ts"

import WhatBus from "./mod.ts"

let wb = new WhatBus('wb:')
wb.publish('t:1', { m: 100 })

let s1 = wb.subscribe('t:1', event => console.log('s1', event.data))
let s2 = wb.subscribeOnce('t:1', event => console.log('s2', event.data))

wb.publish('t:1', { m: 101 })
wb.publish('t:1', { m: 102 })

await delay(1_000)

wb.publish('t:1', { m: 103 })

wb.close()
// wb.publish('t:1', { m: 103 })

console.log('finished')
