import { Disposable } from "./disposer.ts"
import { Nullable, Optional } from "./utils.ts"

export interface Subscription extends Disposable { name: string }
export type Callback = (e: MessageEvent) => void

export interface Channel extends Subscription {
    postMessage: (e: MessageEvent) => void
    onmessage: Nullable<Callback>
}

class WrappedBC extends BroadcastChannel implements Channel {
    dispose() {
        this.onmessage = null
        setTimeout(() => this.close(), 0)
    }
}

export function create(name: string): Channel {
    return new WrappedBC(name) as Channel
}

export class Cache {
    channels: Map<string, Channel> = new Map
    maxSize: number

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize
    }

    get(name: string): Optional<Channel> {
        const channel = this.channels.get(name)
        if (channel) {
            // delete and set entry again to update the order used
            this.channels.delete(name)
            this.channels.set(name, channel)
        }
        return channel
    }

    set(name: string, channel: Channel): this {
        // if we already have an entry for this name...
        const existing = this.channels.get(name)
        if (existing) {
            // remove it and dispose the channel
            this.channels.delete(name)
            existing.dispose()
        }

        this.channels.set(name, channel)

        if (this.channels.size > this.maxSize) {
            // schedule task to trim old entries
            setTimeout(() => this.trim(), 0)
        }

        return this
    }

    dispose() {
        for (const channel of this.channels.values()) channel.dispose()
        this.channels.clear()
    }

    // delete/dispose old entries if we're over the max size
    private trim() {
        let overage = this.channels.size - this.maxSize
        if (overage <= 0) return

        for (const [ name, channel ] of this.channels.entries()) {
            this.channels.delete(name)
            channel.dispose()
            if (--overage <= 0) break
        }
    }
}
