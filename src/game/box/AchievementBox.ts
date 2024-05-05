import { Collection } from "oceanic.js";
import AchievementRecord from "../record/AchievementRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class AchievementSBox extends SharedBox<number, AchievementRecord> {
    static readonly CATEGORY_ALL = -1;
    static readonly CATEGORY_GENERAL = 1;
    static readonly CATEGORY_WAR = 2;
    static readonly CATEGORY_BOSS = 3;
    static readonly CATEGORY_ARCADE = 4;
    static readonly CATEGORY_SEASONAL = 5;
    static readonly CATEGORY_BADGES = 6;
    static readonly CATEGORY_ULTRA_RARE = 7;
    static readonly CATEGORY_EVENT = 8;

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