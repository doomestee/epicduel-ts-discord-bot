export default class CoreRecord {
    static FIELD_coreId = "coreId";
    static FIELD_coreType = "coreType";
    static FIELD_coreItemCat = "coreItemCat";
    static FIELD_skillId = "skillId";
    static FIELD_coreValue = "coreValue";
    static FIELD_coreLevel = "coreLevel";

    static templates = [CoreRecord.FIELD_coreId,CoreRecord.FIELD_coreType,CoreRecord.FIELD_coreItemCat,CoreRecord.FIELD_skillId,CoreRecord.FIELD_coreValue,CoreRecord.FIELD_coreLevel];

    coreId: number;
    coreType: number;
    coreItemCat: number;
    skillId: number;
    coreValue: number;
    coreLevel: number;

    constructor(obj: any) {
        /**
         * May be null, or not.
         * @type {import("./AllRecord")} skill
         */
        // this.skill = null;
        this.coreId = parseInt(obj["coreId"]);
        this.coreType = parseInt(obj["coreType"]);
        this.coreItemCat = parseInt(obj["coreItemCat"]);
        this.skillId = parseInt(obj["skillId"]);
        this.coreValue = parseInt(obj["coreValue"]);
        this.coreLevel = parseInt(obj["coreLevel"]);
    }
    
    // get skillFirstLetterIndex()
    // {
        // let alphabet = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
        // let letter = this.skill.skillName.charAt(0).toUpperCase();
        // return alphabet.indexOf(letter);
    // }
}