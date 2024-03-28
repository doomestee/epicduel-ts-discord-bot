import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import ItemSBox from "../box/ItemBox.js";
import CharacterInvRecord from "../record/CharacterInvRecord.js";
import InventoryListItem from "../record/inventory/InventoryListItem.js";
import User from "../sfs/data/User.js";
import BaseModule from "./Base.js";

export default class Inventory extends BaseModule {
    selectedItem?:InventoryListItem;

    equippedList:InventoryListItem[] = [];
    list:InventoryListItem[] = [];

    constructor(public client: Client) {
        super();
    }

    addItemToInventoryList(listItem: InventoryListItem) {
        this.list.push(listItem);
    }

    refreshItemInInventory(listItem: InventoryListItem) {
        if (listItem.charInvRecord.isBanked) {
            console.log(listItem.itemName + " is in your bank now!"); return;
        }// if (!this.list.some(v => v.charInvId == listItem.charInvId)) return;
    }

    /**
     * @param {number} itemInvId 
     * @param {number} itemId 
     * @param {boolean} allowDuplicates 
     * @param {number} creditSpend 
     * @param {number} variumSpend 
     * @param {number} itemDamage 
     * @param {number} passiveCoreItemId 
     * @param {number} activeCoreItemId 
     * @param {number} unlockedLevel 
     */
    addItemFromServer(itemInvId: number, itemId: number, allowDuplicates = true, creditSpend = 0, variumSpend = 0, itemDamage = 0, passiveCoreItemId = 0, activeCoreItemId = 0, unlockedLevel = 0) {
        let proceed = true;
        if (!allowDuplicates) {
            for (let i = 0; i < this.list.length; i++) {
                if (this.list[i].itemId == itemId) proceed = false;
                if (!proceed) break;
            }
        }

        if (!proceed) return;

        let itemRecord = ItemSBox.getItemById(itemId);

        if (!itemRecord) throw Error("unknown item id: " + itemId);

        let activeCoreItem = ItemSBox.getItemById(activeCoreItemId);
        let passiveCoreItem = ItemSBox.getItemById(passiveCoreItemId);

        let c = new CharacterInvRecord({
            charInvId: itemInvId,      itemEquipped: false,
            itemId: itemRecord.itemId, strAdd: 0,
            dexAdd: 0, techAdd: 0,  suppAdd: 0,
            damage: itemDamage == 0 ? (ItemSBox.getMaxItemDmg(itemRecord.itemCat, 1)) : itemDamage,
            defense: 0, resist: 0,
            corePassiveId: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.coreId : 0,
            coreActiveId: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.coreId : 0,
            corePassiveQty: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.maxCharges : 0,
            coreActiveQty: activeCoreItem?.isCoreItemRecord() ? activeCoreItem.maxCharges : 0,
            creditSpend, variumSpend, unlockedLevel,
            invQty: 1, isBanked: false
        });

        let newListItem = new InventoryListItem(itemRecord, c);
        this.list.push(newListItem);
    }

    addItemsFromServer(itemInvId: number, itemId: number, invQuantity = 1, corePassiveQty = 0, coreActiveQty = 0, creditSpend = 0, variumSpend = 0, itemDamage = 0, passiveCoreItemId = 0, activeCoreItemId = 0, unlockedLevel = 0) {
        let itemRecord = ItemSBox.getItemById(itemId);

        if (!itemRecord) throw Error("unknown item id " + itemId);

        for (let i = 0; i < this.list.length; i++) {
            let myListItem = this.list[i];
            if (myListItem.charInvRecord.charInvId == itemInvId) {
                if (myListItem.charInvRecord.invQty + invQuantity > 32767) {
                    invQuantity = 32767 - myListItem.charInvRecord.invQty;
                }
                myListItem.charInvRecord.invQty += invQuantity;
                this.refreshItemInInventory(myListItem);
            }
        }

        let activeCoreItem = ItemSBox.getItemById(activeCoreItemId);
        let passiveCoreItem = ItemSBox.getItemById(passiveCoreItemId);

        let c = new CharacterInvRecord({
            charInvId: itemInvId, itemEquipped: false,
            itemId: itemRecord.itemId,
            strAdd: 0, dexAdd: 0,
            techAdd: 0, suppAdd: 0,
            damage: itemDamage == 0 ? ItemSBox.getMaxItemDmg(itemRecord.itemCat, 1) : itemDamage,
            defense: 0, resist: 0,
            corePassiveId: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.coreId : 0,
            coreActiveId: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.coreId : 0,
            corePassiveQty: passiveCoreItem?.isCoreItemRecord() ? passiveCoreItem.maxCharges : 0,
            coreActiveQty: activeCoreItem?.isCoreItemRecord() ? activeCoreItem.maxCharges : 0,
            creditSpend, variumSpend,
            invQty: invQuantity,
            isBanked: false,
            unlockedLevel
        });

        let newListItem = new InventoryListItem(itemRecord, c);
        this.list.push(newListItem);
    }

    buyItemComplete(param1: any) {
        // let itemRecord = ItemSBox.getItemById(param1.itemId);

        // if (!itemRecord) throw Error("unknown item id " + param1.itemId);

        // if (Boolean(param1.noSale)) {
        //     if (parseInt(param1.variumPrice) == 0) {
        //         console.log("You need credits (" + param1.variumPrice + ") to buy.");
        //     }
        // } else if (Boolean(param1.noQty)) {
        //     console.log("Item's out of stock.");
        // } else if (Boolean(param1.own)) {
        //     console.log("You already own one.");
        // } else if (param1.legendErr) {
        //     console.log("Lacks legendary requirement to buy the item.");
        // } else {
        //     let loc5 = true;
        //     for (let i = 0; i < this.list.length; i++) {
        //         let itm = this.list[i];
        //         if (itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_MISSION_ID && itm.itemRecord.itemId == param1.itemId) {
        //             loc5 = false; break;
        //         } else if (itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_CORE_ID && itm.charInvId == param1.charInvId) {
        //             loc5 = false; break;
        //         }
        //     }

        //     if (loc5) {
        //         let activeCoreItem = ItemSBox.getItemById(activeCoreItemId);
        //         let passiveCoreItem = ItemSBox.getItemById(passiveCoreItemId);

        //         let _loc9_ = new CharacterInvRecord({
        //             charInvId: param1.charInvId,
        //             itemEquipped: false, itemId: itemRecord.itemId,
        //             strAdd: param1.str, dexAdd: param1.dex,
        //             techAdd: param1.tech, suppAdd: param1.supp,
        //             damage: param1.dmg, defense: param1.def, resist: param1.res,
        //             creditSpend: param1.creditPrice, variumSpend: param1.variumPrice,
        //             isBanked: false, invQty: 1,
        //             unlockedLevel: 1,
        //             coreActiveId: 
        //         });
        //         _loc9_.damage = param1.dmg;
        //         _loc9_.defense = param1.def;
        //         _loc9_.resist = param1.res;
        //         _loc9_.creditSpend = param1.creditPrice;
        //         _loc9_.variumSpend = param1.variumPrice;
        //         _loc9_.isBanked = 0; _loc9_.invQty = 1;
        //         if(itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_CORE_ID) {
        //             let _loc12_ = SkillsBox.recordById("core", itemRecord.coreId);
        //             if(_loc12_ != null)
        //             {
        //                 if(_loc12_.coreType == 0)
        //                 {
        //                     _loc9_.corePassiveId = itemRecord.coreId;
        //                     _loc9_.corePassiveQty = itemRecord.maxCharges;
        //                 }
        //                 else if(_loc12_.coreType == 1)
        //                 {
        //                     _loc9_.coreActiveId = itemRecord.coreId;
        //                     _loc9_.coreActiveQty = itemRecord.maxCharges;
        //                 }
        //             }
        //         } else {
        //             let _loc13_ = SkillsBox.recordById(itemRecord.corePassiveItemId);
        //             if(_loc13_ != null) {
        //                 _loc9_.corePassiveId = _loc13_.coreId;
        //                 _loc9_.corePassiveQty = _loc13_.maxCharges;
        //             } else {
        //                 _loc9_.corePassiveId = 0;
        //                 _loc9_.corePassiveQty = 0;
        //             }
        //             let _loc14_ = ItemSBox.getItemById(itemRecord.coreActiveItemId);
        //             if(_loc14_ != null)
        //             {
        //                 _loc9_.coreActiveId = _loc14_.coreId;
        //                 _loc9_.coreActiveQty = _loc14_.maxCharges;
        //             }
        //             else
        //             {
        //                 _loc9_.coreActiveId = 0;
        //                 _loc9_.coreActiveQty = 0;
        //             }
        //         }

        //         let _loc10_ = new InventoryListItem(itemRecord, _loc9_);
        //         if ([4, 6, 31, 1889, 1890].some(v => v == (_loc10_.itemRecord.itemId))) console.log("Basic bitch item");
        //         else console.log(_loc10_.itemRecord.itemName + " bought!");//NotificationModule.instance.createNotification(new Window_304_97(GlobalLanguage.loadStringParams("DYN_merch_msg_bought",[_loc10_.itemRecord.itemName])),4,450,150);
                
        //         let loc11 = this.addItemToInventoryList(loc10);

        //     } else {
        //         for (let i = 0; i < this.list.length; i++) {
        //             let loc6 = this.list[i];
        //             if (loc6.charInvId == param1.charInvId) {
        //                 if (loc6.charInvRecord.invQty < 32767) {
        //                     loc6.charInvRecord.invQty += 1;
        //                     this.refreshItemInInventory(loc6);
        //                 }
        //                 break;
        //             }
        //         }
        //     }

        //     this.client.currency.credits -= parseInt(param1.creditPrice);
        //     this.client.currency.varium -= parseInt(param1.variumPrice);;
        // }
        // /*
        // if(MerchantModule.instance.ui.merchant_list.length > 0)
        //  {
        //     if(MerchantModule.instance.ui.merchant_list.selectedItem != null)
        //     {
        //        if(param1.qtyLeft != undefined)
        //        {
        //           MerchantModule.instance.ui.merchant_list.selectedItem.qtyLeft = param1.qtyLeft;
        //        }
        //        MerchantModule.instance.showMerchantItem(MerchantModule.instance.ui.merchant_list.selectedItem as InventoryListItem);
        //     }
        //  }*/
    }

    clientAlreadyOwnsItem(itemId: number) {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].itemId == itemId) return true;
        } return false;
    }

    /**
     * @param {CharacterInvRecord} item 
     * @param {Object} obj
     * @param {number} obj.dmg
     * @param {number} obj.def
     * @param {number} obj.res
     * @param {number} obj.str
     * @param {number} obj.dex
     * @param {number} obj.tech
     * @param {number} obj.supp
     * @param {number} obj.upgradePriceCredits
     * @param {number} obj.upgradePriceVarium
     * @param {number} obj.payMode 1 for with Credits, 2 for Varium, 3 for Class Coupon, 4 for Skill Coupon, 5 for Gear Coupon
     */
    confirmItemUpgrade(item: CharacterInvRecord, obj: { dmg: number, def: number, res: number, str: number, dex: number, tech: number, supp: number, upgradePriceCredits: number, upgradePriceVarium: number, payMode: number }) {
        let buy = {} as Record<string, unknown>;
        buy.payMode = obj.payMode;
        buy.invId = item.charInvId;
        buy.dmg = obj.dmg;
        buy.def = obj.def;
        buy.res = obj.res;
        buy.str = obj.str;
        buy.dex = obj.dex;
        buy.tech = obj.tech;
        buy.supp = obj.supp;
        buy.pCredits = obj.upgradePriceCredits;
        buy.pVarium = obj.upgradePriceVarium;
        buy.bCredits = this.client.currency.credits;
        buy.bVarium = this.client.currency.varium;
        
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_UPGRADE_ITEM, buy, 1, "json");
    }

    /**
     * @param {InventoryListItem} item 
     */
    equipItem(item: InventoryListItem) {
        let itemRecord = item.itemRecord;

        if (!this.client.getMyUserFr().canEquipItem(itemRecord)) {
            return console.log("Item cannot be equipped due to insufficient requirements.")
        }

        this.equipItemOnPlayer(this.client.getMyUserFr(), true, undefined, item);
    }

    /**
     * 
     * @param {import("../data/User")} user 
     * @param {boolean} equip 
     * @param {} player 
     * @param {InventoryListItem} listItem 
     * @param {boolean} sendUpdate default true
     */
    equipItemOnPlayer(user: User, equip: boolean, player: undefined, listItem: InventoryListItem, sendUpdate=true) {
        if (listItem == null) return;
        let newCharInvId = 0;
        if (listItem.charInvId != 0) newCharInvId = equip ? listItem.charInvId : -1;
        let newItemId = equip ? listItem.itemRecord.itemId : -1;
        let isWeapon = [ItemSBox.ITEM_CATEGORY_SWORD_ID,ItemSBox.ITEM_CATEGORY_CLUB_ID,ItemSBox.ITEM_CATEGORY_BLADE_ID,ItemSBox.ITEM_CATEGORY_STAFF_ID,ItemSBox.ITEM_CATEGORY_GUN_ID,ItemSBox.ITEM_CATEGORY_AUXILIARY_ID,ItemSBox.ITEM_CATEGORY_PRIMARY_ID,ItemSBox.ITEM_CATEGORY_MUTATE_ID].some(v => v == listItem.itemRecord.itemCat);

        if (!this.client.smartFox.connected) return;
        let room = this.client.smartFox.getActiveRoom();
        if (room == null) return;
        let myUser = room.getUser(this.client.smartFox.myUserId);
        if (myUser == null) return;
        listItem.charInvRecord.itemEquipped = equip;
        let oldCharInvId = -1;
        let oldItemId = -1;
        let localVars = {} as Record<string, string | number | null>;

        switch (listItem.itemRecord.itemCat) {
            case ItemSBox.ITEM_CATEGORY_GUN_ID:
                if (equip) {
                    localVars.iGun = listItem.data;
                    localVars.gunStrAdd = listItem.charInvRecord.strAdd;
                    localVars.gunDexAdd = listItem.charInvRecord.dexAdd;
                    localVars.gunTechAdd = listItem.charInvRecord.techAdd;
                    localVars.gunSuppAdd = listItem.charInvRecord.suppAdd;
                    localVars.gunDmg = listItem.charInvRecord.damage;
                } else {
                    localVars.iGun = null;
                    localVars.gunStrAdd = 0;
                    localVars.gunDexAdd = 0;
                    localVars.gunTechAdd = 0;
                    localVars.gunSuppAdd = 0;
                    localVars.gunDmg = 0;
                }
                break;
            case ItemSBox.ITEM_CATEGORY_AUXILIARY_ID:
                if (equip) {
                    localVars.iAux = listItem.data;
                    localVars.auxStrAdd = listItem.charInvRecord.strAdd;
                    localVars.auxDexAdd = listItem.charInvRecord.dexAdd;
                    localVars.auxTechAdd = listItem.charInvRecord.techAdd;
                    localVars.auxSuppAdd = listItem.charInvRecord.suppAdd;
                    localVars.auxDmg = listItem.charInvRecord.damage;
                } else {
                    localVars.iAux = null;
                    localVars.auxStrAdd = 0;
                    localVars.auxDexAdd = 0;
                    localVars.auxTechAdd = 0;
                    localVars.auxSuppAdd = 0;
                    localVars.auxDmg = 0;
                }
                break;
            case ItemSBox.ITEM_CATEGORY_BOT_ID:
                if (equip) localVars.iBot = listItem.data;
                else localVars.iBot = null;
                break;
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
                if (equip) {
                   localVars.charArm = listItem.itemId;
                   localVars.armorStrAdd = listItem.charInvRecord.strAdd;
                   localVars.armorDexAdd = listItem.charInvRecord.dexAdd;
                   localVars.armorTechAdd = listItem.charInvRecord.techAdd;
                   localVars.armorSuppAdd = listItem.charInvRecord.suppAdd;
                   localVars.armorDefense = listItem.charInvRecord.defense;
                   localVars.armorResist = listItem.charInvRecord.resist;
                }
                break;
            case ItemSBox.ITEM_CATEGORY_VEHICLE_ID:
                localVars.iVeh = equip ? listItem.data : null;
                break;
            default:
                if (equip) {
                    localVars.iWpn = listItem.data;
                    localVars.wpnStrAdd = listItem.charInvRecord.strAdd;
                    localVars.wpnDexAdd = listItem.charInvRecord.dexAdd;
                    localVars.wpnTechAdd = listItem.charInvRecord.techAdd;
                    localVars.wpnSuppAdd = listItem.charInvRecord.suppAdd;
                    localVars.wpnDmg = listItem.charInvRecord.damage;
                } else {
                    localVars.iWpn = null;
                    localVars.wpnStrAdd = 0;
                    localVars.wpnDexAdd = 0;
                    localVars.wpnTechAdd = 0;
                    localVars.wpnSuppAdd = 0;
                    localVars.wpnDmg = 0;
                }
                break;
        }

        myUser.setVariables(localVars);

        if (sendUpdate) {
            let obj = {oiId: oldItemId, niId: newItemId, oId: oldCharInvId, nId: newCharInvId} as Record<string, number | string>;
            if (localVars.charArm != undefined) obj.aId = localVars.charArm;

            this.client.smartFox.sendXtMessage("main", Requests.REQUEST_UPDATE_ITEM, obj, 2, "json");
        } 
    }

    handleUpgradeItemResponse(data: string[]) {
        let payMode = parseInt(data[2]);
        let upgradePrice = parseInt(data[3]);
        let dbSpend = parseInt(data[4]);
        let couponCharInvId = parseInt(data[5]);

        // let selectedInvRecord = this.selectedItem.charInvRecord;
    }

    removeInventoryItem(charInvId: number) {
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list[i];
            if (item != null && item.charInvId == charInvId) {
                delete this.list[i];
                break;
            }
        }
    }

    /**
     * @param {number} charInvId
     * @param {number} amount
     */
    removeInventoryItems(charInvId: number, amount=1) {
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list[i];

            if (item == null) continue;

            if (item.charInvId == charInvId) {
                let newAmount = item.charInvRecord.invQty - amount;
                if (newAmount < 1) {
                    this.list.splice(i, 1);
                } else {
                    item.charInvRecord.invQty -= amount;

                }
            }
        }
    }

    getEquippedPrimary() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_PRIMARY_ID || this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_SWORD_ID || this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_STAFF_ID || this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_BLADE_ID || this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_CLUB_ID || this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_MUTATE_ID) return this.equippedList[i];
        } return null;
    }

    getEquippedSidearm() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_GUN_ID) return this.equippedList[i];
        } return null;
    }

    getEquippedAuxiliary() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_AUXILIARY_ID) return this.equippedList[i];
        } return null;
    }

    getEquippedRobot() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_BOT_ID) return this.equippedList[i];
        } return null;
    }

    getEquippedVehicle() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_VEHICLE_ID) return this.equippedList[i];
        } return null;
    }

    getEquippedArmor() {
        for (let i = 0; i < this.equippedList.length; i++) {
            if (this.equippedList[i].itemRecord.itemCat == ItemSBox.ITEM_CATEGORY_ARMOR_ID) return this.equippedList[i];
        } return null;
    }

    getInventoryItemCount(itemId=1, countEquipped=true, bankMatters=true) {
        let count = 0;
        
        for (let i = 0; i < this.list.length; i++) {
            let listItem = this.list[i];

            if (listItem != null && listItem.itemId == itemId) {
                if (bankMatters && listItem.charInvRecord.isBanked) continue;
                if (countEquipped || !listItem.charInvRecord.itemEquipped) count += listItem.charInvRecord.invQty;
            }
        }; return count;
    }
}
/*
      public function handleUpgradeItemResponse(data:Array) : void
      {
         var selectedInvRecord:CharacterInvRecord = _inventoryListSet.selectedItem.charInvRecord;
         selectedInvRecord.damage = this._currDmg;
         selectedInvRecord.defense = this._currDef;
         selectedInvRecord.resist = this._currRes;
         selectedInvRecord.strAdd = this._currStr;
         selectedInvRecord.dexAdd = this._currDex;
         selectedInvRecord.techAdd = this._currTech;
         selectedInvRecord.suppAdd = this._currSupp;
         if(_inventoryListSet.isSelectedItemEquipped())
         {
            StatsSkillsModule.instance.updateStats(new StatsParams());
         }
         this.updateStatEditor();
         this.showItemDetails(_inventoryListSet.selectedItem);
         NotificationModule.instance.createNotification(new Window_304_97(_inventoryListSet.selectedItem.itemRecord.itemName + " has been reconfigured!"),4,450,150);
         if(payMode == Currency.CREDITS_ID)
         {
            Currency.credits -= upgradePrice;
            selectedInvRecord.creditSpend += dbSpend;
         }
         else if(payMode == Currency.VARIUM_ID)
         {
            Currency.varium -= upgradePrice;
            selectedInvRecord.variumSpend += dbSpend;
         }
         else if(payMode == Currency.GEAR_COUPON_ID)
         {
            this.removeInventoryItems(couponCharInvId);
         }
         this.closeStatEditor();
         ClearBlockModule.instance.closeModule();
         this.determineInventoryControlStatus();
         TesterCommands.sendDevCommand(TesterCommands.TEST_CMD_CURRENCY_CHECK);
      }
      
      public function handleInsertCoreResponse(data:Array) : void
      {
         var coreInvIdToDelete:int = 0;
         if(data[6] != null)
         {
            coreInvIdToDelete = parseInt(data[6]);
            this.removeInventoryItems(coreInvIdToDelete);
         }
         ClearBlockModule.instance.closeModule();
         ConfirmModule.instance.closeModule();
         this.closeCoreEditor();
         var selectedInvRecord:CharacterInvRecord = _inventoryListSet.selectedItem.charInvRecord;
         var selectedCoreListItem:CoreListItem = CoreListItem(this.ui.edit_core_module.core_list.selectedItem);
         var itemRecord:ItemRecord = ItemSBox.instance.getItemById(selectedInvRecord.itemId);
         if(selectedCoreListItem.coreRecord.coreType == 0)
         {
            selectedInvRecord.corePassiveId = selectedCoreListItem.coreRecord.coreId;
            selectedInvRecord.corePassiveQty = Number(data[5]);
         }
         else
         {
            selectedInvRecord.coreActiveId = selectedCoreListItem.coreRecord.coreId;
            selectedInvRecord.coreActiveQty = Number(data[5]);
         }
         this.showItemDetails(_inventoryListSet.selectedItem);
         var coreName:String = selectedCoreListItem.coreRecord.skill.skillName;
         var itemName:String = itemRecord.itemName;
         NotificationModule.instance.createNotification(new Window_304_97(GlobalLanguage.loadStringParams("#0 properly inserted on #1",[coreName,itemName])));
         this.determineInventoryControlStatus();
      }
      
    
      public function depositBankItem(e:MouseEvent = null) : void
      {
         var listItem:InventoryListItem = null;
         var bankItemCount:int = 0;
         var depObj:Object = null;
         listItem = _inventoryListSet.selectedItem;
         if(listItem == null)
         {
            return;
         }
         bankItemCount = InventoryModule.instance.getInventoryCount(true);
         if(bankItemCount >= CurrentUser.instance._myBankLimit)
         {
            NotificationModule.instance.createNotification(new Window_304_97(GlobalLanguage.loadString("Your bank is already full!")),4,450,150);
            return;
         }
         if(listItem.itemId == 1)
         {
            NotificationModule.instance.createNotification(new Window_304_97(GlobalLanguage.loadString("You cannot deposit your basic armor!")),4,450,150);
            return;
         }
         if(MerchantModule.instance._bankTimer.running)
         {
            return;
         }
         MerchantModule.instance._bankTimer.start();
         ClearBlockModule.instance.openModule();
         depObj = {};
         depObj.itemId = listItem.itemId;
         depObj.cInvId = listItem.charInvId;
         EpicDuel.smartFox.sendXtMessage("main",Requests.REQUEST_BANK_DEPOSIT,depObj,1,SmartFoxClient.XTMSG_TYPE_JSON);
      }
      
      public function depositBankItemResponse(charInvId:int) : void
      {
         var _oldIndex:int = 0;
         var listItem:InventoryListItem = null;
         _oldIndex = _inventoryListSet._selectedList.selectedIndex;
         this.filterInventory(this._currentFilter);
         if(_inventoryListSet._selectedList.length > 0)
         {
            _inventoryListSet._selectedList.selectedIndex = _oldIndex - 1;
            if(_inventoryListSet._selectedList.selectedIndex < 0)
            {
               _inventoryListSet._selectedList.selectedIndex = 0;
            }
            _inventoryListSet.selectItemByIndex(this.ui.my_items_module.inventory_list,_inventoryListSet._selectedList.selectedIndex + 1);
            listItem = _inventoryListSet._selectedList.selectedItem as InventoryListItem;
            if(listItem.isCategoryHeader)
            {
               --_inventoryListSet._selectedList.selectedIndex;
               if(_inventoryListSet._selectedList.selectedIndex < 0)
               {
                  _inventoryListSet._selectedList.selectedIndex = 0;
               }
               _inventoryListSet.selectItemByIndex(this.ui.my_items_module.inventory_list,_inventoryListSet._selectedList.selectedIndex + 1);
               listItem = _inventoryListSet._selectedList.selectedItem as InventoryListItem;
            }
            if(listItem != null)
            {
               _inventoryListSet._selectedList.scrollToSelected();
               this.showInventoryItem(listItem);
            }
            else
            {
               this.clearInventoryItemDetails();
            }
         }
         if(_inventoryListSet._selectedList.length == 0)
         {
            this.clearInventoryItemDetails();
         }
         if(this._activeInventoryFilter == ItemSBox.instance.ITEM_CATEGORY_ALL_ID)
         {
            this.updateInventoryCountDisplay();
         }
         this.updateFilterButtons();
         ClearBlockModule.instance.closeModule();
      }
      
      public function withdrawBankItemResponse(charInvId:int) : void
      {
         var addedItem:InventoryListItem = null;
         this.filterInventory(this._currentFilter);
         addedItem = this.getInventoryItemByCharInvId(charInvId);
         this.selectListItemInInventoryList(addedItem);
         if(this._activeInventoryFilter == ItemSBox.instance.ITEM_CATEGORY_ALL_ID)
         {
            this.updateInventoryCountDisplay();
         }
         this.updateFilterButtons();
         ClearBlockModule.instance.closeModule();
      }
   }
}
*/