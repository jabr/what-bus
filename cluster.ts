import WhatBus from "./core.ts"
import { Channel, Subscription, Callback } from "./channel.ts"
import { XXH64 } from "./deps.ts"

const DEFAULT_HEARTBEAT_INTERVAL = 1000

export async function create(prefix: string = 'wb:') {
    const hasher = await XXH64.create(new TextEncoder().encode(prefix))
    return new Cluster(prefix, hasher)
}

class Cluster extends WhatBus {
    uuid: string
    broadcast: Channel
    direct: Channel
    interval: number
    hasher: XXH64.Hasher

    constructor(prefix: string, hasher: XXH64.Hasher) {
        super(prefix)
        this.uuid = crypto.randomUUID()
        this.hasher = hasher

        this.broadcast = this.channel('i')
        this.broadcast.onmessage = this.onBroadcast.bind(this)

        this.direct = this.channel(`i:${this.uuid}`)
        this.direct.onmessage = (e) => this.onDirect.bind(this)

        this.interval = setInterval(
            this.onHeartbeat.bind(this),
            DEFAULT_HEARTBEAT_INTERVAL
        )

        // @todo: broadcast announcement?
    }

    close() {
        clearInterval(this.interval)
        this.direct.dispose()
        this.broadcast.dispose()
        super.close()
    }

    publish(topic: string, data: any) {
        super.publish(`t:${topic}`, data)
    }

    subscribe(topic: string, callback: Callback): Subscription {
        return super.subscribe(`t:${topic}`, callback)
    }

    private post(data: any, direct?: string) {
        // @todo: supplement data with uuid, timestamp, etc?
        if (!direct) {
            // post to broadcast channel
            this.broadcast.postMessage(data)
        } else {
            // post to the direct channel
            // @todo: cache direct channels?
            super.publish(`i:${direct}`, data)
        }
    }

    private onBroadcast(event: MessageEvent) {
    }

    private onDirect(event: MessageEvent) {
    }

    private onHeartbeat() {
    }
}
