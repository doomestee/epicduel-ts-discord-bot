import ItemSBox, { AnyItemRecordsExceptSelf } from "../../box/ItemBox.js";
import SkillsSMBox from "../../box/SkillsBox.js";
import type CharacterInvRecord from "../CharacterInvRecord.js";
import type AllRecord from "../skills/AllRecord.js";
import type CoreRecord from "../skills/CoreRecord.js";

export default class InventoryListItem {
    icon = "";
    headerMsg: string | null = "";;

    itemRecord!: AnyItemRecordsExceptSelf;
    charInvRecord!: CharacterInvRecord;

    coreRecord?: CoreRecord;
    coreRecordSkill?: AllRecord;

    constructor(itemRecordParam: AnyItemRecordsExceptSelf, charInvRecordParam?: CharacterInvRecord, headerMsg=null) {
        this.headerMsg = headerMsg;
        if (headerMsg == null) {
            this.itemRecord = itemRecordParam;
            //@ts-expect-error
            if (charInvRecordParam == null) charInvRecordParam = {};
            //@ts-expect-error
            this.charInvRecord = charInvRecordParam;

            if ("coreId" in this.itemRecord) {
                this.coreRecord = SkillsSMBox.recordById("core", this.itemRecord.coreId);
                this.coreRecordSkill = SkillsSMBox.recordById("all", this.coreRecord.skillId);
            }
        }
    }

    get isCategoryHeader() { return this.charInvRecord == null && this.itemRecord == null; }
    get charInvId() { if (this.headerMsg != null) {return 0;} return this.charInvRecord.charInvId; }
    get label() {
        if (this.headerMsg != null) return this.headerMsg;

        let newName = this.itemRecord.itemName;

        if(this.itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_CORE_ID) {
            if(this.charInvRecord != null && (this.charInvRecord.coreActiveQty > 0 || this.charInvRecord.corePassiveQty > 0))
                newName = this.coreRecordSkill?.skillName + " x" + (this.charInvRecord.coreActiveQty > 0 ? this.charInvRecord.coreActiveQty : this.charInvRecord.corePassiveQty);
        }
        return newName + (this.charInvRecord.invQty > 1 ? " x" + this.charInvRecord.invQty : "");
     
    }

    get itemId() {
        if (this.headerMsg != null) return 0;
        return this.itemRecord.itemId;
    }

    get data() {
        if (this.headerMsg != null) return 0;
        return this.itemRecord.itemId;
    }

    get qtyLeft() {
        return this.charInvRecord.invQty;
    }

    set qtyLeft(val) {
        this.charInvRecord.invQty = val;
    }

    get itemCat() {
        if (this.headerMsg != null) return 0;
        return this.itemRecord.itemCat;
    }

    get itemName() {
        if (this.headerMsg != null) return "";
        return this.itemRecord.itemName;
    }

    get coreSortOrder() {
        if (this.coreRecord != null) return 69;
        return 0;
    }

    level(charLvl: number) {
        if (this.headerMsg != null) return 0;

        let totalStats = this.charInvRecord.strAdd + this.charInvRecord.dexAdd + this.charInvRecord.techAdd + this.charInvRecord.suppAdd;
        let totalOther = this.charInvRecord.defense + this.charInvRecord.resist + this.charInvRecord.damage;

        let statModel = [] as number[];
        let otherModel = [] as number[];

        switch (this.itemRecord.itemCat) {
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
                statModel = ItemSBox.ARMOR_STATS;
                otherModel = ItemSBox.ARMOR_POINTS;
                break;
            case ItemSBox.ITEM_CATEGORY_AUXILIARY_ID:
                statModel = ItemSBox.AUX_STATS;
                otherModel = ItemSBox.AUX_DAMAGE;
                break;
            case ItemSBox.ITEM_CATEGORY_BLADE_ID:
            case ItemSBox.ITEM_CATEGORY_CLUB_ID:
            case ItemSBox.ITEM_CATEGORY_MUTATE_ID:
            case ItemSBox.ITEM_CATEGORY_STAFF_ID:
                statModel = ItemSBox.PRIMARY_STATS;
                otherModel = ItemSBox.PRIMARY_DAMAGE;
                break;
            case ItemSBox.ITEM_CATEGORY_GUN_ID:
                statModel = ItemSBox.GUN_STATS;
                otherModel = ItemSBox.GUN_DAMAGE;
                break;
            case ItemSBox.ITEM_CATEGORY_SWORD_ID:
                statModel = ItemSBox.SWORD_STATS;
                otherModel = ItemSBox.PRIMARY_DAMAGE;
                break;
        }

        let itemLvl = 1;
        for (let i = statModel.length - 1; i >= 0; i--) {
            if (totalStats >= statModel[i] && totalOther >= otherModel[i]) {
                itemLvl = i; break;
            }
        } return Math.min(charLvl, itemLvl);
    }
}