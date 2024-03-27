export default class ClientRequirementsRecord {
    static FIELD_skillId = "skillId";
    static FIELD_reqCriticalHealth = "reqCriticalHealth";
    static FIELD_reqEnergy = "reqEnergy";
    static FIELD_reqEnergyStep = "reqEnergyStep";
    static FIELD_reqStat = "reqStat";
    static FIELD_reqStatBase = "reqStatBase";
    static FIELD_reqStatStepPerLevel = "reqStatStepPerLevel";
    static FIELD_reqLessThanFullHealth = "reqLessThanFullHealth";
    static FIELD_reqLessThanFullEnergy = "reqLessThanFullEnergy";
    static FIELD_reqEquipItemCat1 = "reqEquipItemCat1";
    static FIELD_reqEquipItemCat2 = "reqEquipItemCat2";
    static FIELD_reqHealth = "reqHealth";
    
    static templates  = [ClientRequirementsRecord.FIELD_skillId,ClientRequirementsRecord.FIELD_reqCriticalHealth,ClientRequirementsRecord.FIELD_reqEnergy,ClientRequirementsRecord.FIELD_reqEnergyStep,ClientRequirementsRecord.FIELD_reqStat,ClientRequirementsRecord.FIELD_reqStatBase,ClientRequirementsRecord.FIELD_reqStatStepPerLevel,ClientRequirementsRecord.FIELD_reqLessThanFullHealth,ClientRequirementsRecord.FIELD_reqLessThanFullEnergy,ClientRequirementsRecord.FIELD_reqEquipItemCat1,ClientRequirementsRecord.FIELD_reqEquipItemCat2,ClientRequirementsRecord.FIELD_reqHealth];

    skillId: number;
    reqCriticalHealth: boolean;
    reqEnergy: number;
    reqEnergyStep: number;
    reqStat: string;
    reqStatBase: number;
    reqStatStepPerLevel: number;
    reqLessThanFullHealth: boolean;
    reqLessThanFullEnergy: boolean;
    reqEquipItemCat1: number;
    reqEquipItemCat2: number;
    reqHealth: number;

    constructor(obj: any) {
        this.skillId = parseInt(obj["skillId"]);
        this.reqCriticalHealth = Boolean(parseInt(obj["reqCriticalHealth"]));
        this.reqEnergy = parseInt(obj["reqEnergy"]);
        this.reqEnergyStep = parseInt(obj["reqEnergyStep"]);
        this.reqStat = String(obj["reqStat"]);
        this.reqStatBase = parseInt(obj["reqStatBase"]);
        this.reqStatStepPerLevel = parseInt(obj["reqStatStepPerLevel"]);
        this.reqLessThanFullHealth = Boolean(parseInt(obj["reqLessThanFullHealth"]));
        this.reqLessThanFullEnergy = Boolean(parseInt(obj["reqLessThanFullEnergy"]));
        this.reqEquipItemCat1 = parseInt(obj["reqEquipItemCat1"]);
        this.reqEquipItemCat2 = parseInt(obj["reqEquipItemCat2"]);
        this.reqHealth = parseInt(obj["reqHealth"]);
    }
}