export default class AllRecord {
    static FIELD_skillId = "skillId";
    static FIELD_skillName = "skillName";
    static FIELD_skillDesc = "skillDesc";
    static FIELD_skillLink = "skillLink";
    static FIELD_skillUnit = "skillUnit";
    static FIELD_skillPassive = "skillPassive";
    static FIELD_skillImproves = "skillImproves";
    
    static templates  = [AllRecord.FIELD_skillId,AllRecord.FIELD_skillName,AllRecord.FIELD_skillDesc,AllRecord.FIELD_skillLink,AllRecord.FIELD_skillUnit,AllRecord.FIELD_skillPassive,AllRecord.FIELD_skillImproves];

    static SKILL_ID_MEDIC_BOUNTY_HUNTER = 1;
    static SKILL_ID_SHADOW_ARTS_BOUNTY_HUNTER = 561;
    static SKILL_ID_MEDIC_MERCENARY = 60;
    static SKILL_ID_MEDIC_TECH_MAGE = 61;
    static SKILL_ID_MEDIC_CYBER_HUNTER = 62;
    static SKILL_ID_MEDIC_TACTICAL_MERCENARY = 63;
    static SKILL_ID_MEDIC_BLOOD_MAGE = 64;
    static SKILL_ID_SHADOW_ARTS_CYBER_HUNTER = 80;
    static SKILL_ID_BALLISTIC_BUNNY_BOT_COLOR_BLAST = 151;
    static SKILL_ID_ELECTRO_BUNNY_BOT_COLOR_BLAST = 155;
    static SKILL_ID_SHELL_SHOCKER = 332;
    static SKILL_ID_LIONHARTS_ROAR_P = 216;
    static SKILL_ID_LIONHARTS_ROAR_E = 219;
    static SKILL_ID_CURSE_OF_KARTHERAX_P = 224;
    static SKILL_ID_CURSE_OF_KARTHERAX_E = 225;
    static SKILL_ID_DEEP_PLAGUE = 228;
    static SKILL_ID_MOLTEN_BULLET = 356;
    static SKILL_ID_MOLTEN_SHRAPNEL = 374;
    static SKILL_ID_RETRIBUTION = 696;
    static SKILL_ID_INFECTION = 842;

    skillId: number;
    skillName: string;
    skillDesc: string;
    skillLink: string;
    skillUnit: string;
    skillPassive: boolean;
    skillImproves: boolean;

    constructor(obj: any) {
        this.skillId = parseInt(obj["skillId"]);
        this.skillName = String(obj["skillName"]);
        this.skillDesc = String(obj["skillDesc"]);
        this.skillLink = String(obj["skillLink"]);
        this.skillUnit = String(obj["skillUnit"]);
        this.skillPassive = (obj["skillPassive"]) == "1";
        this.skillImproves = (obj["skillImproves"]) == "1";
    }
}