import LegendaryCategoryRecord from "../record/LegendaryCategoryRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class LegendaryCategorySBox extends SharedBox<number, LegendaryCategoryRecord> {
    static CAT_ID_PRIMARY_DMG = 0;
      
    static CAT_ID_GUN_DMG = 1;
    
    static CAT_ID_AUX_DMG = 2;
    
    static CAT_ID_DEFENSE = 3;
    
    static CAT_ID_RESIST = 4;
    
    static CAT_ID_ROBOT_DMG = 5;
    
    static CAT_ID_MEDICAL_MASTERY = 6;
    
    static CAT_ID_ENERGY_EFFICIENCY = 7;
    
    static CAT_ID_NPC_CRUSHER = 8;
    
    static CAT_ID_NPC_ARMOR = 9;

    constructor() {
        super(["categoryId", "catName", "catLink", "maxSlots", "pointValue"], LegendaryCategoryRecord);
    }
}