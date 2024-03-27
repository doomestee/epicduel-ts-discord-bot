import CacheManager from "../../manager/cache.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export interface Gift {
    name: string, count: { room: number, total: number, combo: number }, sfsId: number, onFireTier: number, isGlobal: boolean, time: number
};

export default class Advent extends BaseModule {
    static STATUS_BEFORE = -2;
    static STATUS_OVER = -1;
    static STATUS_UNCLAIMED = 0;
    static STATUS_CLAIMED = 1;

    status = 0;

    waitUntil = 0;
    claimCount = 0;

    constructor(public client: Client) {
        super();
    }

    claimPresent() {
        let wait = waitFor(this.client.smartFox, "advent_gift", undefined);
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_CLAIM_ADVENT_PRESENT, {}, 1, "json");

        return wait;
    }

    receiveGiveGiftResponse(data: string[]) {
        let giftData = data.slice(2);

        if (parseInt(giftData[0]) == Advent.STATUS_BEFORE) {
            this.status = parseInt(giftData[0]);
            return console.log("Sorry, this event just ended, thank you for participating!");
        }

        let gifterName = giftData[1];
        let [roomGiftCount, totalGiftCount, senderSfsUserId, onFireTier, comboCount, globalGift] = [2, 3, 4, 5, 6, 7].map(v => parseInt(giftData[v]));

        //let myUser = this.client.getMyUser();
        //if (myUser != null) {

        let obj = {
            name: gifterName,
            count: {
                room: roomGiftCount, total: totalGiftCount, combo: comboCount
            }, sfsId: senderSfsUserId,
            onFireTier,
            isGlobal: globalGift === 1,
            time: Date.now()
        };

        // this.client.gifts.push(obj);

        // if (this.client.manager?.tracker.gift.active) this.client.manager.tracker.gift.list.push(obj);

        // if (this.client.giftLog) {
        //     if (this.client.giftLogConsole) console.log([gifterName, roomGiftCount, totalGiftCount, senderSfsUserId, onFireTier, comboCount, globalGift]);
            
        //     this.client.manager.discord.rest.channels.createMessage("1181290895597908108", {
        //         content: (globalGift === 0 ? `**${gifterName}** sent a present at Central Station, VendBot.` : `**${gifterName}** sent a global present.`) + `\nThis person has given away ${totalGiftCount} in total, to ${globalGift === 0 ? "a room" : "the server"} with ${roomGiftCount} characters.`
        //     });
        // }//.then((v) => v.crosspost());
        //}
    }

    receiveGetGiftLeadersResponse(data: string[]) {
        let splitIndex = data.indexOf("#");
        let leaderAllTime = data.slice(2, splitIndex);
        let leaderAllDaily = data.slice(splitIndex + 1);

        const daily = [] as { name: string, point: number }[];
        const season = [] as { name: string, point: number }[];

        for (let i = 0; i < leaderAllTime.length; i++) {
            season.push({
                name: leaderAllTime[i++],
                point: parseInt(leaderAllTime[i]),
            });
        }

        for (let i = 0; i < leaderAllDaily.length; i++) {
            daily.push({
                name: leaderAllDaily[i++],
                point: parseInt(leaderAllDaily[i]),
            });
        }

        // this.lastFetched = Date.now();

        CacheManager.update("gifts", { complete: data, daily, season });

        this.client.smartFox.emit("leader_gift", { complete: data, daily, season });
    }

    receiveClaimPresentResponse(data: unknown) {
        console.log(data);
    }

    async getGiftLeaders() : Promise<WaitForResult<CacheTypings.GiftingLeader>> {
        const cache = CacheManager.check("gifts");

        if (cache.valid) return { success: true, value: cache.value };

        const wait = waitFor(this.client.smartFox, "leader_gift", undefined, 4000);
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_GIFT_LEADERS, {}, 1, "json");

        return wait/*.then(v => {
            if (v.success) {
                return { success: true, value: v.value };
            } else return v;
        })*/;

    }
}