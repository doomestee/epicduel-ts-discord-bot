import { Collection } from "oceanic.js";
import MerchantRecord from "../record/MerchantRecord.js";
import { SharedBox } from "./SharedBox.js";
import RoomManager from "../module/RoomManager.js";
import { map } from "../../util/Misc.js";

export default class MerchantSBox extends SharedBox<number, MerchantRecord> {
    static objMap = new Collection<number, MerchantRecord>();

    constructor() {
        super(["merchantId", "mercName", "mercLink", "mercScale", "mercX", "mercY", "mercOpts", "mercChat", "npcId", "merchLvl", "reqItems", "mercBoss", "mercAlign", "mercCanJump"], MerchantRecord, MerchantSBox.objMap);

        if (RoomManager.unique_processed === false) {
            RoomManager.unique_processed = true;

            const arr:number[] = [];

            const mercs = map(RoomManager.unique_merchants, v => [v, this.objMap.get(v)?.mercName] as [number, string]);

            const grouped = Object.groupBy(mercs, v => v[1]);

            const values = Object.values(grouped);

            for (let i = 0, len = values.length; i < len; i++) {
                const val = values[i];

                if (val?.length === 1) arr.push(val[0][0])
            }
        
            RoomManager.unique_merchants = arr;
        }
    }
}