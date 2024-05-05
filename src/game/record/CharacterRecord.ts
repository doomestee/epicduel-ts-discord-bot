export default class CharacterRecord {
    public static readonly FIELD_charId = "charId";
      
    public static readonly FIELD_userId = "userId";
    
    public static readonly FIELD_charName = "charName";
    
    public static readonly FIELD_charGender = "charGender";
    
    public static readonly FIELD_charClassId = "charClassId";
    
    public static readonly FIELD_charExp = "charExp";
    
    public static readonly FIELD_charLvl = "charLvl";
    
    public static readonly FIELD_charHp = "charHp";
    
    public static readonly FIELD_charMaxHp = "charMaxHp";
    
    public static readonly FIELD_charMp = "charMp";
    
    public static readonly FIELD_charMaxMp = "charMaxMp";
    
    public static readonly FIELD_charStr = "charStr";
    
    public static readonly FIELD_charDex = "charDex";
    
    public static readonly FIELD_charTech = "charTech";
    
    public static readonly FIELD_charSupp = "charSupp";
    
    public static readonly FIELD_charBat1 = "charBat1";
    
    public static readonly FIELD_charBat2 = "charBat2";
    
    public static readonly FIELD_charJug = "charJug";
    
    public static readonly FIELD_charBatJ = "charBatJ";
    
    public static readonly FIELD_charWins1 = "charWins1";
    
    public static readonly FIELD_charWins2 = "charWins2";
    
    public static readonly FIELD_charPri = "charPri";
    
    public static readonly FIELD_charSec = "charSec";
    
    public static readonly FIELD_charHair = "charHair";
    
    public static readonly FIELD_charSkin = "charSkin";
    
    public static readonly FIELD_charAccnt = "charAccnt";
    
    public static readonly FIELD_charAccnt2 = "charAccnt2";
    
    public static readonly FIELD_charEye = "charEye";
    
    public static readonly FIELD_charArm = "charArm";
    
    public static readonly FIELD_charHairS = "charHairS";
    
    public static readonly FIELD_userVarium = "userVarium";
    
    public static readonly FIELD_userCredits = "userCredits";
    
    public static readonly FIELD_userChatBlock = "userChatBlock";
    
    public static readonly FIELD_userStart = "userStart";
    
    public static readonly FIELD_charInvSlots = "charInvSlots";
    
    public static readonly FIELD_charBankSlots = "charBankSlots";
    
    public static readonly FIELD_charBdySize = "charBdySize";
    
    public static readonly FIELD_fctId = "fctId";
    
    public static readonly FIELD_fctName = "fctName";
    
    public static readonly FIELD_charTitle = "charTitle";
    
    public static readonly FIELD_fctPerm = "fctPerm";
    
    public static readonly FIELD_fctAlign = "fctAlign";
    
    public static readonly FIELD_rating = "rating";
    
    public static readonly FIELD_forceRetrain = "charForceRetrain";
    
    public static readonly FIELD_charTotalInfluence = "charTotalInfluence";
    
    public static readonly FIELD_charWarAlign = "charWarAlign";

    charId: number;
    userId: number;
    charName: string;
    charGender: string;
    charClassId: number;
    charExp: number;
    charLvl: number;
    charHp: number;
    charMaxHp: number;
    charMp: number;
    charMaxMp: number;
    charStr: number;
    charDex: number;
    charTech: number;
    charSupp: number;
    charBat1: number;
    charBat2: number;
    charJug: number;
    charBatJ: number;
    charWins1: number;
    charWins2: number;
    charPri: string;
    charSec: string;
    charHair: string;
    charSkin: string;
    charAccnt: string;
    charAccnt2: string;
    charEye: string;
    charArm: number;
    charHairS: number;
    userVarium: number;
    userCredits: number;
    userChatBlock: number;
    userStart: string;
    charInvSlots: number;
    charBankSlots: number;
    charBdySize: number;
    fctId: number;
    fctName: string;
    charTitle: string;
    fctPerm: number;
    fctAlign: number;
    rating: number;
    charForceRetrain: number;
    charTotalInfluence: number;
    charWarAlign: number;

    constructor(obj: any) {
        this["charId"] = obj[CharacterRecord.FIELD_charId];
        this["userId"] = obj[CharacterRecord.FIELD_userId];
        this["charName"] = obj[CharacterRecord.FIELD_charName];
        this["charGender"] = obj[CharacterRecord.FIELD_charGender];
        this["charClassId"] = obj[CharacterRecord.FIELD_charClassId];
        this["charExp"] = obj[CharacterRecord.FIELD_charExp];
        this["charLvl"] = obj[CharacterRecord.FIELD_charLvl];
        this["charHp"] = obj[CharacterRecord.FIELD_charHp];
        this["charMaxHp"] = obj[CharacterRecord.FIELD_charMaxHp];
        this["charMp"] = obj[CharacterRecord.FIELD_charMp];
        this["charMaxMp"] = obj[CharacterRecord.FIELD_charMaxMp];
        this["charStr"] = obj[CharacterRecord.FIELD_charStr];
        this["charDex"] = obj[CharacterRecord.FIELD_charDex];
        this["charTech"] = obj[CharacterRecord.FIELD_charTech];
        this["charSupp"] = obj[CharacterRecord.FIELD_charSupp];
        this["charBat1"] = obj[CharacterRecord.FIELD_charBat1];
        this["charBat2"] = obj[CharacterRecord.FIELD_charBat2];
        this["charJug"] = obj[CharacterRecord.FIELD_charJug];
        this["charBatJ"] = obj[CharacterRecord.FIELD_charBatJ];
        this["charWins1"] = obj[CharacterRecord.FIELD_charWins1];
        this["charWins2"] = obj[CharacterRecord.FIELD_charWins2];
        this["charPri"] = obj[CharacterRecord.FIELD_charPri];
        this["charSec"] = obj[CharacterRecord.FIELD_charSec];
        this["charHair"] = obj[CharacterRecord.FIELD_charHair];
        this["charSkin"] = obj[CharacterRecord.FIELD_charSkin];
        this["charAccnt"] = obj[CharacterRecord.FIELD_charAccnt];
        this["charAccnt2"] = obj[CharacterRecord.FIELD_charAccnt2];
        this["charEye"] = obj[CharacterRecord.FIELD_charEye];
        this["charArm"] = obj[CharacterRecord.FIELD_charArm];
        this["charHairS"] = obj[CharacterRecord.FIELD_charHairS];
        this["userVarium"] = obj[CharacterRecord.FIELD_userVarium];
        this["userCredits"] = obj[CharacterRecord.FIELD_userCredits];
        this["userChatBlock"] = obj[CharacterRecord.FIELD_userChatBlock];
        this["userStart"] = obj[CharacterRecord.FIELD_userStart];
        this["charInvSlots"] = obj[CharacterRecord.FIELD_charInvSlots];
        this["charBankSlots"] = obj[CharacterRecord.FIELD_charBankSlots];
        this["charBdySize"] = obj[CharacterRecord.FIELD_charBdySize];
        this["fctId"] = obj[CharacterRecord.FIELD_fctId];
        this["fctName"] = obj[CharacterRecord.FIELD_fctName];
        this["charTitle"] = obj[CharacterRecord.FIELD_charTitle];
        this["fctPerm"] = obj[CharacterRecord.FIELD_fctPerm] ?? 0;
        this["fctAlign"] = obj[CharacterRecord.FIELD_fctAlign] ?? 0;
        this["rating"] = obj[CharacterRecord.FIELD_rating] ?? 0;
        this["charForceRetrain"] = obj[CharacterRecord.FIELD_forceRetrain];
        this["charTotalInfluence"] = obj[CharacterRecord.FIELD_charTotalInfluence];
        this["charWarAlign"] = obj[CharacterRecord.FIELD_charWarAlign];
    }

    static getFullAttribNameByField(fieldName: string) {
        switch (fieldName) {
            case this.FIELD_charMaxHp:
                return "Max Energy";
            case this.FIELD_charSupp:
                return "Support";
            case this.FIELD_charTech:
                return "Technology";
            case this.FIELD_charStr:
                return "Strength";
            case this.FIELD_charDex:
                return "Dexterity";
            case this.FIELD_charHp:
                return "Health";
            case this.FIELD_charMp:
                return "Energy";
            default:
                return "None";
                // return EpicStyle.lightgray(GlobalLanguage.loadString("DYN_txt_none"));
        }
    }
}