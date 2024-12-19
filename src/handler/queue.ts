import type { ImportResult } from "../util/types.js";
import type { QueueFunc } from "../types/queue.js";

import { glob } from "glob";
import Config from "../config/index.js";
import Hydra from "../manager/discord.js";

export default class QueueHandler {
    static async loadQueues(hydra: Hydra) {
        const files = await glob("**/*.js", { cwd: Config.queuesDirectory, withFileTypes: false });

        for (let i = 0, len = files.length; i < len; i++) {
            const path = `${Config.queuesDirectory}/${files[i]}`;

            if (files[i].includes("GenericQueue")) continue;

            let func = await import(path) as ImportResult<QueueFunc>;

            if ("default" in func) {
                func = func.default;
            }

            if (typeof func !== "function") {
                throw new TypeError(`Export of queue flie "${path}" is not a function.`);
            }

            const res = func({ hydra });

            hydra.queues[res.type] = res.queue;
        }
    }
}