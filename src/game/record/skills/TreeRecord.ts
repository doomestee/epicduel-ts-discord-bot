export default class TreeRecord {
    static FIELD_classId = "classId";
    static FIELD_skillId = "skillId";
    static FIELD_reqLevel = "reqLevel";
    static FIELD_treeRow = "treeRow";
    static FIELD_treeColumn = "treeColumn";
    static FIELD_treeReqSkillId = "treeReqSkillId";
    static FIELD_level1 = "level1";
    static FIELD_level2 = "level2";
    static FIELD_level3 = "level3";
    static FIELD_level4 = "level4";
    static FIELD_level5 = "level5";
    static FIELD_level6 = "level6";
    static FIELD_level7 = "level7";
    static FIELD_level8 = "level8";
    static FIELD_level9 = "level9";
    static FIELD_level10 = "level10";
    
    static templates  = [TreeRecord.FIELD_classId,TreeRecord.FIELD_skillId,TreeRecord.FIELD_reqLevel,TreeRecord.FIELD_treeRow,TreeRecord.FIELD_treeColumn,TreeRecord.FIELD_treeReqSkillId,TreeRecord.FIELD_level1,TreeRecord.FIELD_level2,TreeRecord.FIELD_level3,TreeRecord.FIELD_level4,TreeRecord.FIELD_level5,TreeRecord.FIELD_level6,TreeRecord.FIELD_level7,TreeRecord.FIELD_level8,TreeRecord.FIELD_level9,TreeRecord.FIELD_level10];

    classId: number;
    skillId: number;
    reqLevel: number;
    treeRow: number;
    treeColumn: number;
    treeReqSkillId: number;
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    level6: number;
    level7: number;
    level8: number;
    level9: number;
    level10: number;

    constructor(obj: any) {
        this.classId = parseInt(obj["classId"]);
        this.skillId = parseInt(obj["skillId"]);
        this.reqLevel = parseInt(obj["reqLevel"]);
        this.treeRow = parseInt(obj["treeRow"]);
        this.treeColumn = parseInt(obj["treeColumn"]);
        this.treeReqSkillId = parseInt(obj["treeReqSkillId"]);
        this.level1 = parseInt(obj["level1"]);
        this.level2 = parseInt(obj["level2"]);
        this.level3 = parseInt(obj["level3"]);
        this.level4 = parseInt(obj["level4"]);
        this.level5 = parseInt(obj["level5"]);
        this.level6 = parseInt(obj["level6"]);
        this.level7 = parseInt(obj["level7"]);
        this.level8 = parseInt(obj["level8"]);
        this.level9 = parseInt(obj["level9"]);
        this.level10 = parseInt(obj["level10"]);
    }

    getLevelValue(level=1) {
        switch(level) {
            case 1: return this.level1;
            case 2: return this.level2;
            case 3: return this.level3;
            case 4: return this.level4;
            case 5: return this.level5;
            case 6: return this.level6;
            case 7: return this.level7;
            case 8: return this.level8;
            case 9: return this.level9;
            case 10: return this.level10;
            default: return 0;
        }
    }
}