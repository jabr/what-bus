import { Disposable } from "./disposer.ts"
import { Nullable } from "./utils.ts"

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
