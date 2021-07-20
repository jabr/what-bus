export type Subscription = { close: () => void }
export type Callback = (e: MessageEvent) => void

export default class WhatBus {
    prefix: string

    constructor(prefix: string = '') {
        this.prefix = prefix
    }

    channel(name: string) {
        return new BroadcastChannel(this.prefix + name)
    }

    publish(name: string, data: any) {
        const channel = this.channel(name)
        channel.postMessage(data)
        queueMicrotask(() => channel.close())
    }

    subscribe(name: string, callback: Callback): Subscription {
        const channel = this.channel(name)
        channel.onmessage = callback
        return channel as Subscription
    }

    subscribeOnce(name: string, callback: Callback): Subscription {
        const subscription = this.subscribe(name, (e: MessageEvent) => {
            subscription.close()
            callback(e)
        })
        return subscription
    }
}
