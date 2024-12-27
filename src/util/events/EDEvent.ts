import type Client from "../../game/Proximus.js";
import Hydra from "../../manager/discord.js";
import { MainEDEvents } from "../../types/events.js";

export default class EDEvent<K extends keyof MainEDEvents = keyof MainEDEvents, T = undefined> {
    args?: T;
    listener: (this: Client, hydra: Hydra, ...args: MainEDEvents[K]) => void;
    name: K;
    // constructor(event: "interactionCreate", listener: (this: Client, ...args: [interaction: AnyGuildInteraction | AnyPrivateInteraction]) => void);
    constructor(event: K, listener: (this: Client, hydra: Hydra, ...args: MainEDEvents[K]) => void);
    constructor(event: K, listener: (this: Client, hydra: Hydra, ...args: MainEDEvents[K]) => void, args: T);
    constructor(event: K, listener: (this: Client, hydra: Hydra, ...args: MainEDEvents[K]) => void, args?: T) {
        this.name = event;
        this.listener = listener;

        // if (args)
        this.args = args;
    }
}