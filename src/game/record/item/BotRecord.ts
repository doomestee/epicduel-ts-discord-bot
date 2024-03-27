// I feel like i shouldn't be extending, maybe just.... yeah nvm jk

import ItemRecord, { lazyParse } from "./SelfRecord.js";

//["itemId","itemDamage","itemDmgType","corePassiveItemId","coreActiveItemId","corePassiveLock","coreActiveLock"]

export class BotItemRecord extends ItemRecord {
    itemDamage: number;
    itemDmgType: number;
    corePassiveItemId: number;
    coreActiveItemId: number;
    corePassiveLock: boolean | null;
    coreActiveLock: boolean | null;

    constructor(data: any) {
        super(data);

        this.itemDamage = lazyParse(data['itemDamage'], 0);
        this.itemDmgType = lazyParse(data['itemDmgType'], 0);
        this.corePassiveItemId = lazyParse(data['corePassiveItemId'], 0);
        this.coreActiveItemId = lazyParse(data['coreActiveItemId'], 0);
        this.corePassiveLock = data['corePassiveLock'] ? (data['corePassiveLock']) == "1" : null;
        this.coreActiveLock = data['coreActiveLock'] ? (data['coreActiveLock']) == "1" : null;
    }
}