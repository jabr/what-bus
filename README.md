# what-bus

An event-bus based on the WHATWG's BroadcastChannel API.

The `core` module is a basic framework for creating, caching and clean-up of the underlying channel instances.

The `cluster` module is currently a conceptual work-in-progress, but the goal is coordination in a cluster of distributed WhatBus instances. Some planned/potential features:

  * [Rendezvous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing#Algorithm)
  * distributed Maps, Sets, executors
  * data replication & failover
  * leader elections
  * distributed queues, commits

## Example

```ts
// @todo
```

## References

* BroadcastChannel
  - [WHATWG Spec](https://html.spec.whatwg.org/multipage/web-messaging.html#broadcasting-to-other-browsing-contexts)
  - [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
  - [Deno Deploy](https://deno.com/deploy/docs/runtime-broadcast-channel)

## License

This project is licensed under the terms of the [MIT license](LICENSE.txt).
