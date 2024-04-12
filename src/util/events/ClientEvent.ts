import type Hydra from "../../manager/discord.js";
import type { AnyGuildInteraction, AnyPrivateInteraction, ClientEvents } from "oceanic.js";

export default class HydraEvent<K extends keyof ClientEvents = keyof ClientEvents> {
    listener: (this: Hydra, ...args: ClientEvents[K]) => void;
    name: K;
    constructor(event: "interactionCreate", listener: (this: Hydra, ...args: [interaction: AnyGuildInteraction | AnyPrivateInteraction]) => void);
    constructor(event: K, listener: (this: Hydra, ...args: ClientEvents[K]) => void);
    constructor(event: K, listener: (this: Hydra, ...args: ClientEvents[K]) => void) {
        this.name = event;
        this.listener = listener;
    }
}