// let ClassRecord = require("../record/ClassRecord");
// const { SharedBox } = require("./SharedBox");

import HomeRecord from "../record/HomeRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class HomeBox extends SharedBox<number, HomeRecord> {
    constructor() {
        super(["homeId", "homeName", "homeDesc", "homeCredits", "homeVarium", "homeRegion", "homeRooms", "homeForSale"], HomeRecord);
    }

    /**
     * @returns {HomeRecord} If passByRef is false, it will be an object so instanceof shan't be used.
     */
    getHomeById(homeId: number, passByRef=true) : HomeRecord | null {
        let home;

        if ((home = this.objMap.get(homeId)) === undefined) return null;

        if (passByRef) return home;
        else return JSON.parse(JSON.stringify(home));
    }

    // /**
    //  * @returns {HomeRecord} Except is an object, so can't use instanceof
    //  */
    // getHomeByIndex(homeIndex: number) {
    //     // if (this.objMap.get(homeIndex)) {
    //     //     return JSON.parse(JSON.stringify(homeRecord));
    //     // } return null;
    // }
}