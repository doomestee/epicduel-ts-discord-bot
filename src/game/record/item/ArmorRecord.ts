import ItemRecord, { lazyParse } from "./SelfRecord.js";

//["itemId","itemSexReq","itemClass","customHeadLink","noHead","noHip","defaultLimbs","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"]

export default class ArmorItemRecord extends ItemRecord {
    itemSexReq: string;
    itemClass: number;
    customHeadLink: string;
    noHead: number;
    noHip: number;
    defaultLimbs: number;
    corePassiveItemId: number;
    coreActiveItemId: number;
    corePassiveLock: number;
    coreActiveLock: number;

    constructor(data: any) {
        super(data);

        this.itemSexReq = lazyParse(data['itemSexReq'], "");
        this.itemClass = lazyParse(data['itemClass'], 0);
        this.customHeadLink = lazyParse(data['customHeadLink'], "");
        this.noHead = lazyParse(data['noHead'], 0);
        this.noHip = lazyParse(data['noHip'], 0);
        this.defaultLimbs = lazyParse(data['defaultLimbs'], 0);
        this.corePassiveItemId = lazyParse(data['corePassiveItemId'], 0);
        this.coreActiveItemId = lazyParse(data['coreActiveItemId'], 0);
        this.corePassiveLock = lazyParse(data['corePassiveLock'], 0);
        this.coreActiveLock = lazyParse(data['coreActiveLock'], 0);
    }
}