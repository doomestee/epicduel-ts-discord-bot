export default class MissionGroupRecord {
    static FIELD_groupId = "groupId";
    static FIELD_groupName = "groupName";
    static FIELD_categoryId = "categoryId";
    static FIELD_isActive = "isActive";
    static FIELD_groupOrder = "groupOrder";
    static FIELD_groupIdReq = "groupIdReq";

    static _template = [this.FIELD_groupId, this.FIELD_groupName, this.FIELD_categoryId, this.FIELD_isActive, this.FIELD_groupOrder, this.FIELD_groupIdReq];

    groupId: number;
    groupName: string;
    categoryId: number;
    isActive: boolean;
    groupOrder: number;
    groupIdReq: number;

    constructor(obj: any) {
        this.groupId = parseInt(obj[MissionGroupRecord.FIELD_groupId]);
        this.groupName = String(obj[MissionGroupRecord.FIELD_groupName]);
        this.categoryId = parseInt(obj[MissionGroupRecord.FIELD_categoryId]);
        this.isActive = Boolean(obj[MissionGroupRecord.FIELD_isActive]);
        this.groupOrder = parseInt(obj[MissionGroupRecord.FIELD_groupOrder]);
        this.groupIdReq = parseInt(obj[MissionGroupRecord.FIELD_groupIdReq]);
    }
}