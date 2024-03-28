import { waitFor } from "../../util/WaitStream.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export default class Customize extends BaseModule {
    constructor(public client: Client) {
        super();
    }

    /**
     * @param {number} styleId
     * @returns {Promise<{ success: 0, extra: string } | { success: 1, data: { id: number, cost: { credit: number, varium: number } } } | { success: -1, error: Error }>}
     */
    buyHairStyle(styleId: number) {
        // if (this.client.boxes.style._gotOwnedHairStyles === -1) return { success: 0, extra: "Please use StyleBox#getOwnedHairStyles" };

        // const style = this.client.boxes.style.getStyleRecord(styleId);

        // if (style.owned) return { success: 0, extra: "Style's already owned" };
        // if (style.styleCredits > this.client.currency.credits) return { success: 0, extra: "Not enough credits." };
        // if (style.styleVarium !== 0) return { success: 0, extra: "SAFETY: This style costs varium." };

        // let wait = waitFor(this.client.smartFox, "hair_buy", [1, style.styleId], 4000);//.then((s) => ({ success: 1, data: { id: s[0], cost: s[1] } })).catch((error) => ({ success: -1, error }));

        // this.client.smartFox.sendXtMessage("main", Requests.REQUEST_BUY_HAIR, {
        //     styleId,
        //     charGender: style.styleGender,
        //     charHairS: style.styleIndex
        // }, 1, "json");

        // return wait;
    }

    /**
     * @param {string[]} data
     */
    responseBoughtHair(data: string[]) {
        // // this.client.smartFox.emit("hair_buy", styleId, cost);
        // if (data[2] !== "1") return console.log(this.client.manager.languages["DYN_npc_err_buyHairFail"]);

        // let cost = {
        //     credit: parseInt(data[3]),
        //     varium: parseInt(data[4]),
        // };

        // let styleId = parseInt(data[5]);

        // this.client.currency.credits -= cost.credit;
        // this.client.currency.varium -= cost.varium;

        // this.client.smartFox.emit("hair_buy", styleId, cost);

        // console.log("Successfully bought a hair (Style ID: %d) for %d credits, %d varium.", styleId, cost.credit, cost.varium);
    }

    /**
     * @param {string[]} data
     */
    saveCharacterResponse(data: string[]) {
        // if (data[5] == 1) {
        //     let cost = {
        //         credit: parseInt(data[2]),
        //         varium: parseInt(data[3])
        //     };

        //     this.client.currency.credits -= cost.credit;
        //     this.client.currency.varium -= cost.varium;

        //     let armorInvId = parseInt(data[4]);

        //     if (armorInvId > 0) {
        //         let currArmor = this.client.modules.Inventory.getEquippedArmor();

        //         if (currArmor && currArmor.itemRecord.itemId != 1) {
        //             let basicArmor = this.client.modules.Inventory.getInventoryItemByCharInvId(armorInvId);

        //             if (basicArmor) this.client.modules.Inventory.equipItemOnPlayer(this.client.getMyUser(), true, this.client.user._myAvatar, basicArmor, false);
        //         } else this.client.manager._logger.error("No equipped armor found");
        //     }

        //     console.log(this.client.manager.languages["DYN_npc_txt_customizeSuccess"]);
        // } else console.log(this.client.manager.languages["DYN_npc_err_customizeFail"]);
    }
}