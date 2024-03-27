// I feel like i shouldn't be extending, maybe just.... yeah nvm jk

import ItemRecord, { lazyParse } from "./SelfRecord.js";

//["itemId","itemClass","itemDmgType","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"]

export default class WeaponRecord extends ItemRecord {
    itemClass: number;
    itemDmgType: number;
    corePassiveItemId: number;
    coreActiveItemId: number;
    corePassiveLock: number;
    coreActiveLock: number;

    constructor(data: any) {
        super(data);

        this.itemClass = lazyParse(data['itemClass'], 0);
        this.itemDmgType = lazyParse(data['itemDmgType'], 0);
        this.corePassiveItemId = lazyParse(data['corePassiveItemId'], 0);
        this.coreActiveItemId = lazyParse(data['coreActiveItemId'], 0);
        this.corePassiveLock = lazyParse(data['corePassiveLock'], 0);
        this.coreActiveLock = lazyParse(data['coreActiveLock'], 0);
    }
}