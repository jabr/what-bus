import { XXH64 } from "./deps.ts"

let prefix = 'ebb'
console.log(await XXH64.create(new TextEncoder().encode(prefix)))

const HEARTBEAT_INTERVAL = 1000

type Optional<V> = V | undefined
type Subscription = { close: () => void }
type Callback = (e: MessageEvent) => void

class Node {
    uuid: string
    channel: Optional<BroadcastChannel>
    lastSeen: number = 0
    leader: boolean = false

    constructor(uuid: string) {
        this.uuid = uuid
    }

    seen() {
        this.lastSeen = Date.now()
    }
}

class Nodes extends Map<string, Node> {
    expire() {
        // @todo: remove nodes that haven't been seen recently
    }

    forKey(key: string) {
        // @todo: rendezvous hash
    }

    async leader() {
        // @todo
    }
}

export default class WhatBus {
    prefix: string
    uuid: string
    broadcast: BroadcastChannel
    direct: BroadcastChannel
    interval: number

    constructor(prefix: string = 'eb') {
        this.prefix = prefix
        this.uuid = crypto.randomUUID()

        this.broadcast = this.channel('i')
        this.broadcast.onmessage = this.onBroadcast.bind(this)

        this.direct = this.channel(`i:${this.uuid}`)
        this.direct.onmessage = (e) => this.onDirect.bind(this)

        this.interval = setInterval(
            this.heartbeat.bind(this),
            HEARTBEAT_INTERVAL
        )
    }

    close() {
        clearInterval(this.interval)
        this.direct.close()
        this.broadcast.close()
    }

    publish(topic: string, data: any) {
        const channel = this.channel(`t:${topic}`)
        channel.postMessage(data)
        channel.close()
    }

    subscribe(topic: string, callback: Callback): Subscription {
        const channel = this.channel(`t:${topic}`)
        channel.onmessage = callback
        return channel as Subscription
    }

    private post(data: any, direct?: string) {
        // @todo: supplement data with uuid, timestamp, etc?
        if (!direct) {
            // post to broadcast channel
            this.broadcast.postMessage(data)
        } else {
            // post to the direct channel
            // @todo: cache direct channels?
            const channel = this.channel(`i:${direct}`)
            channel.postMessage(data)
            channel.close()
        }
    }

    private onBroadcast(event: MessageEvent) {
    }

    private onDirect(event: MessageEvent) {
    }

    private heartbeat() {
    }

    private channel(name: string) {
        return new BroadcastChannel(`${this.prefix}:${name}`)
    }

}
