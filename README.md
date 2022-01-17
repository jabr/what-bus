# what-bus

An event-bus based on the WHATWG's BroadcastChannel API.

The `core` module is a basic framework for creating, caching and clean-up of the underlying channel instances.

The `cluster` module is currently a work-in-progress, with the goal of coordination in a cluster of distributed WhatBus instances. Some implemented, partially complete, and planned features:

  * [Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing#Algorithm)
  * [Raft consensus](https://en.wikipedia.org/wiki/Raft_(algorithm))
  * distributed Maps, Sets, executors
  * data replication & failover
  * distributed queues, transactions

## Example

```js
import WhatBus from "./core.ts"
const wb = new WhatBus('wb:')

let s1 = wb.subscribe('t:1', event => console.log('s1', event.data))
wb.subscribeOnce('t:1', /* ... */)

wb.publish('t:1', { m: 100 })
wb.close()

import { create } from "./cluster.ts"
const wb = await create('twb:')
// @todo: cluster examples
```

## References

* BroadcastChannel
  - [WHATWG Spec](https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts)
  - [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
  - [Deno Deploy](https://deno.com/deploy/docs/runtime-broadcast-channel)

## License

This project is licensed under the terms of the [MIT license](LICENSE.txt).
