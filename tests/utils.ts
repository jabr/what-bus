import { Channel } from "../channel.ts"

let fakeChannelCounter = 0
export function createFakeChannel(name: string): Channel {
    return {
        name, id: fakeChannelCounter++, disposed: false,
        dispose() {
            console.log(`dispose: ${this.name}`)
            this.disposed = true
        }
    } as any as Channel
}
