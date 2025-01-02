// Yeah, if you have any suggestions how to improve this, hmu.

import { encode } from "querystring";
import ItemSBox from "../../game/box/ItemBox.js";
import StyleBox from "../../game/box/StyleBox.js";
import type { GiftObject } from "../../game/module/Advent.js";
import DatabaseManager, { quickDollars } from "../../manager/database.js";
import Logger from "../../manager/logger.js";
import { QueueFuncParameters, QueueFuncResult } from "../../types/queue.js";
import SwarmResources from "../../util/game/SwarmResources.js";
import { discordDate, find, getTime } from "../../util/Misc.js";
import { CharToGen } from "../../util/SvgGen.js";
import MultQueue from "./SubGenericQueue.js";
// import Queue from "./GenericQueue.js";

let breaker = false;

export default function ({ hydra }: QueueFuncParameters) : QueueFuncResult {
    const queue = new MultQueue<GiftObject>(30000, 100);

    queue.trigger = async (list, isForced) => {
        let query = "INSERT INTO gifts (char_name, char_id, count_room, count_total, count_combo, fire_tier, global, time) VALUES";
        let toQuery = [];

        let stat = {
            count: {
                score: 0,
                total: 0,
                global: 0
            }, streak: 0,
            
            lastGift: list.at(-1)?.gift.time ?? 0,
            firstGift: list[0].gift.time
        }; let charId:number|undefined = undefined;

        for (let i = 0, len = list.length; i < len; i++) {
            const giftObj = list[i];

            if (i !== 0) query += ","

            query += ` (${quickDollars(8, i * 8)})`;
            
            toQuery.push(giftObj.gift.name, typeof giftObj.char_id === "number" ? giftObj.char_id :
                //@ts-expect-error
                (SwarmResources.sfsUsers?.[giftObj.gift.sfsId]?.charId
                ?? null), giftObj.gift.count.room, giftObj.gift.count.total, giftObj.gift.count.combo, giftObj.gift.onFireTier, giftObj.gift.isGlobal, new Date(giftObj.gift.time));

            // let toPut = (giftObj.gift.isGlobal) ? `**${giftObj.gift.name}** sent a global gift to \`${giftObj.gift.count.room.toString().padStart(3, "0")}\` characters, combo: \`${giftObj.gift.count.combo.toString().padStart(4, "0")}\`, person's total score: \`${giftObj.gift.count.total}\`.`
            //     : `**${giftObj.gift.name}** sent a gift to \`${giftObj.gift.count.room.toString().padStart(3, "0")}\` characters at Central Station, Vendbot w${giftObj.room?.world ?? "0"}, combo: \`${giftObj.gift.count.combo.toString().padStart(4, "0")}\`, person's total score: \`${giftObj.gift.count.total}\`.`
            //`**${giftObj.gift.name}** sent a ${giftObj.gift.isGlobal ? "global " : ""}gift to the room with ${giftObj.gift.}`

            stat.count.total++;
            stat.count.score += giftObj.gift.count.room;
            if (giftObj.gift.isGlobal) stat.count.global++;
            if (giftObj.gift.count.combo > stat.streak) stat.streak = giftObj.gift.count.combo;
            if (giftObj.char_id !== undefined) charId = giftObj.char_id;
        }
        
        DatabaseManager.cli.query(query, toQuery as string[]).catch(console.log);

        if (breaker) return;

        const webbie = await hydra.getWebhooks("1091045429367558154").then(v => find(v, a => a.token !== undefined) as { id: string, token: string });

        const user = SwarmResources.findUserBySfsId(list[0].gift.sfsId);

        if (user) {
            const armor = ItemSBox.getItemById(user.charArm, true);
            const style = StyleBox.getStyleRecord(user.charClassId, user.charHairS, user.charGender as "M" | "F");//.objMap.find(v => v.styleIndex === char.misc.hairS && v.styleClassId === adj);
            
            if (armor && armor.isArmorItemRecord() && style) {
                const obj:Omit<CharToGen, "bypass"> & Record<"flip", string> = {
                    charAccnt: user.charAccnt,
                    charAccnt2: user.charAccnt2,
                    charArm: user.charArm,
                    charClassId: user.charClassId,
                    charEye: user.charEye,
                    charGender: user.charGender as "M" | "F",
                    charHair: user.charHair,
                    charHairS: user.charHairS,
                    charPri: user.charPri,
                    charSec: user.charSec,
                    charSkin: user.charSkin,
                    customHeadLink: armor.customHeadLink,
                    noHead: armor.noHead ? "1" : "0",
                    // bypass: {
                    //     body: armor.getAssetPool(user.charClassId, { g: user.charGender }).body.slice("assets/body/".length),
                    //     bicepR: armor.defaultLimbs ? null : armor.getAssetPool(user.charClassId, { g: user.charGender }).bicepR.slice("assets/body/".length)
                    // },
                    styleHasAbove: style ? style.styleHasAbove : false,
                    armClass: armor.itemClass as 0 | 1 | 2 | 3,
                    armGender: armor.itemSexReq as "M" | "F",
                    armMutate: armor.itemLinkage === "Mutate" ? "1" : "0",
                    defaultLimbs: armor.defaultLimbs ? "1" : "0",

                    flip: "0",
                }

                //@ts-expect-error
                if (global.oklogtime) console.log("https://ei.doomester.one/char?" + encode(obj));

                return hydra.rest.webhooks.execute(webbie.id, webbie.token, {
                    wait: true, embeds: [{
                        title: "Individual Stat",
                        description: `has given away ${stat.count.total} from ${discordDate(stat.firstGift, "T")} to ${discordDate(stat.lastGift, "T")} (in ${getTime((stat.lastGift - stat.firstGift) + 1, true) || "0 second"}).\n\nCombo streak: ${stat.streak}.\nGained gift score: ${stat.count.score}.\nGave away ${stat.count.global} global gifts (${Math.round((stat.count.global / stat.count.total)*10000)/100}%).\n\nGift Per Second: ${stat.count.total/((stat.lastGift-stat.firstGift)/1000)} gift(s).\nGift Per Minute: ${stat.count.total/((stat.lastGift-stat.firstGift)/1000/60)} gift(s).`
                    }],
                    username: user.charName + " (ID: " + user.charId + ")",
                    avatarURL: "https://ei.doomester.one/char?" + encode(obj)
                }).catch(err => Logger.getLogger("SpyChat").error(err));
            }
        }

        return hydra.rest.webhooks.execute(webbie.id, webbie.token, {
            wait: true, embeds: [{
                title: "Individual Stat",
                description: `has given away ${stat.count.total} from ${discordDate(stat.firstGift, "T")} to ${discordDate(stat.lastGift, "T")} (in ${getTime((stat.lastGift - stat.firstGift) + 1, true) || "0 second"}).\n\nCombo streak: ${stat.streak}.\nGained gift score: ${stat.count.score}.\nGave away ${stat.count.global} global gifts (${Math.round((stat.count.global / stat.count.total)*10000)/100}%).\n\nGift Per Second: ${stat.count.total/((stat.lastGift-stat.firstGift)/1000)} gift(s).\nGift Per Minute: ${stat.count.total/((stat.lastGift-stat.firstGift)/1000/60)} gift(s).`
            }],
            username: list[0].gift.name,
            avatarURL: "https://ei.doomester.one/char?" + encode({ charName: list[0].gift.name, flip: "0" })
        }).catch(err => Logger.getLogger("SpyChat").error(err));
    }

    return { queue, type: "gift" };
}