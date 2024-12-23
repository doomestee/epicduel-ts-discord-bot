//["itemId","itemName","itemCredits","itemVarium","itemLinkage","itemRareId","itemSrcId","itemBuyPerm","itemSellPerm","itemCat"]

import type ArmorItemRecord from "./ArmorRecord.js";
import BikeItemRecord from "./BikeRecord.js";
import type BotItemRecord from "./BotRecord.js";
import type CoreItemRecord from "./CoreRecord.js";
import type MissionItemRecord from "./MissionRecord.js";
import type WeaponRecord from "./WeaponRecord.js";

export default class ItemRecord<T extends number> {
    itemId: number;
    itemName: string;
    itemCredits: number;
    itemVarium: number;
    itemLinkage: string;
    itemRareId: number;
    itemSrcId: number;
    itemBuyPerm: number;
    itemSellPerm: number;
    itemCat: T;

    constructor(data: any) {
        this.itemId = parseInt(data['itemId']);
        this.itemName = String(data['itemName']);
        this.itemCredits = parseInt(data['itemCredits']);
        this.itemVarium = parseInt(data['itemVarium']);
        this.itemLinkage = String(data['itemLinkage']);
        this.itemRareId = parseInt(data['itemRareId']);
        this.itemSrcId = parseInt(data['itemSrcId']);
        this.itemBuyPerm = parseInt(data['itemBuyPerm']);
        this.itemSellPerm = parseInt(data['itemSellPerm']);
        this.itemCat = parseInt(data['itemCat']) as T;
    }

    /**
     * .swf not included at the end, nor the url at the start (up until after .com/).
     * @param {1|2|3|4|5|6} classId Only for mutates, or armors.
     */
    getAssetPool(classId?: number, armorExtra={g: "M"}) : any {
        /**
         * @type {1|2|3}
         */
        let adjusted = classId ?? 0;
        if (adjusted > 3) adjusted = adjusted - 3;

        // Mutate
        if (this.itemCat === 20) {
            if (adjusted === 1) {
                return {
                    left: "assets/blades/item_BH_" + this.itemId + "L",
                    right: "assets/blades/item_BH_" + this.itemId + "R",
                }
            } else if (adjusted === 2) {
                return "assets/swords/" + this.itemLinkage;
            } else if (adjusted === 3) {
                return "assets/staffs/" + this.itemLinkage;
            } else if (adjusted === 0) {
                return {
                    bhl: "assets/blades/item_BH_" + this.itemId + "L",
                    bhr: "assets/blades/item_BH_" + this.itemId + "R",
                    mc: "assets/swords/item_" + this.itemId,
                    tm: "assets/staffs/item_" + this.itemId,
                }
            }

            return "assets/" + ((adjusted === 1) ? "blades/" : (adjusted === 2) ? "swords/" : "staffs/") + "item_" + ((adjusted === 1) ? "BH" : (adjusted === 2) ? "TM" : "MC") + "_" + this.itemId;
        } else if (this.itemLinkage === "Mutate" && this.itemCat !== 2) {
            let categoryName = this.getItemCategoryName(classId);
            let mutateLink = "item_" + ((adjusted === 1) ? "BH" : (adjusted === 2) ? "MC" : "TM") + "_" + this.itemId;

            return "assets/" + categoryName + mutateLink;
        }

        if (this.isArmorItemRecord()) {
            let armorMutation = ((adjusted < 2) ? "BH" : (adjusted === 2) ? "MC" : "TM") + "_" + armorExtra.g//EpicDuel.getMyUser().charGender;
            let armorLinkage: string = this.itemLinkage === "Mutate" ? armorMutation : this.itemLinkage;

            if(this.itemId == 1) armorLinkage = "Basic_" + armorLinkage;

            //  yes this is in the code
            let getArmorStyleById: number = (this.itemId != null) ? this.itemId : 0;

            let assets = {
                body: "assets/armors/" + armorLinkage + "_Body_" + getArmorStyleById,
                hip: !this.noHip ? "assets/armors/" + armorLinkage + "_Hip_" + getArmorStyleById : null,
                bicepR: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Bicep_R_" + getArmorStyleById : null,
                forearmR: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Forearm_R_" + getArmorStyleById : null,
                shinR: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Shin_R_" + getArmorStyleById : null,
                footR: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Foot_R_" + getArmorStyleById : null,
                thighR: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Thigh_R_" + getArmorStyleById : null,

                bicepL: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Bicep_L_" + getArmorStyleById : null,
                forearmL: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Forearm_L_" + getArmorStyleById : null,
                shinL: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Shin_L_" + getArmorStyleById : null,
                footL: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Foot_L_" + getArmorStyleById : null,
                thighL: !this.defaultLimbs ? "assets/armors/" + armorLinkage + "_Thigh_L_" + getArmorStyleById : null,
            };

            return assets;
        }
        if (this.itemCat === 3) return "assets/swords/" + this.itemLinkage;
        if (this.itemCat === 4) return "assets/swords/" + this.itemLinkage;
        if (this.itemCat === 5) return "assets/staffs/" + this.itemLinkage;
        if (this.itemCat === 6) return "assets/guns/" + this.itemLinkage;
        if (this.itemCat === 7) return { left: "assets/blades/" + this.itemLinkage + "L", right: "assets/blades/" + this.itemLinkage + "R" };
        if (this.itemCat === 8) return "assets/auxiliary/" + this.itemLinkage;
        if (this.itemCat === 9) return "assets/cores/" + this.itemLinkage;
        if (this.itemCat === 10) return "assets/crafts/" + this.itemLinkage;
        if (this.itemCat === 11) return "assets/robots/" + this.itemLinkage;
        if (this.itemCat === 12) return "assets/mission/" + this.itemLinkage;

        return "null2";
    }

    /**
     * NOTE if this is a mutate, it will only return blades
     */
    // getAssetTag(this: ArmorItemRecord) : "armors";
    // getAssetTag(this: BotItemRecord) : "robots";
    // getAssetTag(this: CoreItemRecord) : "cores";
    // getAssetTag(this: MissionItemRecord) : "mission";
    // getAssetTag(this: WeaponRecord) : "swords" | "staffs" | "blades" | "guns" | "auxiliary";
    // getAssetTag(this: BikeItemRecord) : "crafts";
    getAssetTag(this: ArmorItemRecord|BotItemRecord|CoreItemRecord|MissionItemRecord|WeaponRecord|BikeItemRecord) {
        switch (this.itemCat) {
            case 2: return "armors";
            case 3: case 4: return "swords";
            case 5: return "staffs";
            case 6: return "guns";
            case 7: case 20: return "blades";
            case 8: return "auxiliary";
            case 9: return "cores";
            case 10: return "crafts";
            case 11: return "robots";
            case 12: return "mission";
            default: throw Error("Unknown item cat");
        }
    }

    getItemCategoryName(classId=1, itemCat?: number) : string {
        itemCat = itemCat || this.itemCat;
        switch(itemCat) {
            case 1: return "All";
            case 2: return "Armor";
            case 3: return "Sword";
            case 4: return "Club";
            case 5: return "Staff";
            case 6: return "Gun";
            case 7: return "Blade";
            case 8: return "Auxiliary";
            case 9: return "Core";
            case 10: return "Vehicle";
            case 11: return "Bot";
            case 12: return "Mission";
            case 20:
                return this.getItemCategoryName(classId, (classId === 1 || classId === 4) ? 7 : (classId === 2 || classId === 5) ? 4 : 7);
            default:
                return "";
        }
    }

    isBotItemRecord() : this is BotItemRecord {
        return this.itemCat === 11;
    }

    isWeaponItemRecord() : this is WeaponRecord {
        const list = [3, 4, 5, 6, 7, 8, 20, 21];

        for (let i = 0, len = list.length; i < len; i++) {
            if (list[i] === this.itemCat) return true;
        } return false;
    }

    isArmorItemRecord() : this is ArmorItemRecord {
        return this.itemCat === 2;
    }

    isMissionItemRecord() : this is MissionItemRecord {
        return this.itemCat === 12;
    }

    isCoreItemRecord() : this is CoreItemRecord {
        return this.itemCat === 9;
    }

    isBikeItemRecord() : this is CoreItemRecord {
        return this.itemCat === 10;
    }
}

export function lazyParse(v: string, t: 0): number;
export function lazyParse(v: string, t: ""): string;
export function lazyParse(v: string, t: "" | 0) {
    if (v !== undefined) return t === 0 ? parseInt(v) : t === "" ? v : v; else return null;
}