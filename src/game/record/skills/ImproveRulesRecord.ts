export default class ImproveRulesRecord {
    static FIELD_skillId = "skillId";
    static FIELD_improveWithStat = "improveWithStat";
    static FIELD_improveEveryXStat = "improveEveryXStat";
    static FIELD_improveEveryXLevelsAbove20 = "improveEveryXLevelsAbove20";
    static FIELD_weakenEveryXLevelsBelow20 = "weakenEveryXLevelsBelow20";
    
    static templates = [ImproveRulesRecord.FIELD_skillId,ImproveRulesRecord.FIELD_improveWithStat,ImproveRulesRecord.FIELD_improveEveryXStat,ImproveRulesRecord.FIELD_improveEveryXLevelsAbove20,ImproveRulesRecord.FIELD_weakenEveryXLevelsBelow20];
     
    skillId: number;
    improveWithStat: string;
    improveEveryXStat: number;
    improveEveryXLevelsAbove20: number;
    weakenEveryXLevelsBelow20: number;

    constructor(obj: any, noImproveSkillId=0) {
        let duck = {} as any;
        if(obj == null) {
            let d = {} as any;
            d["skillId"] = noImproveSkillId;
            d["improveWithStat"] = "";
            d["improveEveryXStat"] = 0;
            d["improveEveryXLevelsAbove20"] = 0;
            d["weakenEveryXLevelsBelow20"] = 0;
            duck = d;
        }
        else { duck = obj; }

        this.skillId = parseInt(duck["skillId"]);
        this.improveWithStat = (duck["improveWithStat"]);
        this.improveEveryXStat = Number(duck["improveEveryXStat"]);
        this.improveEveryXLevelsAbove20 = Number(duck["improveEveryXLevelsAbove20"]);
        this.weakenEveryXLevelsBelow20 = Number(duck["weakenEveryXLevelsBelow20"]);
    }
}