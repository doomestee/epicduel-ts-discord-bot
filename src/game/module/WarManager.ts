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

export interface WarObjective {
    objectiveId: number, points: number, maxPoints: number, alignmentId: number
}

interface WarSide {
    player: [string, number][], faction: [string, number][], time: number
}

interface WarSideGFX {
    player: PlayerGFXData,
    faction: FactionGFXData
}

interface PlayerGFXData {
    charName: string;
    charRegionInfluence: number;
    charLvl: number;
    charGender: string;
    charClassId: number;
    charPri: string;
    charSec: string;
    charHair: string;
    charSkin: string;
    charAccnt: string;
    charAccnt2: string;
    charEye: string;
    charArm: number;
    charHairS: number;
}

interface FactionGFXData {
    fctName: string;
    fctRegionInfluence: number;
    fctAlign: number;
    fctSymb: number;
    fctSymbClr: string;
    fctBack: number;
    fctBackClr: string;
    fctFlagClr: string;
}

export interface RegionalWar<T extends WarSide | WarSideGFX = WarSide> {
    legion: T,
    exile: T
}

export type RegionalWarGFX = RegionalWar<WarSideGFX> & { time: number };

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

    gfxRegionId = 0;

    static cache = {
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

        gfx: [] as RegionalWarGFX[]
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
    currentObjectives(alignId: -1 | 1 | 2 = -1) {
        let list = this.client.boxes.war.getObjectivesByRegionId(this.activeRegionId);
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

        if (!wr) throw Error("No active region id.");
        
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
     * Well well isn't this fucking ironic, taken from EnvironmentObjects.
     */
    handleWarLeaderGfx(data: string[]) {
        const time = Date.now();
        // Sample data:
        // ^xt^r112^-1^I Am Mr. Nice Guy^132680^40^M^5^000000^CC99FF^9999FF^C18624^CC99FF^000000^CCCCFF^4412^1^$^Lost World^370771^1^119^000000^43^000000^ffffff^$^Ahri^70486^40^F^1^000000^330000^CDBDAD^FFECDA^000000^FFFFFF^990000^6301^289^$^Souls Requiem^225439^2^12^ffffff^26^990000^000000^

        // Although I'm following the code, the more I look at this code, the more I realise it's gonna error 99%...
        let allData = String(data.slice(2));
        let dataSets = allData.split("$");

        let [exilePlayer, exileFaction, legionPlayer, legionFaction] = 
        [dataSets[0], dataSets[1], dataSets[2], dataSets[3]].map(v => removeLeadingAndEndingChar(v, ',')).map(v => {
            return (v == "undefined") ? [] : v.split(',');
        });

        const exile = {
            player: {} as PlayerGFXData,
            faction: {} as FactionGFXData
        };

        const legion = {
            player: {} as PlayerGFXData,
            faction: {} as FactionGFXData
        };

        if(exilePlayer.length > 1) {
            exile.player = {
                charName: exilePlayer[0],
                charRegionInfluence: parseInt(exilePlayer[1]),
                charLvl: parseInt(exilePlayer[2]),
                charGender: exilePlayer[3],
                charClassId: parseInt(exilePlayer[4]),
                charPri: exilePlayer[5],
                charSec: exilePlayer[6],
                charHair: exilePlayer[7],
                charSkin: exilePlayer[8],
                charAccnt: exilePlayer[9],
                charAccnt2: exilePlayer[10],
                charEye: exilePlayer[11],
                charArm: parseInt(exilePlayer[12]),
                charHairS: parseInt(exilePlayer[13]),
            }
        }

        if(exileFaction.length > 1) {
            exile.faction = {
                fctName: exileFaction[0],
                fctRegionInfluence: parseInt(exileFaction[1]),
                fctAlign: parseInt(exileFaction[2]),
                fctSymb: parseInt(exileFaction[3]),
                fctSymbClr: exileFaction[4],
                fctBack: parseInt(exileFaction[5]),
                fctBackClr: exileFaction[6],
                fctFlagClr: exileFaction[7],
            }
        }

        if(legionPlayer.length > 1) {
            legion.player = {
                charName: legionPlayer[0],
                charRegionInfluence: parseInt(legionPlayer[1]),
                charLvl: parseInt(legionPlayer[2]),
                charGender: legionPlayer[3],
                charClassId: parseInt(legionPlayer[4]),
                charPri: legionPlayer[5],
                charSec: legionPlayer[6],
                charHair: legionPlayer[7],
                charSkin: legionPlayer[8],
                charAccnt: legionPlayer[9],
                charAccnt2: legionPlayer[10],
                charEye: legionPlayer[11],
                charArm: parseInt(legionPlayer[12]),
                charHairS: parseInt(legionPlayer[13]),
            }
        }

        if(legionFaction.length > 1) {
            legion.faction = {
                fctName: legionFaction[0],
                fctRegionInfluence: parseInt(legionFaction[1]),
                fctAlign: parseInt(legionFaction[2]),
                fctSymb: parseInt(legionFaction[3]),
                fctSymbClr: legionFaction[4],
                fctBack: parseInt(legionFaction[5]),
                fctBackClr: legionFaction[6],
                fctFlagClr: legionFaction[7],
            }
        }

        this.client.smartFox.emit("leader_war_gfx", WarManager.cache.gfx[this.gfxRegionId] = { exile, legion, time });

        //let record = RoomManager.getRoomRecord(this.client.user._currentRoomFileName)

        //var record = RoomManager.getRoomRecord(CurrentUser.instance._currentRoomFileName);
        /*if(record != null) {
            this._cacheRegion = record.regionId;
            this._cacheTimestamp = getTimer();
            this._exileCache = exile;
            this._legionCache = legion;
            this.drawWarLeaders(exile,legion);
        }*/
    }

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

    async fetchGFXLeaders(regionId?: number) : Promise<WaitForResult<RegionalWarGFX>> {
        if (regionId === undefined) regionId = this.activeRegionId;

        const cache = WarManager.cache.gfx[regionId];
        const time = Date.now();

        // gfx cache for 1 hour
        if (cache && (cache.time + 60000 * 60) > time) {
            return { success: true, value: cache };
        }

        this.gfxRegionId = regionId;
        const wait = waitFor(this.client.smartFox, "leader_war_gfx", undefined, 3000);
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_REGIONAL_LEADER_GFX, { regionId }, 1, "json");

        return wait;
    }

    /**
     * @param {1|2} alignId 
     * @param {1|2} mode 1 is Daily, 2 is Overall. If undefined, function will determine based on the current war.
     * @param {number} regionId 
     * @param {boolean} forceSkipCache 
     * @returns {Promise<undefined|{player: [string, number][], faction: [string, number][], time: number, mode: 1|2, regionId: number}>}
     */
    async fetchLeaders(alignId: 1 | 2 | undefined, mode: 1 | 2, regionId?: number, forceSkipCache=false) : Promise<WaitForResult<WarSide & { mode: 1 | 2, regionId: number }>> {

        if (alignId === undefined) alignId = 1;
        if (regionId === undefined) regionId = this.activeRegionId;

        this._loadedAlignId = alignId;
        this._loadedRegionId = regionId;

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
            let cache = WarManager.cache.daily[regionId]?.[alignId == Constants.EXILE_ID ? "exile" : "legion"];
            let now = Date.now();

            if (cache === undefined || (now - cache.time) > 60000 || forceSkipCache) {
                let details = waitFor(this.client.smartFox, "leader_war", [1, "daily"], 5000)//;.catch((err) => { this.client.manager._logger.error(err); return null;});

                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_DAILY_INFLUENCE_LEADERS, obj, 1, "json");

                const result = await details;

                if (!result.success) {
                    console.log("Undefined war stuff - daily!!");
                    return result;
                }

                if (WarManager.cache["daily"][regionId] === undefined) {
                    //@ts-expect-error                    
                    WarManager.cache["daily"][regionId] = {
                        [alignId === 1 ? "exile" : "legion"]: {
                            ...result.value
                        }
                    };
                } else WarManager.cache["daily"][regionId][alignId === 1 ? "exile" : "legion"] = { ...result.value };

                return { success: true, value: { ...result.value, mode, regionId } } //{...res[0], mode, regionId};
            } else return { success: true, value: { ...cache, mode, regionId } };
        } else if (mode === 2) {
            let cache = WarManager.cache.overall[regionId]?.[(alignId == Constants.EXILE_ID ? "exile" : "legion")];
            let now = Date.now();

            if (cache === undefined || (now - cache.time) > 60000 || forceSkipCache) {

                let details = waitFor(this.client.smartFox, "leader_war", [1, "overall"], 5000);//.catch((err) => { this.client.manager._logger.error(err); return null;});
                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_REGIONAL_INFLUENCE_LEADERS, obj, 1, "json");

                const result = await details;

                if (!result.success) {
                    console.log("Undefined war stuff - overall!!");
                    return result;
                }

                if (WarManager.cache["overall"][regionId] === undefined) {
                    //@ts-expect-error
                    WarManager.cache["overall"][regionId] = {
                        [alignId === 1 ? "exile" : "legion"]: {
                            ...result.value
                        }
                    };
                } else WarManager.cache["overall"][regionId][alignId === 1 ? "exile" : "legion"] = { ...result.value };

                return { success: true, value: { ...result.value, mode, regionId } } //{...res[0], mode, regionId};
            } else return { success: true, value: { ...cache, mode, regionId } };
        }

        throw Error("unknown mode");
    }

    warPoints() {
        let currObjs = this.currentObjectives();

        let points = {
            current: [
                currObjs.reduce((a, b) => a + ((b.alignmentId == 1) ? (b.points) : 0), 0),
                currObjs.reduce((a, b) => a + ((b.alignmentId == 2) ? (b.points) : 0), 0)
            ], max: [
                currObjs.reduce((a, b) => a + ((b.alignmentId == 1) ? (b.maxPoints) : 0), 0),
                currObjs.reduce((a, b) => a + ((b.alignmentId == 2) ? (b.maxPoints) : 0), 0)
            ],
            remaining: [0, 0],
            currentPercent: ["0%", "0%"],
            gap: 0,
            gapPt: "0%"
        }

        // Math.abs(points.remaining[0] - points.remaining[1])

        points.remaining[0] = points.max[0] - points.current[0];
        points.remaining[1] = points.max[1] - points.current[1];

        points.currentPercent[0] = Math.round((points.current[0] / points.max[0]) * 10000) / 100 as unknown as string;// + "%";
        points.currentPercent[1] = Math.round((points.current[1] / points.max[1]) * 10000) / 100 as unknown as string;// + "%";

        points.gap = Math.abs(points.remaining[0] - points.remaining[1]);
        //@ts-expect-error
        points.gapPt = Math.round(Math.abs(points.currentPercent[0] - points.currentPercent[1]) * 10000) / 100 + "%";

        points.currentPercent[0] = points.currentPercent[0] + "%";
        points.currentPercent[1] = points.currentPercent[1] + "%";

        return points;
    }
}