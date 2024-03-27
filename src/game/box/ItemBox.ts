import { Collection } from "oceanic.js";
import ItemRecord from "../record/item/SelfRecord.js";
import MissionItemRecord from "../record/item/MissionRecord.js";
import BikeItemRecord from "../record/item/BikeRecord.js";
import { BotItemRecord } from "../record/item/BotRecord.js";
import ArmorItemRecord from "../record/item/ArmorRecord.js";
import CoreItemRecord from "../record/item/CoreRecord.js";
import WeaponRecord from "../record/item/WeaponRecord.js";
import MissionRecord from "../record/mission/SelfRecord.js";
import User from "../sfs/data/User.js";

export type AnyItemRecordsExceptSelf = MissionItemRecord | BikeItemRecord | BotItemRecord | ArmorItemRecord | CoreItemRecord | WeaponRecord;

const _objMap = new Collection<number, AnyItemRecordsExceptSelf>();

export default class ItemSBox {
    //#region Permission (Sell or Buy)
    static SELL_PERM_NORMAL = 1;
    static SELL_PERM_NO_SALE = 2;
    
    static BUY_PERM_NORMAL = 0;
    static BUY_PERM_ONE = 1;
    static BUY_PERM_UNAVAIL = 2;
    //#endregion

    //#region Source
    static SOURCE_MERCHANT_SHOP = 0;
    static SOURCE_LEGACY = 1;
    static SOURCE_BATTLE_DROP = 2;
    static SOURCE_PROMO = 3;
    static SOURCE_NPC_ONLY = 4;
    static SOURCE_ARCADE_PRIZE = 5;
    static SOURCE_MISSION_ITEM = 6;
    //#endregion

    //#region Rare
    static RARE_NORMAL = 0;
    static RARE_SEASONAL = 1;
    static RARE_LIMITED = 2;
    static RARE_RARE = 3;
    static RARE_ULTRA = 4;
    static RARE_LEGENDARY = 5;
    static RARE_BATTLEPASS = 6;
    //#endregion

    static ITEM_CATEGORY_ALL = "All";
    static ITEM_CATEGORY_ARMOR = "Armor";
    static ITEM_CATEGORY_SWORD = "Sword";
    static ITEM_CATEGORY_CLUB = "Club";
    static ITEM_CATEGORY_STAFF = "Staff";
    static ITEM_CATEGORY_GUN = "Gun";
    static ITEM_CATEGORY_BLADE = "Blade";
    static ITEM_CATEGORY_AUXILIARY = "Auxiliary";
    static ITEM_CATEGORY_CORE = "Core";
    static ITEM_CATEGORY_VEHICLE = "Vehicle";
    static ITEM_CATEGORY_BOT = "Bot";
    static ITEM_CATEGORY_MISSION = "Mission";
    static ITEM_CATEGORY_PRIMARY = "Primary";

    static ITEM_CATEGORY_ALL_ID = 1;
    static ITEM_CATEGORY_ARMOR_ID = 2;
    static ITEM_CATEGORY_SWORD_ID = 3;
    static ITEM_CATEGORY_CLUB_ID = 4;
    static ITEM_CATEGORY_STAFF_ID = 5;
    static ITEM_CATEGORY_GUN_ID = 6;
    static ITEM_CATEGORY_BLADE_ID = 7;
    static ITEM_CATEGORY_AUXILIARY_ID = 8;
    static ITEM_CATEGORY_CORE_ID = 9;
    static ITEM_CATEGORY_VEHICLE_ID = 10;
    static ITEM_CATEGORY_BOT_ID = 11;
    static ITEM_CATEGORY_MISSION_ID = 12;
    static ITEM_CATEGORY_MUTATE_ID = 20;
    static ITEM_CATEGORY_PRIMARY_ID = 21;

    static ITEM_CATEGORY_MAPPED_BY_ID = [null, "All", "Armor", "Sword", "Club", "Staff", "Gun", "Blade", "Auxiliary", "Core", "Vehicle", "Bot", "Mission", null, null, null, null, null, null, null, "Mutate", "Primary"]

    static PRIMARY_DAMAGE = [0,110,110,110,110,110,110,120,130,130,140,150,160,160,170,180,190,190,200,210,220,220,230,240,240,250,260,270,270,280,290,300,300,310,320,330,330,340,340,340,350];
    static GUN_DAMAGE = [0,110,110,110,110,110,120,130,130,140,150,160,160,170,180,190,190,200,210,210,220,230,240,240,250,260,270,270,280,290,300,300,310,320,320,330,340,340,340,350,350];
    static AUX_DAMAGE = [0,140,140,140,140,150,160,160,170,180,190,190,200,210,210,220,230,240,240,250,260,270,270,280,290,300,300,310,320,320,330,340,350,350,360,370,380,380,390,390,400];
    static ARMOR_POINTS = [0,0,0,0,0,0,0,0,0,0,10,10,10,20,20,30,30,40,40,40,50,50,50,60,60,60,70,70,70,80,80,80,90,90,90,100,100,110,110,110,120];
    static SWORD_STATS = [0,1,2,2,3,3,4,4,5,5,6,7,7,8,9,9,10,11,11,12,13,14,15,15,16,17,18,19,20,20,21,22,23,23,24,25,26,26,27,27,28];
    static PRIMARY_STATS = [0,1,2,2,3,3,4,4,5,5,6,7,7,8,9,9,10,11,11,12,13,14,15,15,16,17,18,19,20,20,21,22,23,23,24,25,26,26,27,27,28];
    static GUN_STATS = [0,1,2,3,3,4,4,5,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21];
    static AUX_STATS = [0,1,2,3,3,4,4,5,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21];
    static ARMOR_STATS = [0,1,2,3,4,5,6,6,7,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24];

    static _basicItemList = [4,6,31,1889,1890];

    ready = false;

    protected _data = [null, null, null, null] as unknown as [string[], string[], string[], string[]];

    protected _merchantInvList = {} as { [merchantId: number]: number[] };
    protected _itemMerchantList = {} as { [itemId: number]: [npcId: number] };

    templates = {
        self: ["itemId","itemName","itemCredits","itemVarium","itemLinkage","itemRareId","itemSrcId","itemBuyPerm","itemSellPerm","itemCat"],
        mission: ["itemId","itemDesc"],
        bike: ["itemId"],
        bot: ["itemId","itemDamage","itemDmgType","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"],
        armor: ["itemId","itemSexReq","itemClass","customHeadLink","noHead","noHip","defaultLimbs","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"],
        core: ["itemId","coreId","maxCharges"],
        weapon: ["itemId","itemClass","itemDmgType","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"],
    }

    _basicItemList = [4,6,31,1889,1890];

    items = {
        mission: [] as { [x: string]: any }[],
        bot: [] as { [x: string]: any }[],
        armor: [] as { [x: string]: any }[],
        core: [] as { [x: string]: any }[],
        weapon: [] as { [x: string]: any }[]
    };

    get objMap() {
        return _objMap;
    }

    static get objMap() {
        return _objMap;
    }

    get merchantInvList() {
        return this._merchantInvList;
    }

    set merchantInvList(value) {
        this._itemMerchantList = [];
        this._merchantInvList = value;

        const items = Array.from(this.objMap.values());

        for (let i = 0; i < items.length; i++) {
            const itemRecord = items[i];
            const mchId = this.findMerchantWithItem(itemRecord.itemId);

            //@ts-expect-error
            if (this._itemMerchantList[itemRecord.itemId] == undefined) this._itemMerchantList[itemRecord.itemId] = [];
            this._itemMerchantList[itemRecord.itemId].push(mchId);
        }
    }

    /**
     * Note that unfortunately, the game only gives one merchant id for each item, either that or just 0 if none sells it. If ther'es a multiple NPCs selling the same thing, the game only shows one.
     * @param {*} itemId
     * @returns {number[]}
     */
    getMerchantIdsForItem(itemId: number) : [npcId: number] | [] {
        let i = this._itemMerchantList[itemId];
        if (i != null && i.length > 0) return i;
        return [];
    }

    findMerchantWithItem(itemId: number) {
        if (this.merchantInvList[itemId] == undefined || this.merchantInvList[itemId].length < 1) throw Error("merchantInvList not yet populated");

        for (let str in this.merchantInvList) {
            if (this.merchantInvList[str].indexOf(itemId) !== -1) return Number(str);
        }; return 0;
    }

    populate(number: number, param1: string[]) {
        this._data[number - 1] = param1.slice(2);

        if (this._data.some(v => v === null)) return false;
        this.objMap.clear();

        // I'm ashamed to be copying ED code work now, but somehow mine didn't work so...

        let breakIndex = 0;
        let fromIndex = 0;

        let fullData = [] as string[];
        fullData = fullData.concat(this._data[0]);
        fullData = fullData.concat(this._data[1]);
        fullData = fullData.concat(this._data[2]);
        fullData = fullData.concat(this._data[3]);

        fromIndex = 0;              breakIndex = fullData.indexOf("#", fromIndex);
        let itemData = fullData.slice(fromIndex, breakIndex);

        fromIndex = breakIndex + 1; breakIndex = fullData.indexOf("#", fromIndex);
        let dWeapon = fullData.slice(fromIndex,breakIndex);

        fromIndex = breakIndex + 1; breakIndex = fullData.indexOf("#", fromIndex);
        let dCore = fullData.slice(fromIndex, breakIndex);

        fromIndex = breakIndex + 1; breakIndex = fullData.indexOf("#", fromIndex);
        let dArmor = fullData.slice(fromIndex, breakIndex);

        fromIndex = breakIndex + 1; breakIndex = fullData.indexOf("#",fromIndex);
        let dBot = fullData.slice(fromIndex, breakIndex);

        fromIndex = breakIndex + 1; breakIndex = fullData.indexOf("#",fromIndex);
        let dMission = fullData.slice(fromIndex, breakIndex);

        fromIndex = breakIndex + 1;
        breakIndex = fullData.indexOf("#",fromIndex);

        this.populateDataProvider(this.items.mission, dMission, this.templates.mission);
        this.populateDataProvider(this.items.bot, dBot, this.templates.bot);
        this.populateDataProvider(this.items.armor, dArmor, this.templates.armor);
        this.populateDataProvider(this.items.core, dCore, this.templates.core);
        this.populateDataProvider(this.items.weapon, dWeapon, this.templates.weapon);

        let fieldCount = this.templates.self.length;
        let itemCount = itemData.length / fieldCount;

        let craft = (obj: any) => {
            this.objMap.set(obj.itemId, obj);
        }

        for (let r = 0; r < itemCount; r++) {
            let record = {} as { [x: string]: string };

            for (let f = 0; f < fieldCount; f++) {
                record[this.templates.self[f]] = fullData[f + r * fieldCount];
            }

            let itemId = parseInt(record.itemId);
            let isWeapon = this.itemIsWeapon(parseInt(record.itemCat));

            if (isWeapon) {
                craft(new WeaponRecord(this.buildRecord(record, this.getItemDetails(itemId, this.items.weapon))));
                continue;
            }

            switch(parseInt(record.itemCat)) {
                case ItemSBox.ITEM_CATEGORY_CORE_ID:
                    craft(new CoreItemRecord(this.buildRecord(record, this.getItemDetails(itemId, this.items.core))));
                    break;
                case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
                    craft(new ArmorItemRecord(this.buildRecord(record, this.getItemDetails(itemId, this.items.armor))));
                    break;
                case ItemSBox.ITEM_CATEGORY_BOT_ID:
                    craft(new BotItemRecord(this.buildRecord(record, this.getItemDetails(itemId, this.items.bot))));
                    break;
                case ItemSBox.ITEM_CATEGORY_VEHICLE_ID:
                    craft(new ItemRecord(record));//this.buildRecord(record, this.getItemDetails(itemId, this.items.veh)));
                    break;
                case ItemSBox.ITEM_CATEGORY_MISSION_ID:
                    craft(new MissionRecord(this.buildRecord(record, this.getItemDetails(itemId, this.items.mission))));
                    break;
            }
        }

        this.ready = true;

        return true;
    }

    /**
     * @param {number} param1 
     * @param {Array} param2 DataProvider
     * @returns
     */
    getItemDetails(param1: number, param2: any[]) {
        for (let i = 0; i < param2.length; i++) {
            let obj = param2[i];
            
            if (obj.itemId == param1) return obj;
        } return null;
    }

    buildRecord(obj1: any, obj2: any) {
        let newRecord = {} as Record<string, any>;

        for (let str1 in obj1) {
            newRecord[str1] = obj1[str1];
        }

        for (let str2 in obj2) {
            newRecord[str2] = obj2[str2];
        }

        return newRecord;
    }

    /**
     * @param {Array} listToStoreIn 
     * @param {Array} data 
     * @param {string[]} fieldNames 
     */
    populateDataProvider(listToStoreIn: any[], data: any[], fieldNames: string[]) {
        let i = 0;

        while (i < (data.length / fieldNames.length)) {
            let y = 0; let obj = {} as Record<string, string>;

            while (y < (fieldNames.length)) {
                obj[fieldNames[y]] = data[y + i * fieldNames.length];
                y++;
            }

            listToStoreIn[i] = obj;
            i++;
        }
    }
    
    getItemById(itemId: number, passByRef=false) : AnyItemRecordsExceptSelf | null {
        let item;

        if ((item = this.objMap.get(itemId)) === undefined) return null;
        
        if (passByRef) return item;
        else return JSON.parse(JSON.stringify(item));
    }

    static getItemById(itemId: number, passByRef=false) : AnyItemRecordsExceptSelf | null {
        let item;

        if ((item = this.objMap.get(itemId)) === undefined) return null;
        
        if (passByRef) return item;
        else return JSON.parse(JSON.stringify(item));
    }

    static getItemCatById(itemId: number) : number | null {
        return this.getItemById(itemId)?.itemCat ?? null;
    }

    getItemCatById(itemId: number) : number | null {
        return this.getItemById(itemId)?.itemCat ?? null;
    }

    getClassWpnCategoryId(classId: number) {
        let adjusted = classId;
        if (classId > 3) adjusted = classId - 3;

        switch (adjusted) {
            case 3: // Tech mage
                return ItemSBox.ITEM_CATEGORY_STAFF_ID;
            case 2: // Mercenary
                return ItemSBox.ITEM_CATEGORY_CLUB_ID;
            case 1: // Bounty hunter
                return ItemSBox.ITEM_CATEGORY_BLADE_ID
            default:
                return 0;
        }
    }

    static getClassWpnCategoryId(classId: number) {
        let adjusted = classId;
        if (classId > 3) adjusted = classId - 3;

        switch (adjusted) {
            case 3: // Tech mage
                return this.ITEM_CATEGORY_STAFF_ID;
            case 2: // Mercenary
                return this.ITEM_CATEGORY_CLUB_ID;
            case 1: // Bounty hunter
                return this.ITEM_CATEGORY_BLADE_ID
            default:
                return 0;
        }
    }

    /**
     * @param {number} itemCat 
     * @param {import("../data/User")} user 
     */
    getAdjustedItemCategoryId(itemCat: number, user: User) {
        switch (itemCat) {
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
            case ItemSBox.ITEM_CATEGORY_SWORD_ID:
            case ItemSBox.ITEM_CATEGORY_CLUB_ID:
            case ItemSBox.ITEM_CATEGORY_STAFF_ID:
            case ItemSBox.ITEM_CATEGORY_GUN_ID:
            case ItemSBox.ITEM_CATEGORY_BLADE_ID:
            case ItemSBox.ITEM_CATEGORY_AUXILIARY_ID:
            case ItemSBox.ITEM_CATEGORY_VEHICLE_ID:
            case ItemSBox.ITEM_CATEGORY_BOT_ID:
            case ItemSBox.ITEM_CATEGORY_MISSION_ID:
            case ItemSBox.ITEM_CATEGORY_CORE_ID: return itemCat;
            case ItemSBox.ITEM_CATEGORY_MUTATE_ID: return this.getClassWpnCategoryId(user.charClassId);
            default: return -1
        }
    }
    /**
     * @param {number} itemCat 
     * @param {number} classId 
     */
    getItemCategoryName(itemCat: number, classId = 1) : string {
        switch(itemCat) {
            case ItemSBox.ITEM_CATEGORY_ALL_ID: return ItemSBox.ITEM_CATEGORY_ALL;
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID: return ItemSBox.ITEM_CATEGORY_ARMOR;
            case ItemSBox.ITEM_CATEGORY_SWORD_ID: return ItemSBox.ITEM_CATEGORY_SWORD;
            case ItemSBox.ITEM_CATEGORY_CLUB_ID: return ItemSBox.ITEM_CATEGORY_CLUB;
            case ItemSBox.ITEM_CATEGORY_STAFF_ID: return ItemSBox.ITEM_CATEGORY_STAFF;
            case ItemSBox.ITEM_CATEGORY_GUN_ID: return ItemSBox.ITEM_CATEGORY_GUN;
            case ItemSBox.ITEM_CATEGORY_BLADE_ID: return ItemSBox.ITEM_CATEGORY_BLADE;
            case ItemSBox.ITEM_CATEGORY_AUXILIARY_ID: return ItemSBox.ITEM_CATEGORY_AUXILIARY;
            case ItemSBox.ITEM_CATEGORY_CORE_ID: return ItemSBox.ITEM_CATEGORY_CORE;
            case ItemSBox.ITEM_CATEGORY_VEHICLE_ID: return ItemSBox.ITEM_CATEGORY_VEHICLE;
            case ItemSBox.ITEM_CATEGORY_BOT_ID: return ItemSBox.ITEM_CATEGORY_BOT;
            case ItemSBox.ITEM_CATEGORY_MISSION_ID: return ItemSBox.ITEM_CATEGORY_MISSION;
            case ItemSBox.ITEM_CATEGORY_MUTATE_ID: return this.getItemCategoryName(this.getClassWpnCategoryId(classId), classId);
            default: return "";
        }
    }

    /**
     * Static
     * @param {number} itemCat 
     * @param {number} classId 
     */
    static getItemCategoryName(itemCat: number, classId = 1) : string {
        switch(itemCat) {
            case this.ITEM_CATEGORY_ALL_ID: return this.ITEM_CATEGORY_ALL;
            case this.ITEM_CATEGORY_ARMOR_ID: return this.ITEM_CATEGORY_ARMOR;
            case this.ITEM_CATEGORY_SWORD_ID: return this.ITEM_CATEGORY_SWORD;
            case this.ITEM_CATEGORY_CLUB_ID: return this.ITEM_CATEGORY_CLUB;
            case this.ITEM_CATEGORY_STAFF_ID: return this.ITEM_CATEGORY_STAFF;
            case this.ITEM_CATEGORY_GUN_ID: return this.ITEM_CATEGORY_GUN;
            case this.ITEM_CATEGORY_BLADE_ID: return this.ITEM_CATEGORY_BLADE;
            case this.ITEM_CATEGORY_AUXILIARY_ID: return this.ITEM_CATEGORY_AUXILIARY;
            case this.ITEM_CATEGORY_CORE_ID: return this.ITEM_CATEGORY_CORE;
            case this.ITEM_CATEGORY_VEHICLE_ID: return this.ITEM_CATEGORY_VEHICLE;
            case this.ITEM_CATEGORY_BOT_ID: return this.ITEM_CATEGORY_BOT;
            case this.ITEM_CATEGORY_MISSION_ID: return this.ITEM_CATEGORY_MISSION;
            case this.ITEM_CATEGORY_MUTATE_ID: return this.getItemCategoryName(this.getClassWpnCategoryId(classId), classId);
            default: return "";
        }
    }

    getMaxItemDmg(itemCat=0, charLvl=1) {
        switch(itemCat) {
            case ItemSBox.ITEM_CATEGORY_AUXILIARY_ID:
                return ItemSBox.AUX_DAMAGE[charLvl];
            case ItemSBox.ITEM_CATEGORY_GUN_ID:
                return (ItemSBox.GUN_DAMAGE[charLvl]);
            case ItemSBox.ITEM_CATEGORY_BLADE_ID:
            case ItemSBox.ITEM_CATEGORY_CLUB_ID:
            case ItemSBox.ITEM_CATEGORY_STAFF_ID:
            case ItemSBox.ITEM_CATEGORY_MUTATE_ID:
                return (ItemSBox.PRIMARY_DAMAGE[charLvl]);
            case ItemSBox.ITEM_CATEGORY_SWORD_ID:
                return ItemSBox.PRIMARY_DAMAGE[charLvl] + 10;
            default:
                return 0;
        } return 0;
    }

    static getMaxItemDmg(itemCat=0, charLvl=1) {
        switch(itemCat) {
            case this.ITEM_CATEGORY_AUXILIARY_ID:
                return this.AUX_DAMAGE[charLvl];
            case this.ITEM_CATEGORY_GUN_ID:
                return (this.GUN_DAMAGE[charLvl]);
            case this.ITEM_CATEGORY_BLADE_ID:
            case this.ITEM_CATEGORY_CLUB_ID:
            case this.ITEM_CATEGORY_STAFF_ID:
            case this.ITEM_CATEGORY_MUTATE_ID:
                return (this.PRIMARY_DAMAGE[charLvl]);
            case this.ITEM_CATEGORY_SWORD_ID:
                return this.PRIMARY_DAMAGE[charLvl] + 10;
            default:
                return 0;
        } return 0;
    }

    itemIsWeapon(itemCat=1) {
        if (typeof itemCat !== "number") itemCat = parseInt(itemCat);
        let weaponCategories = [ItemSBox.ITEM_CATEGORY_SWORD_ID,ItemSBox.ITEM_CATEGORY_CLUB_ID,ItemSBox.ITEM_CATEGORY_BLADE_ID,ItemSBox.ITEM_CATEGORY_STAFF_ID,ItemSBox.ITEM_CATEGORY_GUN_ID,ItemSBox.ITEM_CATEGORY_AUXILIARY_ID,ItemSBox.ITEM_CATEGORY_PRIMARY_ID,ItemSBox.ITEM_CATEGORY_MUTATE_ID];
        return weaponCategories.indexOf(itemCat) != -1;
    }

    static itemIsWeapon(itemCat=1) {
        if (typeof itemCat !== "number") itemCat = parseInt(itemCat);
        let weaponCategories = [this.ITEM_CATEGORY_SWORD_ID,this.ITEM_CATEGORY_CLUB_ID,this.ITEM_CATEGORY_BLADE_ID,this.ITEM_CATEGORY_STAFF_ID,this.ITEM_CATEGORY_GUN_ID,this.ITEM_CATEGORY_AUXILIARY_ID,this.ITEM_CATEGORY_PRIMARY_ID,this.ITEM_CATEGORY_MUTATE_ID];
        return weaponCategories.indexOf(itemCat) != -1;
    }

    static rareText(rareId=0, joiner='-') {
        switch (rareId) {
            case this.RARE_NORMAL: return "Normal";
            case this.RARE_SEASONAL: return "Seasonal" + joiner + "Rare";
            case this.RARE_LIMITED: return "Limited" + joiner + "Rare";
            case this.RARE_RARE: return "Rare";
            case this.RARE_ULTRA: return "Ultra" + joiner + "Rare";
            case this.RARE_LEGENDARY: return "Legendary" + joiner + "Rare";
            case this.RARE_BATTLEPASS: return "Battlepass";
        }; return null;
    }

    static sourceText(sourceId=0, pre=true) {
        switch (sourceId) {
            case this.SOURCE_MERCHANT_SHOP: return pre ? "This was/is from a merchant's shop." : "A Merchant's Shop";
            case this.SOURCE_LEGACY: return pre ? "This is a legacy item, no longer available." : "Legacy Item";
            case this.SOURCE_BATTLE_DROP: return pre ? "This was/is a battle drop." : "Battle Drop";
            case this.SOURCE_PROMO: return pre ? "This was/is from a promo, exchanged for artix points." : "A Promo";
            case this.SOURCE_NPC_ONLY: return pre ? "This was/is dropped from a NPC." : "NPC Drop...?";
            case this.SOURCE_ARCADE_PRIZE: return pre ? "This is a prize from an arcade." : "Arcade Prize";
            case this.SOURCE_MISSION_ITEM: return pre ? "This is an item rewarded from a mission..?" : "Mission Reward";
        }
    }
}