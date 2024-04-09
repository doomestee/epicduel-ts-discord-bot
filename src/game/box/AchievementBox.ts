import { Collection } from "oceanic.js";
import AchievementRecord from "../record/AchievementRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class AchievementSBox extends SharedBox<number, AchievementRecord> {
    static CATEGORY_ALL: -1;
    static CATEGORY_GENERAL: 1;
    static CATEGORY_WAR: 2;
    static CATEGORY_BOSS: 3;
    static CATEGORY_ARCADE: 4;
    static CATEGORY_SEASONAL: 5;
    static CATEGORY_BADGES: 6;
    static CATEGORY_ULTRA_RARE: 7;
    static CATEGORY_EVENT: 8;

    availList: AchievementRecord[];

    static objMap = new Collection<number, AchievementRecord>();

    constructor() {
        super(["achId", "achLink", "achName", "achDetails", "achRating", "achGroup", "hasBuyUpgrades", "achCredits", "achDisplayCountReq", "achGroupTier", "categoryId", "visibleWhenUnowned", "isBuyable", "rarityId"], AchievementRecord, AchievementSBox.objMap);

        this.availList = [];

        this.postprocess = (ach) => {
            if (ach.isBuyable) this.availList.push(ach);

            return true;
        }
    }
}