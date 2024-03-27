export default class ActiveMiscRulesRecord {
    static FIELD_miscRulesId = "miscRulesId";
    static FIELD_disableRandomTargetAction = "disableRandomTargetAction";
    static FIELD_forceRandomTargetActionIntoCoolDown = "forceRandomTargetActionIntoCoolDown";
    static FIELD_disableTargetGunAux = "disableTargetGunAux";
    static FIELD_disableSenderGun = "disableSenderGun";
    static FIELD_disableSenderAux = "disableSenderAux";
    static FIELD_disableTargetArmor = "disableTargetArmor";
    static FIELD_convertPrimaryToFish = "convertPrimaryToFish";
    static FIELD_cleanseDebuffs = "cleanseDebuffs";
    static FIELD_diminishBuffs = "diminishBuffs";
    static FIELD_removesPoison = "removesPoison";
    static FIELD_decreaseCoreQty = "decreaseCoreQty";
    static FIELD_forceGunCooldown = "forceGunCooldown";
    static FIELD_forceAuxCooldown = "forceAuxCooldown";
    
    static templates = [ActiveMiscRulesRecord.FIELD_miscRulesId,ActiveMiscRulesRecord.FIELD_disableRandomTargetAction,ActiveMiscRulesRecord.FIELD_forceRandomTargetActionIntoCoolDown,ActiveMiscRulesRecord.FIELD_disableTargetGunAux,ActiveMiscRulesRecord.FIELD_disableSenderGun,ActiveMiscRulesRecord.FIELD_disableSenderAux,ActiveMiscRulesRecord.FIELD_disableTargetArmor,ActiveMiscRulesRecord.FIELD_convertPrimaryToFish,ActiveMiscRulesRecord.FIELD_cleanseDebuffs,ActiveMiscRulesRecord.FIELD_diminishBuffs,ActiveMiscRulesRecord.FIELD_removesPoison,ActiveMiscRulesRecord.FIELD_decreaseCoreQty,ActiveMiscRulesRecord.FIELD_forceGunCooldown,ActiveMiscRulesRecord.FIELD_forceAuxCooldown];

    miscRulesId: number;
    disableRandomTargetAction: boolean;
    forceRandomTargetActionIntoCoolDown: boolean;
    disableTargetGunAux: boolean;
    disableSenderGun: boolean;
    disableSenderAux: boolean;
    disableTargetArmor: boolean;
    convertPrimaryToFish: boolean;
    cleanseDebuffs: boolean;
    diminishBuffs: boolean;
    removesPoison: boolean;
    decreaseCoreQty: boolean;
    forceGunCooldown: boolean;
    forceAuxCooldown: boolean;

    constructor(obj: any) {
        this.miscRulesId = parseInt(obj["miscRulesId"]);
        this.disableRandomTargetAction = Boolean(parseInt(obj["disableRandomTargetAction"]));
        this.forceRandomTargetActionIntoCoolDown = Boolean(parseInt(obj["forceRandomTargetActionIntoCoolDown"]));
        this.disableTargetGunAux = Boolean(parseInt(obj["disableTargetGunAux"]));
        this.disableSenderGun = Boolean(parseInt(obj["disableSenderGun"]));
        this.disableSenderAux = Boolean(parseInt(obj["disableSenderAux"]));
        this.disableTargetArmor = Boolean(parseInt(obj["disableTargetArmor"]));
        this.convertPrimaryToFish = Boolean(parseInt(obj["convertPrimaryToFish"]));
        this.cleanseDebuffs = Boolean(parseInt(obj["cleanseDebuffs"]));
        this.diminishBuffs = Boolean(parseInt(obj["diminishBuffs"]));
        this.removesPoison = Boolean(parseInt(obj["removesPoison"]));
        this.decreaseCoreQty = Boolean(parseInt(obj["decreaseCoreQty"]));
        this.forceGunCooldown = Boolean(parseInt(obj["forceGunCooldown"]));
        this.forceAuxCooldown = Boolean(parseInt(obj["forceAuxCooldown"]));
    }
}