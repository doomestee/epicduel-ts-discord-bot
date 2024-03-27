// let ClassRecord = require("../record/ClassRecord");
// const { SharedBox } = require("./SharedBox");

import ClassRecord from "../record/ClassRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class ClassBox extends SharedBox<number, ClassRecord> {
    constructor() {
        super(["classId", "className", "classLinkage", "classMaxHp", "classMaxMp", "classStr", "classDex", "classTech", "classSupp"], ClassRecord);
    }

    getAdjustedClassId(classId=-1) {
        if (classId === -1) throw Error("Undefined classId");

        if (classId > 3) return classId - 3;
        return classId;
    }

    static getAdjustedClassId(classId=-1) {
        if (classId === -1) throw Error("Undefined classId");

        if (classId > 3) return classId - 3;
        return classId;
    }

    static MAX_HP_GAIN_PER_LEVEL = 5;
    static MAX_MP_GAIN_PER_LEVEL = 1.5;

    static BOUNTY_HUNTER = "BountyHunter";      
    static TECH_MAGE = "TechMage";            
    static MERCENARY = "Mercenary";            
    static CYBER_HUNTER = "CyberHunter";            
    static BLOOD_MAGE = "BloodMage";            
    static TACTICAL_MERCENARY = "TacticalMercenary";            
    static CLASS_CATEGORY_HUNTERS = "Hunters";            
    static CLASS_CATEGORY_MAGES = "Mages";            
    static CLASS_CATEGORY_MERCENARIES = "Mercenaries";            
    static BOUNTY_HUNTER_CLASS_ID = 1;            
    static MERCENARY_CLASS_ID = 2;            
    static TECH_MAGE_CLASS_ID = 3;            
    static CYBER_HUNTER_CLASS_ID = 4;            
    static TACTICAL_MERCENARY_CLASS_ID = 5;            
    static BLOOD_MAGE_CLASS_ID = 6;            
    static BOUNTY_HUNTER_PREFIX = "BH";            
    static TECH_MAGE_PREFIX = "TM";            
    static MERCENARY_PREFIX = "MC";

    static CLASS_NAME_BY_ID = [null, "Bounty Hunter", "Mercenary", "Tech Mage", "Cyber Hunter", "Tactical Mercenary", "Blood Mage"]

    static getClassPrefixById(classId=1) {
        let adjusted = this.getAdjustedClassId(classId);
        switch (adjusted) {
            case this.BOUNTY_HUNTER_CLASS_ID: return this.BOUNTY_HUNTER_PREFIX;
            case this.TECH_MAGE_CLASS_ID: return this.TECH_MAGE_PREFIX;
            case this.MERCENARY_CLASS_ID: return this.MERCENARY_PREFIX;
            default: return "";
        }
    }
}