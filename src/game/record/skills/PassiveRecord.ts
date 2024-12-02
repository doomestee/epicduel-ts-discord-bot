export default class PassiveRecord {
    static FIELD_skillId = "skillId";
    static FIELD_passiveRestrictGroupId = "passiveRestrictGroupId";
    static FIELD_passiveLink = "passiveLink";
    static FIELD_displayOnChar = "displayOnChar";
    static FIELD_displayInStats = "displayInStats";
    static FIELD_isDebuff = "isDebuff";
    static FIELD_duration = "duration";
    static FIELD_rateRulesId = "rateRulesId";
    static FIELD_statRulesId = "statRulesId";
    static FIELD_defendRulesId = "defendRulesId";
    static FIELD_turnRulesId = "turnRulesId";
    static FIELD_miscRulesId = "miscRulesId";
    static FIELD_initialize = "initialize";
    static FIELD_passiveRestrictGroupId2 = "passiveRestrictGroupId2";
    
    static templates  = [PassiveRecord.FIELD_skillId,PassiveRecord.FIELD_passiveRestrictGroupId,PassiveRecord.FIELD_passiveLink,PassiveRecord.FIELD_displayOnChar,PassiveRecord.FIELD_displayInStats,PassiveRecord.FIELD_isDebuff,PassiveRecord.FIELD_duration,PassiveRecord.FIELD_rateRulesId,PassiveRecord.FIELD_statRulesId,PassiveRecord.FIELD_defendRulesId,PassiveRecord.FIELD_turnRulesId,PassiveRecord.FIELD_miscRulesId,PassiveRecord.FIELD_initialize,PassiveRecord.FIELD_passiveRestrictGroupId2];
     

    skillId: number;
    passiveRestrictGroupId: number;
    passiveLink: string;
    displayOnChar: boolean;
    displayInStats: boolean;
    isDebuff: boolean;
    duration: number;
    rateRulesId: number;
    statRulesId: number;
    defendRulesId: number;
    turnRulesId: number;
    miscRulesId: number;
    initialize: number;
    passiveRestrictGroupId2: number; 

    constructor(obj: any) {
        this.skillId = parseInt(obj["skillId"]);
        this.passiveRestrictGroupId = parseInt(obj["passiveRestrictGroupId"]);
        this.passiveLink = obj["passiveLink"];
        this.displayOnChar = Boolean(parseInt(obj["displayOnChar"]));
        this.displayInStats = Boolean(parseInt(obj["displayInStats"]));
        this.isDebuff = Boolean(parseInt(obj["isDebuff"]));
        this.duration = parseInt(obj["duration"]);
        this.rateRulesId = parseInt(obj["rateRulesId"]);
        this.statRulesId = parseInt(obj["statRulesId"]);
        this.defendRulesId = parseInt(obj["defendRulesId"]);
        this.turnRulesId = parseInt(obj["turnRulesId"]);
        this.miscRulesId = parseInt(obj["miscRulesId"]);
        this.initialize = parseInt(obj["initialize"]);
        this.passiveRestrictGroupId2 = obj["passiveRestrictGroupId2"];
    }
}