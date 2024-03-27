export default class ClassRecord {
    static FIELD_classId = "classId";
    static FIELD_className = "className";
    static FIELD_classLinkage = "classLinkage";
    static FIELD_classMaxHp = "classMaxHp";
    static FIELD_classMaxMp = "classMaxMp";
    static FIELD_classStr = "classStr";
    static FIELD_classDex = "classDex";
    static FIELD_classTech = "classTech";
    static FIELD_classSupp = "classSupp";
    static MAX_HP_GAIN_PER_LEVEL = 5;
    static MAX_MP_GAIN_PER_LEVEL = 1.5;

    classId: number;
    className: string;
    classLinkage: string;
    classMaxHp: number;
    classMaxMp: number;
    classStr: number;
    classDex: number;
    classTech: number;
    classSupp: number;

    constructor(obj: any) {
        this.classId = parseInt(obj[ClassRecord.FIELD_classId]);
        this.className = (obj[ClassRecord.FIELD_className]);
        this.classLinkage = (obj[ClassRecord.FIELD_classLinkage]);
        this.classMaxHp = parseInt(obj[ClassRecord.FIELD_classMaxHp]);
        this.classMaxMp = parseInt(obj[ClassRecord.FIELD_classMaxMp]);
        this.classStr = parseInt(obj[ClassRecord.FIELD_classStr]);
        this.classDex = parseInt(obj[ClassRecord.FIELD_classDex]);
        this.classTech = parseInt(obj[ClassRecord.FIELD_classTech]);
        this.classSupp = parseInt(obj[ClassRecord.FIELD_classSupp]);
    }


    /**
     * @param {} classAttrib 
     * @returns 
     */
    getClassAttribValue(classAttrib: "classMaxHp"|"classMaxMp"|"classStr"|"classDex"|"classTech"|"classSupp") {
        switch (classAttrib) {
            case "classMaxHp": return this.classMaxHp;
            case "classMaxMp": return this.classMaxMp;
            case "classStr": return this.classStr;
            case "classDex": return this.classDex;
            case "classTech": return this.classTech;
            case "classSupp": return this.classSupp;
            default: return 0;
        }
    }

    getMinHpByLevel(charLvl=1) {
        return Math.floor(this.classMaxHp + charLvl * 5);
    }

    getMinMpByLevel(charLvl=1) {
        return Math.floor(this.classMaxMp + charLvl * 1.5);
    }
}