export default class CharacterInvRecord {
    static readonly FIELD_charInvId = "charInvId";
    static readonly FIELD_itemId = "itemId";
    static readonly FIELD_itemEquipped = "itemEquipped";
    static readonly FIELD_strAdd = "strAdd";
    static readonly FIELD_dexAdd = "dexAdd";
    static readonly FIELD_techAdd = "techAdd";
    static readonly FIELD_suppAdd = "suppAdd";
    static readonly FIELD_damage = "damage";
    static readonly FIELD_defense = "defense";
    static readonly FIELD_resist = "resist";
    static readonly FIELD_corePassiveId = "corePassiveId";
    static readonly FIELD_corePassiveQty = "corePassiveQty";
    static readonly FIELD_coreActiveId = "coreActiveId";
    static readonly FIELD_coreActiveQty = "coreActiveQty";
    static readonly FIELD_unlockedLevel = "unlockedLevel";
    static readonly FIELD_creditSpend = "creditSpend";
    static readonly FIELD_variumSpend = "variumSpend";
    static readonly FIELD_isBanked = "isBanked";
    static readonly FIELD_invQty = "invQty";

    charInvId: number;
    itemId: number;
    itemEquipped: boolean;
    strAdd: number;
    dexAdd: number;
    techAdd: number;
    suppAdd: number;
    damage: number;
    defense: number;
    resist: number;
    corePassiveId: number;
    corePassiveQty: number;
    coreActiveId: number;
    coreActiveQty: number;
    unlockedLevel: number;
    creditSpend: number;
    variumSpend: number;
    isBanked: boolean;
    invQty: number;

    constructor(obj: ConvToStringVals) {
        this.charInvId = Number(obj[CharacterInvRecord.FIELD_charInvId]);
        this.itemId = Number(obj[CharacterInvRecord.FIELD_itemId]);
        this.itemEquipped = (obj[CharacterInvRecord.FIELD_itemEquipped]) == "1";
        this.strAdd = Number(obj[CharacterInvRecord.FIELD_strAdd]);
        this.dexAdd = Number(obj[CharacterInvRecord.FIELD_dexAdd]);
        this.techAdd = Number(obj[CharacterInvRecord.FIELD_techAdd]);
        this.suppAdd = Number(obj[CharacterInvRecord.FIELD_suppAdd]);
        this.damage = Number(obj[CharacterInvRecord.FIELD_damage]);
        this.defense = Number(obj[CharacterInvRecord.FIELD_defense]);
        this.resist = Number(obj[CharacterInvRecord.FIELD_resist]);
        this.corePassiveId = Number(obj[CharacterInvRecord.FIELD_corePassiveId]);
        this.corePassiveQty = Number(obj[CharacterInvRecord.FIELD_corePassiveQty]);
        this.coreActiveId = Number(obj[CharacterInvRecord.FIELD_coreActiveId]);
        this.coreActiveQty = Number(obj[CharacterInvRecord.FIELD_coreActiveQty]);
        this.unlockedLevel = Number(obj[CharacterInvRecord.FIELD_unlockedLevel]);
        this.creditSpend = Number(obj[CharacterInvRecord.FIELD_creditSpend]);
        this.variumSpend = Number(obj[CharacterInvRecord.FIELD_variumSpend]);
        this.isBanked = (obj[CharacterInvRecord.FIELD_isBanked]) == "1";
        this.invQty = Number(obj[CharacterInvRecord.FIELD_invQty]) || 1;
    }
}

type ConvToStringVals = { [x in keyof CharacterInvRecord]: CharacterInvRecord[x] | string };