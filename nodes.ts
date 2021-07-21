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

    forKey(key: string): Node {
        // @todo: rendezvous hash
        return this.nodes.entries().next().value
    }

    async leader() {
        // @todo
    }
}
