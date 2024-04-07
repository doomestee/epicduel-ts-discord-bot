// I feel like i shouldn't be extending, maybe just.... yeah nvm jk

import ItemRecord, { lazyParse } from "./SelfRecord.js";

//["itemId","coreId","maxCharges"]

export default class CoreItemRecord extends ItemRecord<9> {
    coreId: number;
    maxCharges: number;

    constructor(data: any) {
        super(data);

        this.coreId = lazyParse(data['coreId'], 0);
        this.maxCharges = lazyParse(data['maxCharges'], 0);
    }
}