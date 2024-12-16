import { Gift, GiftObject } from "../../game/module/Advent.js";
import DatabaseManager from "../../manager/database.js";
import DBGift, { IDBGift } from "../../Models/Gift.js";
import EDEvent from "../../util/events/EDEvent.js";
import SwarmResources from "../../util/game/SwarmResources.js";

/**
 * I don't trust ED server speed so this will be a list.
 */
const lastGifters = [] as Array<GiftObject>;

export default new EDEvent("onReceiveGift", function (hydra, gift) {
    // if (!gift || gift.name === undefined) return;

    const giftObj:GiftObject = {
        gift, puppet_id: this.settings.id
    };

    for (let i = 0, len = lastGifters.length; i < len; i++) {
        const lastGift = lastGifters[i];

        if (lastGift.gift.name === gift.name && lastGift.gift.count.total === gift.count.total) {
            if (lastGift.char_id === undefined && gift.sfsId) {
                const user = this.smartFox.getActiveRoomFr().getUser(gift.sfsId);

                if (user) lastGift.char_id = user.charId;
            }

            return;
        }
    }

    lastGifters.push(giftObj);
    lastGifters.splice(0, 1);

    //@ts-expect-error i cba
    if (typeof giftObj.char_id === "undefined") giftObj.char_id = SwarmResources.sfsUsers?.[giftObj.gift.sfsId]?.charId ?? null;

    hydra.queues.gift.invoke(giftObj);
    
    if (!SwarmResources.tracker.gift.active) return;

    SwarmResources.tracker.gift.list.push(giftObj);
});