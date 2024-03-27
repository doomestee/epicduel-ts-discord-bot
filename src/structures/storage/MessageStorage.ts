import type { AnyTextableChannel, Message, Uncached } from "oceanic.js";
import type Hydra from "../../manager/discord.js";

export default class MessageStorage<T extends object> {
    private cli: Hydra;
    
    /**
     * LOAD FIRST BEFORE USING
     */
    value!: T;

    id = { channel: "", message: "" };

    constructor(client: Hydra, message: Message<AnyTextableChannel | Uncached>) {
        this.cli = client;

        this._load(message);
    }

    _load(message: Message<AnyTextableChannel | Uncached>) {
        this.value = JSON.parse(message.content);
        this.id = { channel: message.channelID, message: message.id };
    }

    save() {
        return this.cli.rest.channels.editMessage(this.id.channel, this.id.message, {
            content: JSON.stringify(this.value)
        }).then(v => v.id === this.id.message);
    }

    modifyValues<Save=boolean>(val: Partial<T>, save: true) : Promise<boolean>
    modifyValues<Save=boolean>(val: Partial<T>, save: false) : boolean
    modifyValues<Save=boolean>(val: Partial<T>, save = false) : boolean | Promise<boolean> {
        const entries = Object.entries(val);

        for (let i = 0, length = entries.length; i < length; i++) {
            const [key, value] = entries[i];

            // @ts-ignore
            this.value[key] = value;
        }

        if (save) { return this.save(); }
        else return true;
    }
}