// Yeah, if you have any suggestions how to improve this, hmu.

import Config from "../../config/index.js";
import { QueueFuncParameters, QueueFuncResult } from "../../types/queue.js";
import Queue from "./GenericQueue.js";

export default function ({ hydra }: QueueFuncParameters) : QueueFuncResult {
    const queue = new Queue<string>(5000, 15);

    queue.trigger = (list, isForced) => {
        let text = [""] as string[];
        let textDex = 0;

        for (let i = 0, len = list.length; i < len; i++) {
            let toPut = list[i];

            if ((text[textDex].length + toPut.length) > 1999) {
                text.push(toPut + "\n");
                textDex++;
            } else {
                text[textDex] += toPut + "\n";
            }
        }

        for (let i = 0, len = text.length; i < len; i++) {
            hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                content: text[i]
            });
        }
    }

    return { queue, type: "spy" };
}