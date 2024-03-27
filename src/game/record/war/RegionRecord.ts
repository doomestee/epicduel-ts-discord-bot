export default class WarObjectiveStaticRecord {
    public static readonly FIELD_objectiveId = "objectiveId";
      
    public static readonly FIELD_regionId = "regionId";
    
    public static readonly FIELD_isMainObj = "isMainObj";
    
    public static readonly FIELD_objTitle = "objTitle";
    
    public static readonly FIELD_objType = "objType";
    
    public static readonly FIELD_objStates = "objStates";
    
    public static readonly FIELD_objDesc = "objDesc";
    
    public static _template = [WarObjectiveStaticRecord.FIELD_objectiveId,WarObjectiveStaticRecord.FIELD_regionId,WarObjectiveStaticRecord.FIELD_isMainObj,WarObjectiveStaticRecord.FIELD_objTitle,WarObjectiveStaticRecord.FIELD_objType,WarObjectiveStaticRecord.FIELD_objStates,WarObjectiveStaticRecord.FIELD_objDesc];

    objectiveId: number;
    regionId: number;
    isMainObj: boolean;
    objTitle: string;
    objType: number;
    objStates: number;
    objDesc: string;

    constructor(obj: any) {
        this["objectiveId"] = Number(obj[WarObjectiveStaticRecord.FIELD_objectiveId]);
        this["regionId"] = Number(obj[WarObjectiveStaticRecord.FIELD_regionId]);
        this["isMainObj"] = obj[WarObjectiveStaticRecord.FIELD_isMainObj] === "1";
        this["objTitle"] = (obj[WarObjectiveStaticRecord.FIELD_objTitle]);
        this["objType"] = Number(obj[WarObjectiveStaticRecord.FIELD_objType]);
        this["objStates"] = Number(obj[WarObjectiveStaticRecord.FIELD_objStates]);
        this["objDesc"] = (obj[WarObjectiveStaticRecord.FIELD_objDesc]);
    }
}