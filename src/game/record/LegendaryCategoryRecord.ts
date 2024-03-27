export default class LegendaryCategoryRecord {
    static FIELD_catId = "categoryId";
    static FIELD_catName = "catName";
    static FIELD_catLink = "catLink";
    static FIELD_maxSlots = "maxSlots";
    static FIELD_pointValue = "pointValue";

    categoryId: number;
    catName: string;
    catLink: string;
    maxSlots: number;
    pointValue: number;

    constructor(obj: any) {
        this.categoryId = parseInt(obj[LegendaryCategoryRecord.FIELD_catId]);
        this.catName = String(obj[LegendaryCategoryRecord.FIELD_catName]);
        this.catLink = String(obj[LegendaryCategoryRecord.FIELD_catLink]);
        this.maxSlots = parseInt(obj[LegendaryCategoryRecord.FIELD_maxSlots]);
        this.pointValue = parseInt(obj[LegendaryCategoryRecord.FIELD_pointValue]);
    }
}