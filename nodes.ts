import { Channel } from "./channel.ts"
import { Optional } from "./utils.ts"
import { XXH64 } from "./deps.ts"

abstract class Node {
    channel: Optional<Channel>
    constructor(readonly uuid: string) {}
    abstract get isSelf(): boolean
    abstract seen(): void
    abstract age(now: number): number
}

class SelfNode extends Node {
    get isSelf() { return true }
    seen() {}
    age(now: number) { return 0 }
}

class OtherNode extends Node {
    private lastSeen = 0
    get isSelf() { return false }
    seen() { this.lastSeen = performance.now() }
    age(now: number) { return now - this.lastSeen }
}

type Bus = {
    uuid: string
    hasher: XXH64.Hasher
    channel: (name: string) => Channel
}
type HashedNode = [ Optional<Node>, bigint ]

export default class Nodes {
    bus: Bus
    nodes: Map<string, Node> = new Map

    constructor(bus: Bus) {
        this.bus = bus
        this.nodes.set(bus.uuid, new SelfNode(bus.uuid))
    }

    close() {
        for (const node of this.nodes.values()) {
            if (node.channel) node.channel.dispose()
        }
        this.nodes.clear()
    }

    nodeFor(uuid: string): Node {
        let node: Optional<Node> = this.nodes.get(uuid)
        if (!node) {
            node = new OtherNode(uuid)
            this.nodes.set(uuid, node)
        }
        return node
    }

    nodeSeen(uuid: string): void {
        this.nodeFor(uuid).seen()
    }

    channelFor(uuid: string): Channel {
        const node = this.nodeFor(uuid)
        return (node.channel ??= this.bus.channel(`i:${node.uuid}`))
    }

    rendezvousForKey(key: string, under: bigint = 1n << 64n): HashedNode {
        const reducer = (max: HashedNode, node: Node): HashedNode => {
            const hash = this.bus.hasher.reset()
                .update(node.uuid).update(key)
                .digest('bigint') as bigint
            return (hash < under && hash > max[1]) ? [ node, hash ] : max
        }
        return [...this.nodes.values()].reduce(reducer, [ undefined, -1n ])
    }

    // yield nodes with an age over the given threshold
    *stale(threshold: number) {
        const now = performance.now()
        for (const node of this.nodes.values()) {
            const age = node.age(now)
            if (age > threshold) yield node
        }
    }

    // remove nodes that haven't been seen recently
    expire(threshold: number) {
        for (const node of this.stale(threshold)) {
            console.log('remove expired node', node.uuid)
            if (node.channel) node.channel.dispose()
            this.nodes.delete(node.uuid)
        }
    }

    async leader() {
        // @todo
    }
}
