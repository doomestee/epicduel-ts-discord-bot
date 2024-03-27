export default class ActiveAttackRulesRecord {
    static FIELD_attackRulesId = "attackRulesId";
    static FIELD_damageTypeCode = "damageTypeCode";
    
    static templates  = [ActiveAttackRulesRecord.FIELD_attackRulesId,ActiveAttackRulesRecord.FIELD_damageTypeCode];

    attackRulesId: number;
    damageTypeCode: number;

    constructor(obj: any) {
        this.attackRulesId = parseInt(obj["attackRulesId"]);
        this.damageTypeCode = parseInt(obj["damageTypeCode"]);
    }

    // /**
    //  * DEFUNCT
    //  * @param {*} user 
    //  */
    // getAttackDamageType(user) {

    // }
}