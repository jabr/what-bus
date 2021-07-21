import { Channel } from "./channel.ts"
import { Optional } from "./utils.ts"
import { XXH64 } from "./deps.ts"

interface Node {
    readonly uuid: string
    readonly isSelf: boolean
    channel: Optional<Channel>
    seen: () => void
}

class SelfNode implements Node {
    readonly uuid: string
    channel: Optional<Channel>

    constructor(uuid: string) {
        this.uuid = uuid
    }

    get isSelf() { return true }
    seen() {}
}

class OtherNode implements Node {
    readonly uuid: string
    channel: Optional<Channel>
    private lastSeen: number = 0

    constructor(uuid: string) {
        this.uuid = uuid
    }

    get isSelf() { return false }

    seen() {
        this.lastSeen = performance.now()
    }
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

    expire() {
        // @todo: remove nodes that haven't been seen recently
    }

    nodeFor(uuid: string): Node {
        let node: Optional<Node> = this.nodes.get(uuid)
        if (!node) {
            node = new OtherNode(uuid)
            this.nodes.set(uuid, node)
        }
        return node
    }

    channelFor(uuid: string): Channel {
        let node = this.nodeFor(uuid)
        return (node.channel ??= this.bus.channel(node.uuid))
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

    async leader() {
        // @todo
    }
}
