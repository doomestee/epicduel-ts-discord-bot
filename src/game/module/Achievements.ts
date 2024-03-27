import CacheManager from "../../manager/cache.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export interface Cheevo {
    id: number;
    count: number;
}

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

    getPlayerAchievements(charId: number) {
        if (!charId) throw Error("CharID not provided!");// || typeof charId != "number") throw Error("CharID provided not a number!");

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_PLAYER_ACHIEVEMENTS, {charId}, 1, "json");
    }
}