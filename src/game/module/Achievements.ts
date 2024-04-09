import CacheManager from "../../manager/cache.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import AchievementSBox from "../box/AchievementBox.js";
import AchievementRecord from "../record/AchievementRecord.js";
import BaseModule from "./Base.js";

export interface Cheevo {
    id: number;
    count: number;
}

export type CheevoPopulated = (AchievementRecord & { count: number });// | { achId: number, count: number, noAch: true };

export default class Achievements extends BaseModule {
    constructor(public client: Client) {
        super();
    }

    achievementDataReceived(data: string[]) {
        const [charId, init] = [data[2], data[3]].map(Number);
        const achievData = (data[4] != undefined) ? data.slice(4) : [];

        const result = [] as Cheevo[];

        for (let i = 0, len = achievData.length; i < len; i += 2) {
            result.push({ id: parseInt(achievData[i]), count: parseInt(achievData[i + 1]) });
        }

        CacheManager.update("achievement", charId, result);
        this.client.smartFox.emit("achieve_data", result, charId);

        if (init) return; // ???
    }

    sendRequest(charId: number) {
        if (!charId) throw Error("CharID not provided!");// || typeof charId != "number") throw Error("CharID provided not a number!");

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_PLAYER_ACHIEVEMENTS, {charId}, 1, "json");
    }

    populateCheevos(cheevos: Cheevo[]) : CheevoPopulated[] {
        let result:CheevoPopulated[] = [];

        for (let i = 0; i < cheevos.length; i++) {
            let ach = this.client.boxes.achievement.objMap.get(cheevos[i].id);

            if (ach) result.push({ ...ach, count: cheevos[i].count });

            // if (!ach) result.push({achId: cheevos[i].id, count: cheevos[i].count, noAch: true});
            // else result.push({...ach, count: cheevos[i].count, noAch: false });
        }

        return result;
    }

    static populateCheevos(cheevos: Cheevo[]) : CheevoPopulated[] {
        let result:CheevoPopulated[] = [];

        for (let i = 0; i < cheevos.length; i++) {
            let ach = AchievementSBox.objMap.get(cheevos[i].id);

            if (ach) result.push({ ...ach, count: cheevos[i].count });

            // if (!ach) result.push({achId: cheevos[i].id, count: cheevos[i].count, noAch: true});
            // else result.push({...ach, count: cheevos[i].count, noAch: false });
        }

        return result;
    }

    async getAchievements(charId: number) : Promise<WaitForResult<CheevoPopulated[]>> {
        const cache = CacheManager.check("achievement", charId);

        if (cache.valid) return { success: true, value: this.populateCheevos(cache.value) }

        const wait = waitFor(this.client.smartFox, "achieve_data", [1, charId], 3000);
        this.sendRequest(charId);

        return wait.then(v => {
            if (v.success) {
                return { success: true, value: this.populateCheevos(v.value) }
            } else return v;
        })
    }

    // /**
    //  * Custom, with end result slightly modified to feature achievement details
    //  * @param {number} charId 
    //  */
    // async getCharCheevo(charId) {
    //     let cache = this.modules.Achievements.cache[charId];

    //     /**
    //      * @param {{id: number, count: number}} cheev
    //      * @returns 
    //      */
    //     let populate = (cheev) => {
    //         let ach = this.boxes.achievement.objMap.get(cheev.id);

    //         if (!ach) return {achId: cheev.id, count: cheev.count, noAch: true};

    //         return {...ach, count: cheev.count};
    //     }

    //     if (Array.isArray(charId)) {
    //         return charId.map(v => { return populate(v) });
    //     }
        
    //     if (cache != null) {
    //         if (cache[0] + (1000 * 60 * 30) > Date.now()) {
    //             return cache[1].map(v => {return populate(v); });
    //         }
    //     }

    //     /**
    //      * @type {[[[[0, {id: number, count: 0}[]]]]]}
    //      */
    //     let achieves = (WaitForStream(this.smartFox, "achievData", [0, charId], [{id: 0, count: 0}], 3000));
    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_PLAYER_ACHIEVEMENTS, { charId }, 1, "json");

    //     achieves = await achieves;

    //     if (achieves === null) return { error: "null result"};

    //     return achieves[1][1].map(v => { return populate(v)});
    // }
}