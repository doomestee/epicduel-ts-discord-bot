import { InteractionContent } from "oceanic.js";
import { getHighestTime } from "../Misc.js";

type SwarmErrorType = "LOGIN_FAILED" | "RATELIMITED" | "NO_SERVER";

export class SwarmError extends Error {
    constructor(public type: SwarmErrorType, message: string, public extra?: any) {
        super(message)
    }

    static noClient(time: bigint, ephemeral?: boolean) : InteractionContent;
    static noClient(ephemeral?: boolean) : InteractionContent;
    static noClient(time?: bigint | boolean, ephemeral=true) : InteractionContent {
        let footer = {} as {} | { footer: { text: string } };
        if (typeof time === "bigint") {
            footer = {
                footer: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
            }
        } else if (typeof time === "boolean") ephemeral = time;

        return {
            embeds: [{
                description: "There are no available clients that the bot can use to respond to your query.",
                ...footer
            }],
            flags: ephemeral ? 64 : 0
        }
    }
}

export class DiscordError extends Error {
    constructor(message: string, public extra?: any) {
        super(message)
    }


    static noBypass(time: bigint, ephemeral?: boolean) : InteractionContent;
    static noBypass(ephemeral?: boolean) : InteractionContent;
    static noBypass(time?: bigint | boolean, ephemeral=true) {
        let footer = {} as {} | { footer: { text: string } };
        if (typeof time === "bigint") {
            footer = {
                footer: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
            }
        } else if (typeof time === "boolean") ephemeral = time;

        return {
            embeds: [{
                description: "You are not the originating person who used the command, or you lack sufficient permission!",
                ...footer
            }],
            flags: ephemeral ? 64 : 0
        }
    }
}