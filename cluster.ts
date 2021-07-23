import WhatBus from "./core.ts"
import Nodes from "./nodes.ts"
import { Channel, Subscription, Callback } from "./channel.ts"
import { XXH64 } from "./deps.ts"

const DEFAULT_HEARTBEAT_INTERVAL = 1000
let sequenceCounter = 0

export async function create(prefix: string = 'wb:') {
    const hasher = await XXH64.create(new TextEncoder().encode(prefix))
    return new Cluster(prefix, hasher)
}

class Cluster extends WhatBus {
    uuid: string
    broadcast: Channel
    direct: Channel
    interval: number
    nodes: Nodes

    constructor(prefix: string, public hasher: XXH64.Hasher) {
        super(prefix)
        this.uuid = crypto.randomUUID()
        this.nodes = new Nodes(this)

        this.broadcast = this.channel('i')
        this.broadcast.onmessage = this.onBroadcast.bind(this)

        this.direct = this.channel(`i:${this.uuid}`)
        this.direct.onmessage = this.onDirect.bind(this)

        this.interval = setInterval(
            this.onHeartbeat.bind(this),
            DEFAULT_HEARTBEAT_INTERVAL
        )

        this.post({ev: 'ping'})
    }

    close() {
        clearInterval(this.interval)
        this.direct.dispose()
        this.broadcast.dispose()
        this.nodes.close()
        super.close()
    }

    publish(topic: string, data: any) {
        super.publish(`t:${topic}`, data)
    }

    subscribe(topic: string, callback: Callback): Subscription {
        return super.subscribe(`t:${topic}`, callback)
    }

    private post(data: any, direct?: string): number {
        data.fr = this.uuid
        data.ts = Date.now()
        data.sq = sequenceCounter++

        // default to broadcast...
        let channel = this.broadcast
        // or use a node's direct channel
        if (direct) channel = this.nodes.channelFor(direct)

        channel.postMessage(data)
        return data.sq
    }

    private onBroadcast(event: MessageEvent) {
        const { fr, ts, sq, ev } = event.data
        switch (ev) {
            case 'ping': {
                this.nodes.nodeSeen(fr)
                this.post({ev: 'pong'}, fr)
                break
            }
            default: {
                console.log('unknown broadcast event', event.data)
            }
        }
    }

    private onDirect(event: MessageEvent) {
        const { fr, ts, sq, ev } = event.data
        switch (ev) {
            case 'ping': {
                console.log('direct ping', this.uuid, fr)
                this.nodes.nodeSeen(fr)
                this.post({ev: 'pong'}, fr)
                break
            }
            case 'pong': {
                this.nodes.nodeSeen(fr)
                break
            }
            default: {
                console.log('unknown direct event', event.data)
            }
        }
    }

    private onHeartbeat() {
        // console.log('heartbeat', this.uuid)
        for (const node of this.nodes.stale(2_000)) {
            console.log('stale node', node.uuid)
            this.post({ev: 'ping'}, node.uuid)
        }
    }
}
