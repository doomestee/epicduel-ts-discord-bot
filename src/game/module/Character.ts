import type Client from "../Proximus.js";
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
            // this.client.debug("Character found, playing as " + this._charItemList[0].charName);
            this.client.getCharacterData(this._charItemList[0].charId);
        }
    }
}