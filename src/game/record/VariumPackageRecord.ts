export default class VariumPackageRecord {
    static FIELD_packageId = "packageId";
    static FIELD_packageString = "packageString";
    static FIELD_packageVarium = "packageVarium";
    static FIELD_packageCredits = "packageCredits";
    static FIELD_receiptVarium = "receiptVarium";
    static FIELD_packagePointCost = "packagePointCost";
    static FIELD_packageBtnClass = "packageBtnClass";
    static FIELD_packageBtnPosition = "packageBtnPosition";
    static FIELD_packageGfxSwf = "packageGfxSwf";
    static FIELD_packagePage = "packagePage";
    static FIELD_packageItems = "packageItems";
    static FIELD_packageItemsResale = "packageItemsResale";
    static FIELD_packageActiveCores = "packageActiveCores";
    static FIELD_packagePassiveCores = "packagePassiveCores";
    static FIELD_packageRegionId = "packageRegionId";
    static FIELD_packageAlignId = "packageAlignId";

    packageId: number;
    packageString: string;
    packageVarium: number;
    packageCredits: number;
    receiptVarium: number;
    packagePointCost: number;
    packageBtnClass: string;
    packageBtnPosition: number;
    packageGfxSwf: string;
    packagePage: number;
    packageItems: number[];
    packageItemsResale: string[];
    packageActiveCores: string[];
    packagePassiveCores: string[];
    packageRegionId: number;
    packageAlignId: number;

    constructor(obj: any) {
        this.packageId = parseInt(obj[VariumPackageRecord.FIELD_packageId]);
        this.packageString = String(obj[VariumPackageRecord.FIELD_packageString]);
        this.packageVarium = parseInt(obj[VariumPackageRecord.FIELD_packageVarium]);
        this.packageCredits = parseInt(obj[VariumPackageRecord.FIELD_packageCredits]);
        this.receiptVarium = parseInt(obj[VariumPackageRecord.FIELD_receiptVarium]);
        this.packagePointCost = parseInt(obj[VariumPackageRecord.FIELD_packagePointCost]);
        this.packageBtnClass = String(obj[VariumPackageRecord.FIELD_packageBtnClass]);
        this.packageBtnPosition = parseInt(obj[VariumPackageRecord.FIELD_packageBtnPosition]);
        this.packageGfxSwf = String(obj[VariumPackageRecord.FIELD_packageGfxSwf]);
        this.packagePage = parseInt(obj[VariumPackageRecord.FIELD_packagePage]);
        this.packageItems = processPackageItems(obj[VariumPackageRecord.FIELD_packageItems]);
        this.packageItemsResale = String(obj[VariumPackageRecord.FIELD_packageItemsResale]).split(",");
        this.packageActiveCores = String(obj[VariumPackageRecord.FIELD_packageActiveCores]).split(",");
        this.packagePassiveCores = String(obj[VariumPackageRecord.FIELD_packagePassiveCores]).split(",");
        this.packageRegionId = parseInt(obj[VariumPackageRecord.FIELD_packageRegionId]);
        this.packageAlignId = parseInt(obj[VariumPackageRecord.FIELD_packageAlignId]);
    }
}

let processPackageItems = (val="") => {
    if (val === "") return [];

    const unfiltered = val.split(",");
    let filtered = [];

    for (let i = 0; i < unfiltered.length; i++) {
        let itemStr = unfiltered[i];
        let firstChar = itemStr.charAt(0);

        if (firstChar === "G") {
            let itemList = itemStr.substr(1).split("|");
            let maleItemId = parseInt(itemList[0]);
            let femaleItemId = parseInt(itemList[1]);

            filtered.push(maleItemId, femaleItemId);
        } else if (itemStr.indexOf(":") !== -1) {
            filtered.push(parseInt(itemStr.split(":")[0]));
        } else filtered.push(parseInt(itemStr));
    }; return filtered;
}