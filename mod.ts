import { Channel, Subscription, Callback, create } from "./channel.ts"

export default class WhatBus {
    prefix: string

    constructor(prefix: string = '') {
        this.prefix = prefix
    }

    channel(name: string) {
        return create(this.prefix + name)
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
}
