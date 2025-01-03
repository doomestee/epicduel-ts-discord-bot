import Logger from "../../manager/logger.js";
import { map, randomNumber } from "../../util/Misc.js";
import { generatePhrase } from "../../util/Phrase.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import CharacterRecord from "../record/CharacterRecord.js";
import BaseModule from "./Base.js";

export class CharacterItem {
    charHairS: number;
    charGender: string;
    charSkin: string;
    charAccnt2: string;
    charSec: string;
    charAccnt: string;
    charEye: string;
    userCredits: number;
    charClassId: number;
    userVarium: number;
    charExp: number;
    iWpn: number;
    charPri: string;
    charId: number;
    charArm: number;
    charName: string;

    constructor(data: CharacterItem) {
        this.charHairS = Number(data.charHairS);
        this.charGender = String(data.charGender);
        this.charSkin = String(data.charSkin);
        this.charAccnt2 = String(data.charAccnt2);
        this.charSec = String(data.charSec);
        this.charAccnt = String(data.charAccnt);
        this.charEye = String(data.charEye);
        this.userCredits = Number(data.userCredits);
        this.charClassId = Number(data.charClassId);
        this.userVarium = Number(data.userVarium);
        this.charExp = Number(data.charExp);
        this.iWpn = Number(data.iWpn);
        this.charPri = String(data.charPri);
        this.charId = Number(data.charId);
        this.charArm = Number(data.charArm);
        this.charName = String(data.charName);
    }
}

export default class Character extends BaseModule {
    _charItemList: CharacterItem[] = [];

    constructor(public client: Client) {
        super();
    }

    characterListAvailable(data:any) {
        if (data == null) return;

        for (let i = 0; i < 6; i++) {
            let item = data[i];

            //if (this.client.user.)
            
            if (item) {
                // idek what the hell the code is meant to be.
                this._charItemList.push(new CharacterItem(item));
            }
        }

        //this.populateCharacters();

        if (this._charItemList.length) {
            Logger.getLoggerP(this.client).debug("Playing as " + this._charItemList[0].charName);
            // this.client.debug("Character found, playing as " + this._charItemList[0].charName);
            this.client.getCharacterData(this._charItemList[0].charId);
        } else {
            // Create a character
            setTimeout(() => { this.createCharacter(); }, 3000);
        }
    }


    handleGetCharacter(dataObj: any) {
        if (dataObj.db.length > 0) {
            this.client.user.charRecord = new CharacterRecord(dataObj.db[0]);
            this.client.user._startRoom = dataObj.db[0].userStart;
            this.client.user._myInvLimit = dataObj.db[0].charInvSlots;
            this.client.user._myBankLimit = dataObj.db[0].charBankSlots;
            this.client.user._myCharId = dataObj.db[0].charId;
            this.client.user._charGender = dataObj.db[0].charGender;
            this.client.user._initCharWarAlign = dataObj.db[0].charWarAlign;
            this.client.user._forceRetrain = dataObj.db[0].charForceRetrain;
            this.client.currency.credits = dataObj.db[0].userCredits;
            this.client.currency.varium = dataObj.db[0].userVarium;

            if (dataObj.db[0].charBat1 > 0) this.client.user._loginWinRatio = dataObj.db[0].charWins1 / dataObj.db[0].charBat1;
            else this.client.user._loginWinRatio = 1;

            this.client.user._loginBattleTotal = dataObj.db[0].charBat1;
            this.client.user._chatBlock = dataObj.db[0].userChatBlock > 0 || dataObj.db[0].userChatBlock == -1;

            // if (this.storeRawData) setTimeout(() => {
            //     console.log("Getting my data!");

                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MY_DATA, {}, 1, "json");
            // }, 2000); else this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MY_DATA, {}, 1, "json");
        }
    }

    private createCharacter(name?: string) {
        if (this._charItemList.length) throw Error("No.")

        if (!name) name = map(generatePhrase(2, 1).split(" "), word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") + " " + Math.floor(Math.random() * 100);

        Logger.getLoggerP(this.client).debug("Creating a character: " + name);

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_ADD_CHARACTER, {
            charName: name,
            charGender: Math.random() >= 0.5 ? "M" : "F",
            charClassId: randomNumber(1, 4),
            charPri: randomNumber(0, 0xFFFFFF),
            charSec: randomNumber(0, 0xFFFFFF),
            charHair: [0x81551B, 0x222222, 0x3399CC][randomNumber(0, 4)],//CharacterCreatorModule.instance.ui.options_mc.hair_cp.getRGB(),
            charSkin: [0xDCA46B, 0x825a46, 0xDCA46B][randomNumber(0, 4)],//CharacterCreatorModule.instance.ui.options_mc.skin_cp.getRGB(),
            charAccnt: randomNumber(0, 0xFFFFFF),
            charAccnt2: randomNumber(0, 0xFFFFFF),
            charEye: randomNumber(0, 0xFFFFFF),
            charHairS: randomNumber(1, 11),//CharacterCreatorModule.instance._charVars.charHairS,
        }, 1, "json");
    }

    handleAddCharacterFail(data: any) {
        Logger.getLoggerP(this.client).info("Unable to create character: " + data.msg);
    }
}