export default class StyleRecord {
    static FIELD_styleId = "styleId";
    static FIELD_styleClassId = "styleClassId";
    static FIELD_styleGender = "styleGender";
    static FIELD_styleIndex = "styleIndex";
    static FIELD_styleCredits = "styleCredits";
    static FIELD_styleVarium = "styleVarium";
    static FIELD_styleHasAbove = "styleHasAbove";

    styleId: number;
    styleClassId: number;
    styleGender: string;
    styleIndex: number;
    styleCredits: number;
    styleVarium: number;
    styleHasAbove: number;

    private _owned = false;

    constructor(obj: any) {
        this.styleId = parseInt(obj[StyleRecord.FIELD_styleId]);
        this.styleClassId = parseInt(obj[StyleRecord.FIELD_styleClassId]);
        this.styleGender = String(obj[StyleRecord.FIELD_styleGender]);
        this.styleIndex = parseInt(obj[StyleRecord.FIELD_styleIndex]);
        this.styleCredits = parseInt(obj[StyleRecord.FIELD_styleCredits]);
        this.styleVarium = parseInt(obj[StyleRecord.FIELD_styleVarium]);
        this.styleHasAbove = parseInt(obj[StyleRecord.FIELD_styleHasAbove]);

        /**
         * @private
         */
        this._owned = false;
    }

    get owned() {
        return this._owned || this.styleVarium == 0 && this.styleCredits == 0;
    }

    set owned(v) {
        this._owned = v;
    }
}