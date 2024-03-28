import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import BaseModule from "./Base.js";

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

    // /**
    //  * @param {number} ref
    //  * @param {number} qty
    //  * @param {number} level
    //  * @param {number} type
    //  * @returns {{type: 0, item: import("../record/item/SelfRecord"), qty: number}|{type: 1, styleId: number}|{type: 2, homeItem: {id: number}}|{type: 3, ach: import("../record/AchievementRecord")}|{type: 4, credits: number}|{type: 5, exp: number}|{type: 6, varium: number}}
    //  */
    // rewardInfo(ref: number, qty, level, type) {
    //     ref = JSON.parse(JSON.stringify(ref));
    //     if (Array.isArray(ref)) {
    //         type = ref[0].type;
    //         level = ref[0].level;
    //         qty = ref[0].qty;
    //         ref = ref[0].ref;
    //     } else if (typeof ref === "object") {
    //         type = ref.type;
    //         level = ref.level;
    //         qty = ref.qty;
    //         ref = ref.ref;
    //     };

    //     let result = { type: -1 };

    //     switch (type) {
    //         case 0:
    //             result.type = 0;
    //             result.item = this.client.boxes.item.getItemById(ref);
    //             qty = qty < 1 ? qty : qty;
    //             if (qty > 1) result.qty = qty;
    //             else result.qty = 1;
    //             break;
    //         case 1:
    //             result.type = 1;
    //             result.styleId = ref;
    //             break;
    //         case 2: // nobody cares about home items, or hair styles for that matter.
    //             result.type = 2;
    //             result.homeItem = {id: ref}//this.client.boxes.home.
    //             break;
    //         case 3:
    //             result.type = 3;
    //             result.ach = this.client.boxes.achievement.objMap.get(ref);
    //             break;
    //         case 4:
    //             result.type = 4;
    //             result.credits = ref;
    //             break;
    //         case 5:
    //             result.type = 5;
    //             result.exp = ref;
    //             break;
    //         case 6:
    //             result.type = 6;
    //             result.varium = ref;
    //             break;
    //     }

    //     return result;
    // }

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