export default class ActiveRecord {
    static FIELD_skillId = "skillId";
    static FIELD_runToTargetFirst = "runToTargetFirst";
    static FIELD_playLabel = "playLabel";
    static FIELD_senderEffectLink = "senderEffectLink";
    static FIELD_targetEffectLink = "targetEffectLink";
    static FIELD_targetEffectLink2 = "targetEffectLink2";
    static FIELD_targetHitLink = "targetHitLink";
    static FIELD_createPassive = "createPassive";
    static FIELD_passiveValueSource = "passiveValueSource";
    static FIELD_attackRulesId = "attackRulesId";
    static FIELD_hpMpRulesId = "hpMpRulesId";
    static FIELD_targetRulesId = "targetRulesId";
    static FIELD_miscRulesId = "miscRulesId";
    static FIELD_coolDown = "coolDown";
    static FIELD_coolDownSkillLinkId = "coolDownSkillLinkId";
    static FIELD_warmUp = "warmUp";
    static FIELD_useLimit = "useLimit";
    static FIELD_maxTargets = "maxTargets";
    static FIELD_isGrenade = "isGrenade";
    static FIELD_damagePercent = "damagePercent";
    
    static templates = [ActiveRecord.FIELD_skillId,ActiveRecord.FIELD_runToTargetFirst,ActiveRecord.FIELD_playLabel,ActiveRecord.FIELD_senderEffectLink,ActiveRecord.FIELD_targetEffectLink,ActiveRecord.FIELD_targetEffectLink2,ActiveRecord.FIELD_targetHitLink,ActiveRecord.FIELD_createPassive,ActiveRecord.FIELD_passiveValueSource,ActiveRecord.FIELD_attackRulesId,ActiveRecord.FIELD_hpMpRulesId,ActiveRecord.FIELD_targetRulesId,ActiveRecord.FIELD_miscRulesId,ActiveRecord.FIELD_coolDown,ActiveRecord.FIELD_coolDownSkillLinkId,ActiveRecord.FIELD_warmUp,ActiveRecord.FIELD_useLimit,ActiveRecord.FIELD_maxTargets,ActiveRecord.FIELD_isGrenade,ActiveRecord.FIELD_damagePercent];

    skillId: number;
    runToTargetFirst: boolean;
    playLabel: string;
    senderEffectLink: string;
    targetEffectLink: string;
    targetEffectLink2: string;
    targetHitLink: string;
    createPassive: boolean;
    passiveValueSource: number;
    attackRulesId: number;
    hpMpRulesId: number;
    targetRulesId: number;
    miscRulesId: number;
    coolDown: number;
    coolDownSkillLinkId: number;
    warmUp: number;
    useLimit: number;
    maxTargets: number;
    isGrenade: boolean;
    damagePercent: number;

    constructor(obj: any) {
        this.skillId = parseInt(obj["skillId"]);
        this.runToTargetFirst = (obj["runToTargetFirst"]) == "1";
        this.playLabel = (obj["playLabel"]);
        this.senderEffectLink = (obj["senderEffectLink"]);
        this.targetEffectLink = (obj["targetEffectLink"]);
        this.targetEffectLink2 = (obj["targetEffectLink2"]);
        this.targetHitLink = (obj["targetHitLink"]);
        this.createPassive = (obj["createPassive"]) == "1";
        this.passiveValueSource = parseInt(obj["passiveValueSource"]);
        this.attackRulesId = parseInt(obj["attackRulesId"]);
        this.hpMpRulesId = parseInt(obj["hpMpRulesId"]);
        this.targetRulesId = parseInt(obj["targetRulesId"]);
        this.miscRulesId = parseInt(obj["miscRulesId"]);
        this.coolDown = parseInt(obj["coolDown"]);
        this.coolDownSkillLinkId = parseInt(obj["coolDownSkillLinkId"]);
        this.warmUp = parseInt(obj["warmUp"]);
        this.useLimit = parseInt(obj["useLimit"]);
        this.maxTargets = parseInt(obj["maxTargets"]);
        this.isGrenade = (obj["isGrenade"]) == "1";
        this.damagePercent = parseInt(obj["damagePercent"]);
    }
}