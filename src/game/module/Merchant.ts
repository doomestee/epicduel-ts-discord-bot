import CacheManager from "../../manager/cache.js";
import { getLegendRankByExp } from "../../util/Misc.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export type Shop = {
    itemId: number;
    qtyLeft: number | -1;
}[];

export default class Merchant extends BaseModule {
    prevMercId = -1;

    constructor(public client: Client) {
        super();
    }

    /**
     * Note that this will not fetch the Merchant's inventory, only to see if you can use it or not.
     * @see {@link requestMercInv}
     * @param {number} mercId
     * @returns
     */
    canShopMerc(mercId: number) {
        let okToShop = true;
        let merchant = this.client.boxes.merchant.objMap.get(mercId);

        if (!merchant) return { okay: false, type: -2, reason: "UnknownMercID" };//throw Error("Unknown merchant ID.");

        if (merchant.reqItems !== "") {
            let reqItems = merchant.reqItems.split(",");
            for (let r = 0; r < reqItems.length; r++) {
                if (!this.client.modules.Inventory.clientAlreadyOwnsItem(parseInt(reqItems[r]))) {
                    okToShop = false; break;
                }
            }
        }

        let legendRank = getLegendRankByExp(this.client.getMyUserFr().charExp);

        if (mercId === 282 && legendRank < 1 ) return { okay: false, reqMet: false, type: -1, reason: "1LegRank" };
        if (mercId === 283 && legendRank < 15) return { okay: false, reqMet: false, type: -1, reason: "15LegRank" };
        if (mercId === 284 && legendRank < 50) return { okay: false, reqMet: false, type: -1, reason: "50LegRank" };

        if (okToShop) return { okay: true, reqMet: true, type: 1 };
        return { okay: false, reqMet: false, type: 0, reason: merchant.reqItems.split(",").map(v => this.client.boxes.item.objMap.get(parseInt(v))) };
    }


    /**
     * Only sends smartfox api request.
     * @param {number} mercId
     * @param {boolean} checkIfCanShop
     * @returns {Promise<{itemId: number, qtyLeft: number}[]>}
     */
    async requestMercInv(mercId: number, checkIfCanShop=true) : Promise<WaitForResult<Shop>> {
        let eligible = this.canShopMerc(mercId);
        if (checkIfCanShop && !eligible.okay) return { success: false, reason: "Req not met" };

        this.prevMercId = mercId;

        // this.client.smartFox.emit("merc_items", this.prevMercId, this.cache[this.prevMercId][1]);

        let wait = waitFor(this.client.smartFox, "merch_item", [1, this.prevMercId], 4000);//.then((s) => s[1]).catch((error) => { return { error }; });

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MERCHANT_INVENTORY, { merchId: mercId }, 2, "json");

        return wait;
    }

    merchantInventoryAvailable(data: any) {
        // if (!this.dump) this.dump = [];
        // this.dump.push(data);

        if (data.merchItems == null) { return this.client.smartFox.emit("merch_item", [], this.prevMercId); }

        const shop = [] as Shop;

        // this.cache[this.prevMercId] = [Date.now(), []];
        for (let i = 0; i < data.merchItems.length; i++) {
            let itemId = -1; let qtyLeft = -1;

            if (data.merchItems[i].indexOf("Q") !== -1) {
                let itemArray = data.merchItems[i].split("Q");
                if(itemArray.length === 2) {
                   itemId = parseInt(itemArray[0]);
                   qtyLeft = parseInt(itemArray[1]);
                }
            } else {
                itemId = parseInt(data.merchItems[i]);
                qtyLeft = -1;
            }

            if (true/* !(clientOnOffense && itemId == WarManager.instance.activeRegion.defenseSuperItemId || clientOnDefense && itemId == WarManager.instance.activeRegion.offenseSuperItemId) */) {
                // let merchItem = this.client.boxes.item.getItemById(itemId);
                // let listItem = new InventoryListItem(merchItem);
                // listItem.qtyLeft = qtyLeft;
                
                shop.push({
                    itemId, qtyLeft
                });
                // this.cache[this.prevMercId][1].push(listItem);
            }
        }

        CacheManager.update("merchant", this.prevMercId, shop);
        this.client.smartFox.emit("merch_item", shop, this.prevMercId);
    }
}