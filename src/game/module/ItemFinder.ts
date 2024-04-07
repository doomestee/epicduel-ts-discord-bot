import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "../box/ItemBox.js";
import ItemFinderRecord from "../record/inventory/ItemFinderRecord.js";
import BaseModule from "./Base.js";

export default class ItemFinder extends BaseModule {
    constructor(public client: Client) {
        super();
    }

    fullList() {
        return Array.from(this.client.boxes.item.objMap.values());
    }

    static fullList() {
        return Array.from(ItemSBox.objMap.values());
    }

    /**
     * 
     * @param txt If number, will be used as the item ID and filterItemCat will be ignored (except if boolean). Note that this will still return even if the source isn't NPC.
     */
    search(txt: string | number, giveRecords: true) : ItemFinderRecord[];
    search(txt: string | number, giveRecords: false) : AnyItemRecordsExceptSelf[];
    search(txt: string | number, filterItemCat: number[] | boolean, giveRecords:true) : ItemFinderRecord[];
    search(txt: string | number, filterItemCat: number[] | boolean, giveRecords:false) : AnyItemRecordsExceptSelf[];
    search(txt: string | number, filterItemCat: number[] | boolean=[2,3,4,5,6,7,8,9,10,11,20], giveRecords=false) {
        if (typeof (filterItemCat) === "boolean") {
            giveRecords = filterItemCat;
            filterItemCat = [2,3,4,5,6,7,8,9,10,11,20];
        }

        if (typeof (txt) === "number") {
            let itemRec = this.client.boxes.item.objMap.get(txt);//._fullList.find(v => v.itemId === txt);
            if (itemRec === undefined) return [];

            if (!giveRecords) return [itemRec];
            else return [new ItemFinderRecord(itemRec, this.client)];
        }

        let list = [];
        let searchTxt = txt.toLowerCase();

        const fullList = this.fullList();

        for (let i = 0, len = fullList.length; i < len; i++) {
            let itemRecord = fullList[i];

            if (itemRecord.itemId !== 1 && itemRecord.itemSrcId !== ItemSBox.SOURCE_NPC_ONLY) {
                let itemName = itemRecord.itemName.toLowerCase();

                if ((searchTxt === "" || itemName.includes(searchTxt)) && filterItemCat.some(v => v === itemRecord.itemCat)) {
                    if (giveRecords) list.push(new ItemFinderRecord(itemRecord, this.client));
                    else list.push(itemRecord); 
                }
            }
        }

        return list;
    }


    /**
     * @param txt If number, will be used as the item ID and filterItemCat will be ignored (except if boolean). Note that this will still return even if the source isn't NPC.
     */
    static search(txt: string | number, giveRecords: true) : ItemFinderRecord[];
    static search(txt: string | number, giveRecords: false) : AnyItemRecordsExceptSelf[];
    static search(txt: string | number, filterItemCat: number[] | boolean, giveRecords:true) : ItemFinderRecord[];
    static search(txt: string | number, filterItemCat: number[] | boolean, giveRecords:false) : AnyItemRecordsExceptSelf[];
    static search(txt: string | number, filterItemCat: number[] | boolean=[2,3,4,5,6,7,8,9,10,11,20], giveRecords=false) {
        if (typeof (filterItemCat) === "boolean") {
            giveRecords = filterItemCat;
            filterItemCat = [2,3,4,5,6,7,8,9,10,11,20];
        }

        if (typeof (txt) === "number") {
            let itemRec = ItemSBox.objMap.get(txt);//._fullList.find(v => v.itemId === txt);
            if (itemRec === undefined) return [];

            if (!giveRecords) return [itemRec];
            else return [new ItemFinderRecord(itemRec)];
        }

        let list = [];
        let searchTxt = txt.toLowerCase();

        const fullList = this.fullList();

        for (let i = 0, len = fullList.length; i < len; i++) {
            let itemRecord = fullList[i];

            if (itemRecord.itemId !== 1 && itemRecord.itemSrcId !== ItemSBox.SOURCE_NPC_ONLY) {
                let itemName = itemRecord.itemName.toLowerCase();

                if ((searchTxt === "" || itemName.includes(searchTxt)) && filterItemCat.some(v => v === itemRecord.itemCat)) {
                    if (giveRecords) list.push(new ItemFinderRecord(itemRecord));
                    else list.push(itemRecord); 
                }
            }
        }

        return list;
    }

    /**
     * Alias for openModule
     */
    initModule() {
        // this._fullList = this.client.boxes.item.objMap.toArray();
        // yep this is pretty much that it
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MERCHANT_INVENTORY_ALL, {}, 2, "json");
    }
}