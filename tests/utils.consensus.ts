import { Optional } from "../utils.ts"
import Consensus, { NodeId, Message, Service, State } from "../consensus.ts"

let serviceCounter = 0
export class TestService implements Service {
    name: string
    nodes: Map<NodeId, Consensus> = new Map
    disconnected: Set<NodeId> = new Set

    constructor(name?: string) {
        this.name = name ?? `service ${++serviceCounter}`
    }

    addNode(id: NodeId) {
        if (this.nodes.has(id)) throw new Error(`duplicate node name: ${id}`)
        const node = new Consensus(id, this)
        this.nodes.set(id, node)
        return node
    }

    disconnectNode(id: NodeId) {
        this.disconnected.add(id)
    }

    reconnectNode(id: NodeId) {
        this.disconnected.delete(id)
    }

    close() {
        for (const node of this.nodes.values()) node.close()
    }

    nodesWithState(state: State) {
        return [...this.nodes.values()].filter(n => {
            return (n.state == state && !this.disconnected.has(n.id))
        })
    }

    get clusterSize() { return this.nodes.size }

    send(to: NodeId, message: Message) {
        if (message.from === to) throw new Error(`attempt to send message to self: ${to}`)
        if (this.disconnected.has(message.from)) {
            console.log(`<discarding message from disconnected ${message.from}>`)
            return
        }
        const node: Optional<Consensus> = this.nodes.get(to)
        if (!node) throw new Error(`no node for name: ${to}`)
        if (this.disconnected.has(to)) {
            console.log(`<discarding message to disconnected ${to}>`)
            return
        }
        node.recv(message)
    }

    broadcast(message: Message) {
        if (this.disconnected.has(message.from)) {
            console.log(`<discarding message from disconnected ${message.from}>`)
            return
        }
        for (const node of this.nodes.values()) {
            if (message.from !== node.id) {
                if (this.disconnected.has(node.id)) {
                    console.log(`<discarding message to disconnected ${node.id}>`)
                    continue
                }
                node.recv(message)
            }
        }
    }
}
