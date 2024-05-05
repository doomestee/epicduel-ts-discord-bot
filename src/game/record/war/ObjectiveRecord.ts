export default class WarObjectiveStaticRecord {
    static FIELD_objectiveId = "objectiveId";
    static FIELD_regionId = "regionId";
    static FIELD_isMainObj = "isMainObj";
    static FIELD_objTitle = "objTitle";
    static FIELD_objType = "objType";
    static FIELD_objStates = "objStates";
    static FIELD_objDesc = "objDesc";

    objectiveId: number;
    regionId: number;
    isMainObj: boolean;
    objTitle: string;
    objType: number;
    objStates: number;
    objDesc: string;
    
    static _template = [this.FIELD_objectiveId,this.FIELD_regionId,this.FIELD_isMainObj,this.FIELD_objTitle,this.FIELD_objType,this.FIELD_objStates,this.FIELD_objDesc];

    constructor(obj: any) {
        this.objectiveId = parseInt(obj[WarObjectiveStaticRecord.FIELD_objectiveId]);
        this.regionId = parseInt(obj[WarObjectiveStaticRecord.FIELD_regionId]);
        this.isMainObj = (obj[WarObjectiveStaticRecord.FIELD_isMainObj]) === "1";
        this.objTitle = String(obj[WarObjectiveStaticRecord.FIELD_objTitle]);
        this.objType = parseInt(obj[WarObjectiveStaticRecord.FIELD_objType]);
        this.objStates = parseInt(obj[WarObjectiveStaticRecord.FIELD_objStates]);
        this.objDesc = String(obj[WarObjectiveStaticRecord.FIELD_objDesc]);
    }
}