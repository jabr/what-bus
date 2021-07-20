import { Channel, Subscription, Callback, create } from "./channel.ts"
import { Disposer } from "./disposer.ts"

export default class WhatBus {
    closed = false
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
        // @todo: cache publication channel instances?
        const channel = this.channel(name)
        channel.postMessage(data)
        channel.dispose()
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
        this.disposer.dispose()
    }
}
