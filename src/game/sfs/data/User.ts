import { inspect } from "util";
import type Client from "../../Proximus.js";
import type { AnyItemRecordsExceptSelf } from "../../box/ItemBox.js";
// import type ArmorItemRecord from "../../record/item/ArmorRecord.js";
// import type WeaponRecord from "../../record/item/WeaponRecord.js";

export type Variables = Record<string, string | number | boolean>;

export default class User {
    id: number;
    name: string;
    variables: Variables;
    
    private isSpec: boolean;
    private isMod: boolean;
    private pId: number = 0;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.variables = {};
        this.isSpec = false;
        this.isMod = false;
        this.pId = 0;
    }
    
    // /**
    //  * @param {import("../SFSClient")} client
    //  * @returns {boolean}
    //  */
    // isMe(client) {
    //     // is this even smart? lmao
    //     if (!client) client = require("../../../").epicduel.client.smartFox;//global.ed.client.smartFox;

    //     return this.getName() == client.myUserName;
    // }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getVariable<T extends string|number|boolean = string|number|boolean>(varName: string) : T {
        return this.variables[varName] as T;
    }

    setVariables(o: Record<string, string | number | boolean | null>) {
        const keys = Object.keys(o);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const val = o[key];

            if (val === null) delete this.variables[key];
            else this.variables[key] = val;
            
        }
    }

    clearVariables() {
        this.variables = {};
    }

    isSpectator() {
        return this.isSpec;
    }

    isModerator() {
        return this.isMod;
    }

    setModerator(val: boolean) {
        this.isMod = val;
    }

    setIsSpectator(val: boolean) {
        this.isSpec = val;
    }

    getPlayerId() {
        return this.pId;
    }

    setPlayerId(pid: number) {
        this.pId = pid;
    }


    // Beyond this point, I gave up with manually applying jsdoc.
    
    get charId()
    {
        return this.getVariable<number>("charId");//.variables["charId"];
    }
    
    set charId(val)
    {
        this.variables["charId"] = val;
    }
    
    get userId()
    {
        return this.getVariable<number>("userId")
    }
    
    get charName()
    {
        return this.getVariable<string>("charName");
    }
    
    get charLvl()
    {
        return parseInt(this.getVariable("charLvl"));
    }
    
    get charExp()
    {
        return this.getVariable<number>("charExp");
    }
    
    get charTotalInfluence()
    {
        return this.getVariable<number>("charTotalInfluence");
    }
    
    get charClassId()
    {
        return this.variables["charClassId"] != undefined ? Number(this.variables["charClassId"]) : Number(-1);
    }
    
    get charHp()
    {
        return this.getVariable<number>("charHp");
    }
    
    get charMaxHp()
    {
        return this.getVariable<number>("charMaxHp");
    }
    
    get charMp()
    {
        return this.getVariable<number>("charMp");
    }
    
    get charMaxMp()
    {
        return this.getVariable<number>("charMaxMp");
    }
    
    get charStr()
    {
        return this.getVariable<number>("charStr");
    }
    
    get charDex()
    {
        return this.getVariable<number>("charDex");
    }
    
    get charTech()
    {
        return this.getVariable<number>("charTech");
    }
    
    get charSupp()
    {
        return this.getVariable<number>("charSupp");
    }
    
    get charGender()
    {
        return this.getVariable<string>("charGender");
    }
    
    get charArm()
    {
        return this.getVariable<number>("charArm");
    }
    
    get charScaleX()
    {
        return this.getVariable<number>("charScaleX");
    }
    
    get px()
    {
        return this.variables["px"] != undefined ? Number(this.variables["px"]) : -1;
    }
    
    get py()
    {
        return this.variables["py"] != undefined ? Number(this.variables["py"]) : -1;
    }
    
    get slot()
    {
        return this.variables["slot"] != undefined ? Number(this.variables["slot"]) : -1;
    }
    
    get mv()
    {
        return this.getVariable<number>("mv");
    }
    
    get mT()
    {
        return this.variables["mT"] != undefined ? Number(this.variables["mT"]) : Number(-1);
    }
    
    get pxL()
    {
        return this.getVariable<number>("pxL");
    }
    
    get pyL()
    {
        return this.getVariable<number>("pyL");
    }
    
    get afk()
    {
        return this.getVariable<boolean>("afk");
    }
    
    get isFlying()
    {
        return this.getVariable<boolean>("fly");
    }
    
    get fctId()
    {
        return this.variables["fctId"] != undefined ? Number(this.variables["fctId"]) : 0;
    }
    
    set fctId(val)
    {
        this.variables["fctId"] = val;
    }
    
    get fctName()
    {
        return this.getVariable<string>("fctName")
    }
    
    get fctPerm()
    {
        return this.getVariable<number>("fctPerm");
    }
    
    set fctPerm(val)
    {
        this.variables["fctPerm"] = val;
    }
    
    get charWarAlign()
    {
        return this.getVariable<number>("charWarAlign");
    }
    
    get charTitle()
    {
        return this.getVariable<string>("charTitle");
    }
    
    get iWpn()
    {
        return this.variables["iWpn"] != undefined ? Number(this.variables["iWpn"]) : -1;
    }
    
    get iBot()
    {
        return this.variables["iBot"] != undefined ? Number(this.variables["iBot"]) : -1;
    }
    
    get iGun()
    {
        return this.variables["iGun"] != undefined ? Number(this.variables["iGun"]) : -1;
    }
    
    get iAux()
    {
        return this.variables["iAux"] != undefined ? Number(this.variables["iAux"]) : -1;
    }
    
    get iVeh()
    {
        return this.variables["iVeh"] != undefined ? Number(this.variables["iVeh"]) : -1;
    }
    
    get onVehicle()
    {
        return this.iVeh != -1;
    }
    
    get flightModuleEquipped()
    {
        return this.iVeh == 1682;
    }
    
    get hideCharacter()
    {
        //if(this.onVehicle)
        //{
        //return ActorBase.HIDE_CHARACTER_ON_VEHICLES.indexOf(this.iVeh) != -1;
        //}
        return false;
    }
    
    get isNPC()
    {
        return this.npcId > 0;
    }
    
    get charPri()
    {
        return this.getVariable<string>("charPri");
    }
    
    get charSec()
    {
        return this.getVariable<string>("charSec");
    }
    
    get charHair()
    {
        return this.getVariable<string>("charHair");
    }
    
    get charSkin()
    {
        return this.getVariable<string>("charSkin");
    }
    
    get charAccnt()
    {
        return this.getVariable<string>("charAccnt");
    }
    
    get charAccnt2()
    {
        return this.getVariable<string>("charAccnt2");
    }
    
    get charEye()
    {
        return this.getVariable<string>("charEye");
    }
    
    get charHairS()
    {
        return this.getVariable<number>("charHairS");
    }
    
    get npcBoss()
    {
        return this.getVariable<boolean>("npcBoss");
    }
    
    get npcScale()
    {
        return this.getVariable<number>("npcScale");
    }
    
    get npcId()
    {
        return this.variables["npcId"] != undefined ? Number(this.variables["npcId"]) : -1;
    }
    
    get wpnStrAdd()
    {
        return this.variables["wpnStrAdd"] != undefined ? Number(this.variables["wpnStrAdd"]) : -1;
    }
    
    get wpnDexAdd()
    {
        return this.variables["wpnDexAdd"] != undefined ? Number(this.variables["wpnDexAdd"]) : -1;
    }
    
    get wpnTechAdd()
    {
        return this.variables["wpnTechAdd"] != undefined ? Number(this.variables["wpnTechAdd"]) : -1;
    }
    
    get wpnSuppAdd()
    {
        return this.variables["wpnSuppAdd"] != undefined ? Number(this.variables["wpnSuppAdd"]) : -1;
    }
    
    get wpnDmg()
    {
        return this.variables["wpnDmg"] != undefined ? Number(this.variables["wpnDmg"]) : -1;
    }
    
    get gunStrAdd()
    {
        return this.variables["gunStrAdd"] != undefined ? Number(this.variables["gunStrAdd"]) : -1;
    }
    
    get gunDexAdd()
    {
        return this.variables["gunDexAdd"] != undefined ? Number(this.variables["gunDexAdd"]) : -1;
    }
    
    get gunTechAdd()
    {
        return this.variables["gunTechAdd"] != undefined ? Number(this.variables["gunTechAdd"]) : -1;
    }
    
    get gunSuppAdd()
    {
        return this.variables["gunSuppAdd"] != undefined ? Number(this.variables["gunSuppAdd"]) : -1;
    }
    
    get gunDmg()
    {
        return this.variables["gunDmg"] != undefined ? Number(this.variables["gunDmg"]) : -1;
    }
    
    get auxStrAdd()
    {
        return this.variables["auxStrAdd"] != undefined ? Number(this.variables["auxStrAdd"]) : -1;
    }
    
    get auxDexAdd()
    {
        return this.variables["auxDexAdd"] != undefined ? Number(this.variables["auxDexAdd"]) : -1;
    }
    
    get auxTechAdd()
    {
        return this.variables["auxTechAdd"] != undefined ? Number(this.variables["auxTechAdd"]) : -1;
    }
    
    get auxSuppAdd()
    {
        return this.variables["auxSuppAdd"] != undefined ? Number(this.variables["auxSuppAdd"]) : -1;
    }
    
    get auxDmg()
    {
        return this.variables["auxDmg"] != undefined ? Number(this.variables["auxDmg"]) : -1;
    }
    
    get armorStrAdd()
    {
        return this.variables["armorStrAdd"] != undefined ? Number(this.variables["armorStrAdd"]) : -1;
    }
    
    get armorDexAdd()
    {
        return this.variables["armorDexAdd"] != undefined ? Number(this.variables["armorDexAdd"]) : -1;
    }
    
    get armorTechAdd()
    {
        return this.variables["armorTechAdd"] != undefined ? Number(this.variables["armorTechAdd"]) : -1;
    }
    
    get armorSuppAdd()
    {
        return this.variables["armorSuppAdd"] != undefined ? Number(this.variables["armorSuppAdd"]) : -1;
    }
    
    get armorDefense()
    {
        return this.variables["armorDefense"] != undefined ? Number(this.variables["armorDefense"]) : -1;
    }
    
    get armorResist()
    {
        return this.variables["armorResist"] != undefined ? Number(this.variables["armorResist"]) : -1;
    }
    
    get rating()
    {
        return this.getVariable<number>("rating");
    }
    
    get charFame()
    {
        return this.getVariable<number>("charFame");
    }
    
    get warp()
    {
        return this.getVariable<boolean>("warp");
    }
    
    get npcHead()
    {
        return this.getVariable<string>("npcHead");
    }
    
    // /**
    //  * @param {import("../Client")} client
    //  */
    // allPointsApplied(client) {
    //     let classRec = client.boxes.class.objMap.get(this.charClassId);

    //     let expLevel = parseInt(getUserLevelByExp(this.charExp));
    //     let expectedStatsUsed = 4 * (expLevel - 1);
    //     let statsUsed = Math.ceil((this.charMaxHp - classRec.getMinHpByLevel(expLevel)) / 12.5) + Math.ceil((this.charMaxMp - classRec.getMinMpByLevel(expLevel)) / 12.5) + (this.charStr - classRec.classStr) + (this.charDex - classRec.classDex) + (this.charTech - classRec.classTech) + (this.charSupp - classRec.classSupp);

    //     return statsUsed == expectedStatsUsed;
    // }
    
    hasPrimaryWeapon()
    {
        return this.iWpn != -1;
    }
    
    // hasLevelUp()
    // {
    //     return getUserLevelByExp(this.charExp) > this.charLvl;
    // }
    
    get isLegendary()
    {
        return this.charLvl >= 40;
    }
    
    getItemBonusForAttribute(itemType: string, attrib: string)
    {
        let itemBonus = 0;
        switch(attrib)
            {
            case "charStr":
                switch(itemType)
                {
                    case "Primary":
                        itemBonus = this.wpnStrAdd;
                        break;
                    case "Gun":
                        itemBonus = this.gunStrAdd;
                        break;
                    case "Auxiliary":
                        itemBonus = this.auxStrAdd;
                        break;
                    case "Armor":
                        itemBonus = this.armorStrAdd;
                }
                break;
            case "charDex":
                switch(itemType)
                {
                    case "Primary":
                        itemBonus = this.wpnDexAdd;
                        break;
                    case "Gun":
                        itemBonus = this.gunDexAdd;
                        break;
                    case "Auxiliary":
                        itemBonus = this.auxDexAdd;
                        break;
                    case "Armor":
                        itemBonus = this.armorDexAdd;
                }
                break;
            case "charTech":
                switch(itemType)
                {
                    case "Primary":
                        itemBonus = this.wpnTechAdd;
                        break;
                    case "Gun":
                        itemBonus = this.gunTechAdd;
                        break;
                    case "Auxiliary":
                        itemBonus = this.auxTechAdd;
                        break;
                    case "Armor":
                        itemBonus = this.armorTechAdd;
                }
                break;
            case "charSupp":
                switch(itemType)
                {
                    case "Primary":
                        itemBonus = this.wpnSuppAdd;
                        break;
                    case "Gun":
                        itemBonus = this.gunSuppAdd;
                        break;
                    case "Auxiliary":
                        itemBonus = this.auxSuppAdd;
                        break;
                    case "Armor":
                        itemBonus = this.armorSuppAdd;
                }
                break;
            default:
                itemBonus = 0;
        }
        return itemBonus;
    }
    
    canEquipItem(client: Client, item: AnyItemRecordsExceptSelf) {
        let adjustedClassId = client.boxes.class.getAdjustedClassId(this.charClassId);
        let classReqMet = "itemClass" in item && (adjustedClassId == item.itemClass || item.itemClass == 0);
        let sexReqMet = "itemSexReq" in item && (this.charGender == item.itemSexReq || item.itemSexReq == "");
        // haha sex sex
        return classReqMet && sexReqMet;
    }
    
    // getPixelsPerFrame()
    // {
    //     return uint(this.iVeh != -1 ? uint(Constants.MOVEMENT_PPF_CRAFT) : uint(Constants.MOVEMENT_PPF_FOOT));
    // }
    
    /**
     * DEFUNCT
     */
    getLegendaryValue(catId: number)//:int) : int
    {
        return; /*

        var pointsSpent = 0;
        var record = null;

        if(this.variables["legendCat" + String(catId)] != undefined) {
            pointsSpent = this.variables["legendCat" + String(catId)];
            record = LegendaryBox.instance.getLegendaryCategoryById(catId);
            if(record != null) {
                return record.pointValue * pointsSpent;
            }
        }
        return 0;*/
    }

    [inspect.custom]() {
        return {
            id: this.id,
            name: this.name,

            isMod: this.isMod,

            charName: this.charName,
            gender: this.charGender,
            classId: this.charClassId,

            userId: this.userId,
            charId: this.charId,

            rating: this.rating,
            influence: this.charTotalInfluence,

            fact: {
                id: this.fctId,
                name: this.fctName,
                perm: this.fctPerm,

                title: this.charTitle
            },

            warAlign: this.charWarAlign,
        }
    }
}