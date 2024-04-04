import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import { AnyItemRecordsExceptSelf } from "../box/ItemBox.js";
import AchievementRecord from "../record/AchievementRecord.js";
import BaseModule from "./Base.js";

export type RewardInfo = { type: 0, item: AnyItemRecordsExceptSelf, qty: number } | { type: 1, styleId: number } | { type: 2, homeItem: { id: number } } | { type: 3, ach: AchievementRecord } | { type: 4, credits: number } | { type: 5, exp: number } | { type: 6, varium: number };

export default class BattlePass extends BaseModule {
    active: boolean;
    name: string;
    pAchID: number;
    isEnhanced: boolean;
    rDays: number;
    exp: number;
    lastLvlClaim: number;
    rewards: { basic: never[]; enhanced: never[]; };
    lastCached: number;
    lastCachedD: Date;
    challenges: {
        /**
         * @type {[string, number, number, number][]} 1st index is the challenge description etc, 2nd is the progress the user has made, 3rd is the amount to achieve, 4th is the XP
         */
        daily: [string, number, number, number][];
        /**
         * @type {[string, number, number, number][]} 1st index is the challenge description etc, 2nd is the progress the user has made, 3rd is the amount to achieve, 4th is the XP
         */
        weekly: [string, number, number, number][];
    };

    constructor(public client: Client) {
        super();

        this.active = false;
        this.name = "";
        this.pAchID = 0;
        this.isEnhanced = false;
        this.rDays = 0;
        this.exp = 0;
        this.lastLvlClaim = 0;
        this.rewards = {basic: [], enhanced: []};
        /**
         * FOR CHALLENGES
         */
        this.lastCached = 0;
        this.lastCachedD = new Date(0);

        this.challenges = {
            /**
             * @type {[string, number, number, number][]} 1st index is the challenge description etc, 2nd is the progress the user has made, 3rd is the amount to achieve, 4th is the XP
             */
            daily: [],
            /**
             * @type {[string, number, number, number][]} 1st index is the challenge description etc, 2nd is the progress the user has made, 3rd is the amount to achieve, 4th is the XP
             */
            weekly: []
        };

        this.client = client;
    }

    openModule() {
        if (!this.rewards.basic.length) this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_BATTLEPASS, {}, 1, "json");
        else this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_BATTLEPASS_XP, {}, 1, "json");
    }

    /**
     * @param {number} ref
     * @param {number} qty
     * @param {number} level
     * @param {number} type
     * @returns {{type: 0, item: import("../record/item/SelfRecord"), qty: number}|{type: 1, styleId: number}|{type: 2, homeItem: {id: number}}|{type: 3, ach: import("../record/AchievementRecord")}|{type: 4, credits: number}|{type: 5, exp: number}|{type: 6, varium: number}}
     */
    rewardInfo(ref: number, qty: number, level: number, type: number) : RewardInfo;
    rewardInfo(val: { ref: number, qty: number, level: number, type: number } | Array<{ ref: number, qty: number, level: number, type: number }>) : RewardInfo;
    rewardInfo(ref: number | { ref: number, qty: number, level: number, type: number } | Array<{ ref: number, qty: number, level: number, type: number }>, qty?: number, level?: number, type?: number) : RewardInfo {
        ref = JSON.parse(JSON.stringify(ref));
        if (Array.isArray(ref)) {
            type = ref[0].type;
            level = ref[0].level;
            qty = ref[0].qty;
            ref = ref[0].ref;
        } else if (typeof ref === "object") {
            type = ref.type;
            level = ref.level;
            qty = ref.qty;
            ref = ref.ref;
        };

        if (qty === undefined || level === undefined || type === undefined) throw Error("unknown qty/level/type");

        switch (type) {
            case 0:
                return {
                    type: 0,
                    item: this.client.boxes.item.getItemById(ref) as AnyItemRecordsExceptSelf,
                    qty: Math.max(qty, 1)
                }
            case 1:
                return {
                    type: 1,
                    styleId: ref
                };
            case 2: // nobody cares about home items, or hair styles for that matter.
                return {
                    type: 2,
                    homeItem: { id: ref }
                }
            case 3:
                return {
                    type: 3,
                    ach: this.client.boxes.achievement.objMap.get(ref) as AchievementRecord
                }
            case 4:
                return {
                    type: 4,
                    credits: ref
                }
            case 5:
                return {
                    type: 5,
                    exp: ref
                }
            case 6:
                return {
                    type: 6,
                    varium: ref
                }
        }

        throw Error("unknown type");
    }

    handleInitServerResponse(data: any) {
        this.name = data.bName;
        this.pAchID = data.pAchID;
        this.isEnhanced = data.isEnhanced;
        this.rDays = data.rDays;
        this.exp = data.exp;
        this.lastLvlClaim = data.lastLvlClaim;
        this.rewards = data.rewards;
        //this.updateXP(); - UI thing
        //this.setupRewards(); - UI thing
    }

    handleChallengesServerResponse(data: any) {
        for (let i = 0; i < data.daily.length; i++) {
            let chng = data.daily[i];

            //if (chng.prog == chng.amt) {
            this.challenges.daily.push([chng.cat, chng.prog, chng.amt, chng.xp]);
            //} else {
            //    this.challenges.daily.push([chng.cat, chng.prog, chng.amt, chng.xp])
            //}
        }

        for (let y = 0; y < data.weekly.length; y++) {
            let chngW = data.weekly[y];

            this.challenges.weekly.push([chngW.cat, chngW.prog, chngW.amt, chngW.xp]);
        }

        this.lastCached = Date.now();
        this.lastCachedD = new Date();
    }

    handleServerResponse(data: any) {
        this.exp = data.exp;
        this.lastLvlClaim = data.lastLvlClaim;
        //this.updateXP(); UI
        //this.refreshRewards(); UI
    }

    openChallenges() {
        this.challenges.daily = [];
        this.challenges.weekly = [];
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_BATTLEPASS_CHALLENGES, {}, 1, "json");
    }
}