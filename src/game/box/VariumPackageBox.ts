import VariumPackageRecord from "../record/VariumPackageRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class VariumPackageSBox extends SharedBox<number, VariumPackageRecord> {
    constructor() {
        super(["packageId", "packageString", "packageVarium", "packageCredits", "receiptVarium", "packagePointCost", "packageBtnClass", "packageBtnPosition", "packageGfxSwf", "packagePage", "packageItems", "packageItemsResale", "packageActiveCores", "packagePassiveCores", "packageRegionId", "packageAlignId"], VariumPackageRecord);
    }
}