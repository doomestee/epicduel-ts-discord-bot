export default class ActiveTargetRulesRecord {
    static FIELD_targetRulesId = "targetRulesId";
    static FIELD_targetCode = "targetCode";
    static FIELD_reqLessThanFullHealth = "reqLessThanFullHealth";
    static FIELD_reqLessThanFullEnergy = "reqLessThanFullEnergy";
    static FIELD_reqLessThanFullHealthOrEnergy = "reqLessThanFullHealthOrEnergy";
    static FIELD_reqLessThanFullRage = "reqLessThanFullRage";
    static FIELD_reqAtLeast1Buff = "reqAtLeast1Buff";
    static FIELD_reqAtLeast1Debuff = "reqAtLeast1Debuff";
    static FIELD_reqGunOrAux = "reqGunOrAux";
    static FIELD_reqSomeHealth = "reqSomeHealth";
    static FIELD_reqSomeEnergy = "reqSomeEnergy";
    static FIELD_reqTargets = "reqTargets";
    static FIELD_reqRealPlayers = "reqRealPlayers";

    static templates  = [ActiveTargetRulesRecord.FIELD_targetRulesId,ActiveTargetRulesRecord.FIELD_targetCode,ActiveTargetRulesRecord.FIELD_reqLessThanFullHealth,ActiveTargetRulesRecord.FIELD_reqLessThanFullEnergy,ActiveTargetRulesRecord.FIELD_reqLessThanFullHealthOrEnergy,ActiveTargetRulesRecord.FIELD_reqLessThanFullRage,ActiveTargetRulesRecord.FIELD_reqAtLeast1Buff,ActiveTargetRulesRecord.FIELD_reqAtLeast1Debuff,ActiveTargetRulesRecord.FIELD_reqGunOrAux,ActiveTargetRulesRecord.FIELD_reqSomeHealth,ActiveTargetRulesRecord.FIELD_reqSomeEnergy,ActiveTargetRulesRecord.FIELD_reqTargets,ActiveTargetRulesRecord.FIELD_reqRealPlayers];

    targetRulesId: number;
    targetCode: number;
    reqLessThanFullHealth: boolean;
    reqLessThanFullEnergy: boolean;
    reqLessThanFullHealthOrEnergy: boolean;
    reqLessThanFullRage: boolean;
    reqAtLeast1Buff: boolean;
    reqAtLeast1Debuff: boolean;
    reqGunOrAux: boolean;
    reqSomeHealth: boolean;
    reqSomeEnergy: boolean;
    reqTargets: number;
    reqRealPlayers: boolean;

    constructor(obj: any) {
        this.targetRulesId = parseInt(obj["targetRulesId"]);
        this.targetCode = parseInt(obj["targetCode"]);
        this.reqLessThanFullHealth = Boolean(parseInt(obj["reqLessThanFullHealth"]));
        this.reqLessThanFullEnergy = Boolean(parseInt(obj["reqLessThanFullEnergy"]));
        this.reqLessThanFullHealthOrEnergy = Boolean(parseInt(obj["reqLessThanFullHealthOrEnergy"]));
        this.reqLessThanFullRage = Boolean(parseInt(obj["reqLessThanFullRage"]));
        this.reqAtLeast1Buff = Boolean(parseInt(obj["reqAtLeast1Buff"]));
        this.reqAtLeast1Debuff = Boolean(parseInt(obj["reqAtLeast1Debuff"]));
        this.reqGunOrAux = Boolean(parseInt(obj["reqGunOrAux"]));
        this.reqSomeHealth = Boolean(parseInt(obj["reqSomeHealth"]));
        this.reqSomeEnergy = Boolean(parseInt(obj["reqSomeEnergy"]));
        this.reqTargets = (parseInt(obj["reqTargets"]));
        this.reqRealPlayers = Boolean(parseInt(obj["reqRealPlayers"]));
    }
}