import { Channel, Subscription, Callback, Cache, create } from "./channel.ts"
import { Disposer } from "./disposer.ts"
import { Optional } from "./utils.ts"

export default class WhatBus {
    closed = false
    cache = new Cache
    disposer = new Disposer
    prefix: string

    constructor(prefix: string = '') {
        this.prefix = prefix
    }

    channel(name: string) {
        if (this.closed) throw new Error(`WhatBus(${this.prefix}) is closed`)
        const channel = create(this.prefix + name)
        this.disposer.add(channel)
        return channel
    }

    publish(name: string, data: any) {
        // check cache for corresponding channel
        let channel: Optional<Channel> = this.cache.get(name)
        if (!channel) {
            // create new channel and add to cache
            channel = this.channel(name)
            this.cache.set(name, channel)
        }
        channel.postMessage(data)
        // channel will be closed when it falls out of the cache
    }

    subscribe(name: string, callback: Callback): Subscription {
        const channel = this.channel(name)
        channel.onmessage = callback
        return channel as Subscription
    }

    subscribeOnce(name: string, callback: Callback): Subscription {
        const subscription = this.subscribe(name, (e: MessageEvent) => {
            subscription.dispose()
            callback(e)
        })
        return subscription
    }

    close() {
        this.closed = true
        this.cache.dispose()
        this.disposer.dispose()
    }
}
