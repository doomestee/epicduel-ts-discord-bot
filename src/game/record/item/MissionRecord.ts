// I feel like i shouldn't be extending, maybe just.... yeah nvm jk

import ItemRecord, { lazyParse } from "./SelfRecord.js";

//["itemId","itemDesc"]

export default class MissionItemRecord extends ItemRecord {
    itemDesc: string;

    constructor(data: any) {
        super(data);

        this.itemDesc = lazyParse(String(data['itemDesc']), "");
    }
}