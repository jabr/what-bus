import { Channel } from "../channel.ts"

let fakeChannels: Channel[] = []
export function createFakeChannel(name: string): Channel {
    let channel = {
        name, id: fakeChannels.length, disposed: false,
        dispose() {
            console.log(`dispose: ${this.name}`)
            this.disposed = true
        }
    } as any as Channel
    fakeChannels.push(channel)
    return channel
}
createFakeChannel.channels = fakeChannels
