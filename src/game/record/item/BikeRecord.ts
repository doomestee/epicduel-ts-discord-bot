// I feel like i shouldn't be extending, maybe just.... yeah nvm jk

import ItemRecord from "./SelfRecord.js";

// okay but why this in particular

//["itemId"]

export default class BikeItemRecord extends ItemRecord<10> {
    constructor(data: any) {
        super(data);
    }
}