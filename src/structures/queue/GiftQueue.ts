// Yeah, if you have any suggestions how to improve this, hmu.

import type { GiftObject } from "../../game/module/Advent.js";
import DatabaseManager, { quickDollars } from "../../manager/database.js";
import Logger from "../../manager/logger.js";
import { QueueFuncParameters, QueueFuncResult } from "../../types/queue.js";
import SwarmResources from "../../util/game/SwarmResources.js";
import Queue from "./GenericQueue.js";

let breaker = false;

export default function ({ hydra }: QueueFuncParameters) : QueueFuncResult {
    const queue = new Queue<GiftObject>(30000, 100);

    queue.trigger = (list) => {
        let query = "INSERT INTO gifts (char_name, char_id, count_room, count_total, count_combo, fire_tier, global, time) VALUES";
        let toQuery = [];

        let text = [""] as string[];
        let textDex = 0;

        for (let i = 0, len = list.length; i < len; i++) {
            const giftObj = list[i];

            if (i !== 0) query += ","

            query += ` (${quickDollars(8, i * 8)})`;
            
            toQuery.push(giftObj.gift.name, typeof giftObj.char_id === "number" ? giftObj.char_id :
                //@ts-expect-error
                (SwarmResources.sfsUsers?.[giftObj.gift.sfsId]?.charId
                ?? null), giftObj.gift.count.room, giftObj.gift.count.total, giftObj.gift.count.combo, giftObj.gift.onFireTier, giftObj.gift.isGlobal, new Date(giftObj.gift.time));

            let toPut = (giftObj.gift.isGlobal) ? `**${giftObj.gift.name}** sent a gift to the server with \`${giftObj.gift.count.room.toString().padStart(3, "0")}\` characters, combo: \`${giftObj.gift.count.combo.toString().padStart(4, "0")}\`, person's total score: \`${giftObj.gift.count.total}\`.`
                : `**${giftObj.gift.name}** sent a gift to Central Station, Vendbot w0 with \`${giftObj.gift.count.room.toString().padStart(3, "0")}\` characters, combo: \`${giftObj.gift.count.combo.toString().padStart(4, "0")}\`, person's total score: \`${giftObj.gift.count.total}\`.`
            //`**${giftObj.gift.name}** sent a ${giftObj.gift.isGlobal ? "global " : ""}gift to the room with ${giftObj.gift.}`

            if ((text[textDex].length + toPut.length) > 1999) {
                text.push(toPut + "\n");
                textDex++;
            } else {
                text[textDex] += toPut + "\n";
            }
        }
        
        DatabaseManager.cli.query(query, toQuery as string[]).catch(console.log);

        //@ts-ignore
        if (global.testiaefnwia === true) {
            console.log(query);
            console.log(toQuery);

            console.log(text);
        }

        // Leaving this as I will be testing it tonight :3
        if (breaker) return;

        for (let i = 0, len = text.length; i < len; i++) {
            hydra.rest.channels.createMessage("1091045429367558154", {
                content: text[i]
            }).catch(err => {
                Logger.getLogger("breaker").error(err);
                breaker = true;
            });
        }
    }

    return { queue, type: "gift" };
}