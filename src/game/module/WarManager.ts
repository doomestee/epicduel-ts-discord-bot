// const Constants = require("../../constants/Constants");
// const Requests = require("../../constants/Requests");
// const { WaitForStream } = require("../../utilities");
// const BaseModule = require("./Base");

import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import Constants, { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import BaseModule from "./Base.js";

let removeLeadingAndEndingChar = (str='', removeChar=',') => {
    if(str.charAt(0) == removeChar) str = str.substr(1);

    let lastIndex = str.length - 1;
    
    if (str.charAt(lastIndex) == removeChar) str = str.substring(0, lastIndex);
         
    return str;
}

interface WarObjective {
    objectiveId: number, points: number, maxPoints: number, alignmentId: number
}

interface WarSide {
    player: [string, number][], faction: [string, number][], time: number
}

export interface RegionalWar {
    legion: WarSide,
    exile: WarSide
}

export default class WarManager extends BaseModule {
    static INFLUENCE_REQUIRED_FOR_PRIZE = 150;

    cooldownHours = 0;
    cooldownLastUpdated = -1;

    activeRegionId = 0;
    activeRegionId1 = -1;
    
    warRallyStatus = 0;
    myRegionalInfluence = 0;
    myDailyInfluence = 0;
    
    claimedPrize = false;
    
    exilePopulation = 0;
    legionPopulation = 0;
    
    warObjectiveDataList:WarObjective[] = [];
    
    //this.regionLeaderGfx = [];
    
    regionLeaderData = [];
    dailyLeaderData = [];

    _loadedAlignId = 0;
    _loadedRegionId = 0;

    cache = {
        /**
         * Mapped by region ID.
         * @type {}[]}
         */
        daily: [] as RegionalWar[],
        /**
         * Mapped by region ID.
         * @type {{legion: { player: [string, number][], faction: [string, number][], time: -1 }, exile: { player: [string, number][], faction: [string, number][], time: -1 }}[]}
         */
        overall: [] as RegionalWar[],
    }

    constructor(public client: Client) {
        super();
    }

    warObjectivePointsDataReceived(data: string[]) {
        let objData = data.slice(2); let a = [];
        for (let i = 0; i < objData.length; i += 2) {
            let objId = parseInt(objData[i + 0]);
            let points = parseInt(objData[i + 1]);
            let wod = this.getWarObjectiveData(objId);
            if (wod != null) {
                wod.points = points;
                if (wod.points !== wod.maxPoints) a.push([wod.alignmentId, wod.objectiveId, wod.points, wod.maxPoints]);
            }
        }
        // if (this.debugSpecific === true) {
        //     console.log([0, objData]);
        //     console.log([1, a]);
        // }
    }

    /**
     * @param {number} objId 
     */
    getWarObjectiveData(objId: number) {
        for (let wod of this.warObjectiveDataList) {
            if (wod.objectiveId == objId) {
                return wod;
            }
        }

        return null;
    }

    /**
     * @param {string[]} data 
     */
    warObjectiveAllDataReceived(data: string[]) {
        this.warObjectiveDataList = [];

        this.activeRegionId = parseInt(data[2]);
        this.cooldownHours = parseInt(data[3]);
        this.cooldownLastUpdated = Date.now();
        this.warRallyStatus = parseInt(data[4]);

        if (this.activeRegionId1 === -1) {
            this.activeRegionId1 = parseInt(data[2]);
        }

        if (this.warRallyStatus != 0 && (this.cooldownHours) < 0) {
            this.client.smartFox.emit("war_status", { type: "rally", align: this.warRallyStatus, status: "ongoing" });
            // this.client.manager.logEmit("epicduel_war", {type: "rally", align: this.warRallyStatus, status: "ongoing"});
        }

        this.exilePopulation = Number(data[5]);
        this.legionPopulation = Number(data[6]);

        let objData = data.slice(7);

        // if (this.debugSpecific) {
        //     console.log([2, objData]);
        // }

        for (let i = 0; i < objData.length; i += 4) {
            let objId = parseInt(objData[i + 0]);
            let points = parseInt(objData[i + 1]);
            let maxPoints = parseInt(objData[i + 2]);
            let alignmentId = parseInt(objData[i + 3]);

            this.warObjectiveDataList.push({
                objectiveId: objId,
                points: points,
                maxPoints: maxPoints,
                alignmentId: alignmentId
            })
        }
    }

    get activeRegion() {
        return this.client.boxes.war.getRegionById(this.activeRegionId);
    }

    /**
     * @param {string[]} data 
     */
    warCooldownDataReceived(data: string[]) {
        this.cooldownHours = parseInt(data[2]);
        this.cooldownLastUpdated = Date.now();
    }

    myWarDataReceived(data: string[]) {
        this.myDailyInfluence = parseInt(data[2]);
        this.myRegionalInfluence = parseInt(data[3]);
        this.claimedPrize = data[4] === "1";
    }

    /**
     * Hell no, although we could use this to send notification of every single sucker that drops a bomb.
     * @param {string[]} data 
     */
    animateObjectiveServerResponse(data: string[]) {
        // if (this.sussy === true) {
        //     console.log(data);
        // }
        const charName = data[2];
        const influence = parseInt(data[3]);
        const usedItemId = parseInt(data[4]);

        let wr = this.activeRegion;//this.client.boxes.war.getRegionById(this.activeRegionId);

        this.client.smartFox.emit("war_status", { type: "char_used", name: charName, influence, usedItemId });
        // this.client.manager.logEmit("epicduel_war", {type: "char_used", name: charName, influence, usedItemId});

        if (wr == null) { return; }

        let updateObj = null;

        if (usedItemId == wr.offenseItemId || usedItemId == wr.offenseSuperItemId) {
            updateObj = this.client.boxes.war.getMainObjectiveByRegionId(wr.regionId);
        } else if (usedItemId == wr.defenseItemId || usedItemId == wr.defenseSuperItemId) {
            //updateObj = this.client.boxes.war.getObjectiveById(this.client.modules);
        }


        if (updateObj != null) {
            let wod = this.getWarObjectiveData(updateObj.objectiveId);

            if (wod != null) {
                wod.points += influence;
            }
        }
    }

    /**
     * custom
     * @param {-1|1|2} alignId If -1, it will return all of the current objectives. 1 for Exile, 2 for Legion.
     */
    currentObjectives(alignId: -1 | 1 | 2) {
        let list = this.client.boxes.war.getRegionalObjectives(this.activeRegionId);
        let objs = this.warObjectiveDataList.filter(v => list.some(l => l.objectiveId == v.objectiveId));

        // Lazy patch for now, it's unusual but I can't find a way to fix this.
        //objs = objs.map((v) => {
        //    v["alignmentId"] = v["alignmentId"] == 1 ? 2 : 1;
        //    return v;
        //});

        if (alignId === -1) return objs;
        else return objs.filter(v => v.alignmentId == alignId);
    }

    getMyWarItemCount() {
        let wr = this.client.boxes.war.getRegionById(this.activeRegionId);
        
        let clientOnDefense = this.client.getMyUserFr().charWarAlign == this.getControlAlignmentInActiveRegion()

        let basicItemId = clientOnDefense ? wr.defenseItemId : wr.offenseItemId;
        let superItemId = clientOnDefense ? wr.defenseSuperItemId : wr.offenseSuperItemId;

        return this.client.modules.Inventory.getInventoryItemCount(basicItemId) + this.client.modules.Inventory.getInventoryItemCount(superItemId);
    }

    getControlAlignmentInActiveRegion() {
        let regionMainObj = this.client.boxes.war.getMainObjectiveByRegionId(this.activeRegionId);
        if (regionMainObj != null) {
            let regionWod = this.getWarObjectiveData(regionMainObj.objectiveId);
            if (regionWod != null) return regionWod.alignmentId;
        } return 0;
    }

    // WarLeaders

    /**
     * @param {string[]} data
     * @param {"daily"|"overall"} type
     */
    handleLeaderData(data: string[], type: "daily" | "overall") {
        let leaderData = String(data.slice(2)).split("$");

        leaderData[0] = removeLeadingAndEndingChar(leaderData[0], ',');
        leaderData[1] = removeLeadingAndEndingChar(leaderData[1], ',');

        let playerData = leaderData[0].split(",");
        let factionData = leaderData[1].split(",");

        let processed = { player: [], faction: [], time: Date.now() } as WarSide;

        for (let x = 0; x < playerData.length; x += 2) {
            processed.player.push([playerData[x], parseInt(playerData[x + 1])]);
        }

        for (let x = 0; x < factionData.length; x += 2) {
            processed.faction.push([factionData[x], parseInt(factionData[x + 1])]);
        }

        //let id = (this._loadedAlignId == Constants.EXILE_ID) ? "exile" : "legion";

        /*if (this._loadedAlignId == Constants.EXILE_ID) {
            this.cache[type][id] = {
                player: processed.player, faction: processed.faction, time: Date.now()
            }
        //}*/

        this.client.smartFox.emit("leader_war", processed, type);
        // this.client.smartFox.emit('get_warleaders_' + type, { player: processed.player, faction: processed.faction, time: Date.now()});
    }

    /**
     * @param {1|2} alignId 
     * @param {1|2} mode 1 is Daily, 2 is Overall. If undefined, function will determine based on the current war.
     * @param {number} regionId 
     * @param {boolean} forceSkipCache 
     * @returns {Promise<undefined|{player: [string, number][], faction: [string, number][], time: number, mode: 1|2, regionId: number}>}
     */
    async fetchLeaders(alignId: 1 | 2, mode: 1 | 2, regionId: number, forceSkipCache=false) : Promise<WaitForResult<WarSide & { mode: 1 | 2, regionId: number }>> {
        this._loadedAlignId = alignId;
        this._loadedRegionId = regionId;

        if (alignId === undefined) alignId = 1;
        if (regionId === undefined) regionId = this.activeRegionId;

        let obj = {
            regionId, alignId
        };

        // Daily is 1, Overall is 2
        mode = mode || 1;

        // If the mode is set to Daily, but the war is over, will set to Overall.
        if (this.activeRegionId != regionId || this.cooldownHours > 0) {
            mode = 2;
        }

        if (mode === 1) {
            let cache = this.cache.daily[regionId]?.[alignId == Constants.EXILE_ID ? "exile" : "legion"];
            let now = Date.now();

            if (cache === undefined || (now - cache.time) > 60000 || forceSkipCache) {
                let details = waitFor(this.client.smartFox, "leader_war", [1, "daily"], 5000)//;.catch((err) => { this.client.manager._logger.error(err); return null;});

                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_DAILY_INFLUENCE_LEADERS, obj, 1, "json");

                const result = await details;

                if (!result.success) {
                    console.log("Undefined war stuff - daily!!");
                    return result;
                }

                if (this.cache["daily"][regionId] === undefined) {
                    //@ts-expect-error                    
                    this.cache["daily"][regionId] = {
                        [alignId === 1 ? "exile" : "legion"]: {
                            ...result.value
                        }
                    };
                } else this.cache["daily"][regionId][alignId === 1 ? "exile" : "legion"] = { ...result.value };

                return { success: true, value: { ...result.value, mode, regionId } } //{...res[0], mode, regionId};
            } else return { success: true, value: { ...cache, mode, regionId } };
        } else if (mode === 2) {
            let cache = this.cache.overall[regionId]?.[(alignId == Constants.EXILE_ID ? "exile" : "legion")];
            let now = Date.now();

            if (cache === undefined || (now - cache.time) > 60000 || forceSkipCache) {

                let details = waitFor(this.client.smartFox, "leader_war", [1, "overall"], 5000);//.catch((err) => { this.client.manager._logger.error(err); return null;});
                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_REGIONAL_INFLUENCE_LEADERS, obj, 1, "json");

                const result = await details;

                if (!result.success) {
                    console.log("Undefined war stuff - overall!!");
                    return result;
                }

                if (this.cache["overall"][regionId] === undefined) {
                    //@ts-expect-error
                    this.cache["overall"][regionId] = {
                        [alignId === 1 ? "exile" : "legion"]: {
                            ...result.value
                        }
                    };
                } else this.cache["overall"][regionId][alignId === 1 ? "exile" : "legion"] = { ...result.value };

                return { success: true, value: { ...result.value, mode, regionId } } //{...res[0], mode, regionId};
            } else return { success: true, value: { ...cache, mode, regionId } };
        }

        throw Error("unknown mode");
    }
}