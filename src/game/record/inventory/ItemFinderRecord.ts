import Swarm from "../../../manager/epicduel.js";
import type Client from "../../Proximus.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "../../box/ItemBox.js";
import MerchantSBox from "../../box/MerchantBox.js";
import type MerchantRecord from "../MerchantRecord.js";

export default class ItemFinderRecord {
    merchantIds: number[];

    canJump = false;

    private checkCanJump(mercs: MerchantRecord[]) {
        for (let i = 0, len = mercs.length; i < len; i++) {
            if (mercs[i].mercCanJump) return true;
        } return false;
    }

    text = {
        name: "",
        cred: "",
        var: "",
    }

    constructor(public itemRecord: AnyItemRecordsExceptSelf, client?: Client | { boxes: { item: typeof ItemSBox, merchant: typeof MerchantSBox } }) {
        if (!client) {
            client = {
                boxes: {
                    item: ItemSBox,
                    merchant: MerchantSBox,
                }
            }
        }

        if (typeof itemRecord === "number") this.itemRecord = client.boxes.item.objMap.get(itemRecord) as AnyItemRecordsExceptSelf;

        this.merchantIds = client.boxes.item.getMerchantIdsForItem(this.itemRecord.itemId);
        
        let merchants = [] as MerchantRecord[];

        if (this.merchantIds.length) {
            const merchs = client.boxes.merchant.objMap.toArray();

            for (let i = 0, len = merchs.length; i < len; i++) {
                if (this.merchantIds.includes(merchs[i].merchantId)) merchants.push(merchs[i]);
            } // merchants = client.boxes.merchant.objMap.filter(v => this.merchantIds.includes(v.merchantId));

            if (merchants.length) this.canJump = this.checkCanJump(merchants);
        }

        this.text = {
            name: this.itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_MUTATE_ID ? this.itemRecord.itemName + " (Mutate)" : this.itemRecord.itemName,
            cred: this.itemRecord.itemBuyPerm == ItemSBox.BUY_PERM_UNAVAIL || merchants.length == null ? "N/A" : String(this.itemRecord.itemCredits),
            var: this.itemRecord.itemBuyPerm == ItemSBox.BUY_PERM_UNAVAIL || merchants.length == null ? "N/A" : String(this.itemRecord.itemVarium),
        }

        if (!(merchants !== null && this.canJump)) {
            this.reason = "";

            switch (this.itemRecord.itemSrcId) {
                case ItemSBox.SOURCE_LEGACY: this.reason = Swarm.languages["DYN_inv_txt_srcLegacy"];
                case ItemSBox.SOURCE_BATTLE_DROP: this.reason = Swarm.languages["DYN_inv_txt_srcBattleDrop"];
                case ItemSBox.SOURCE_PROMO: this.reason = Swarm.languages["DYN_inv_txt_srcPromo"];
                case ItemSBox.SOURCE_ARCADE_PRIZE: this.reason = "ARCADE TOKEN";
                case ItemSBox.SOURCE_MISSION_ITEM: this.reason = "MISSION ITEM";
            }

            this.rareName = "";//String(ItemBox.instance.getRareName(itemRecord.itemRareId));
            if (this.rareName.length > 0) {
                this.reason = this.rareName + " " + this.reason;
            }
        }
    }

    reason = "";
    rareName = "";
}