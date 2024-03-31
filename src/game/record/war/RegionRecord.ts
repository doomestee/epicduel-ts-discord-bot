export default class WarRegionRecord {
    public static readonly FIELD_regionId = "regionId";
      
    public static readonly FIELD_warTitle = "warTitle";
    
    public static readonly FIELD_warDesc = "warDesc";
    
    public static readonly FIELD_defenseObjAction = "defenseObjAction";
    
    public static readonly FIELD_offenseObjAction = "offenseObjAction";
    
    public static readonly FIELD_defenseUnit = "defenseUnit";
    
    public static readonly FIELD_offenseUnit = "offenseUnit";
    
    public static readonly FIELD_defenseItemId = "defenseItemId";
    
    public static readonly FIELD_defenseSuperItemId = "defenseSuperItemId";
    
    public static readonly FIELD_offenseItemId = "offenseItemId";
    
    public static readonly FIELD_offenseSuperItemId = "offenseSuperItemId";
    
    public static readonly FIELD_defenseVictory = "defenseVictory";
    
    public static readonly FIELD_offenseVictory = "offenseVictory";
    
    public static readonly FIELD_defenseNotification = "defenseNotification";
    
    public static readonly FIELD_offenseNotification = "offenseNotification";
    
    public static _template = [this.FIELD_regionId,this.FIELD_warTitle,this.FIELD_warDesc,this.FIELD_defenseObjAction,this.FIELD_offenseObjAction,this.FIELD_defenseUnit,this.FIELD_offenseUnit,this.FIELD_defenseItemId,this.FIELD_defenseSuperItemId,this.FIELD_offenseItemId,this.FIELD_offenseSuperItemId,this.FIELD_defenseVictory,this.FIELD_offenseVictory,this.FIELD_defenseNotification,this.FIELD_offenseNotification];

    regionId: number;
    warTitle: string;
    warDesc: string;
    defenseObjAction: string;
    offenseObjAction: string;
    defenseUnit: string;
    offenseUnit: string;
    defenseItemId: number;
    defenseSuperItemId: number;
    offenseItemId: number;
    offenseSuperItemId: number;
    defenseVictory: string;
    offenseVictory: string;
    defenseNotification: string;
    offenseNotification: string;

    constructor(obj: Record<string, string>) {
        this["regionId"] = parseInt(obj[WarRegionRecord.FIELD_regionId]);
        this["warTitle"] = obj[WarRegionRecord.FIELD_warTitle];
        this["warDesc"] = obj[WarRegionRecord.FIELD_warDesc];
        this["defenseObjAction"] = obj[WarRegionRecord.FIELD_defenseObjAction];
        this["offenseObjAction"] = obj[WarRegionRecord.FIELD_offenseObjAction];
        this["defenseUnit"] = obj[WarRegionRecord.FIELD_defenseUnit];
        this["offenseUnit"] = obj[WarRegionRecord.FIELD_offenseUnit];
        this["defenseItemId"] = parseInt(obj[WarRegionRecord.FIELD_defenseItemId]);
        this["defenseSuperItemId"] = parseInt(obj[WarRegionRecord.FIELD_defenseSuperItemId]);
        this["offenseItemId"] = parseInt(obj[WarRegionRecord.FIELD_offenseItemId]);
        this["offenseSuperItemId"] = parseInt(obj[WarRegionRecord.FIELD_offenseSuperItemId]);
        this["defenseVictory"] = obj[WarRegionRecord.FIELD_defenseVictory];
        this["offenseVictory"] = obj[WarRegionRecord.FIELD_offenseVictory];
        this["defenseNotification"] = obj[WarRegionRecord.FIELD_defenseNotification];
        this["offenseNotification"] = obj[WarRegionRecord.FIELD_offenseNotification];
    }
}