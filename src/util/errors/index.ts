import { InteractionContent } from "oceanic.js";
import { getHighestTime } from "../Misc.js";

type SwarmErrorType = "LOGIN_FAILED" | "RATELIMITED";

export class SwarmError extends Error {
    constructor(public type: SwarmErrorType, message: string, public extra?: any) {
        super(message)
    }

    static noClient(time?: bigint) : InteractionContent {
        let footer = {} as {} | { footer: { text: string } };
        if (typeof time !== "undefined") {
            footer = {
                footer: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
            }
        }

        return {
            embeds: [{
                description: "There's no available clients that the bot can use to respond to your query.",
                ...footer
            }]
        }
    }
}