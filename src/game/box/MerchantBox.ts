import MerchantRecord from "../record/MerchantRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class MerchantSBox extends SharedBox<number, MerchantRecord> {
    constructor() {
        super(["merchantId", "mercName", "mercLink", "mercScale", "mercX", "mercY", "mercOpts", "mercChat", "npcId", "merchLvl", "reqItems", "mercBoss", "mercAlign", "mercCanJump"], MerchantRecord);
    }
}