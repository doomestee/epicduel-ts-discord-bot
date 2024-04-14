import { parse } from "path";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import SmartFoxClient from "../sfs/SFSClient.js";
import BaseModule from "./Base.js";
import CacheManager from "../../manager/cache.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";

// function quickResult(result: Array<any>, func: ())

// export type LeaderTypeToType<T> = T extends 

export type LeaderTypeToList = {
    1: CacheTypings.PlayerLeaderPvp;
    2: CacheTypings.PlayerLeaderPvp;
    16: CacheTypings.PlayerLeaderPvp;
    3: CacheTypings.PlayerLeaderPvp;
    4: CacheTypings.PlayerLeaderPvp;
    17: CacheTypings.PlayerLeaderPvp;

    5: CacheTypings.FactionLeaderPvp;
    6: CacheTypings.FactionLeaderPvp;
    18: CacheTypings.FactionLeaderPvp;

    7: CacheTypings.FactionLeaderDom;

    8: CacheTypings.FactionLeaderLead;
    9: CacheTypings.FactionLeaderLead;
    19: CacheTypings.FactionLeaderLead;

    10: CacheTypings.FactionLeaderCap;

    12: CacheTypings.FactionLeaderInf;

    11: CacheTypings.PlayerLeaderInf;

    13: CacheTypings.PlayerLeaderRarity;

    14: CacheTypings.PlayerLeaderFame;
    15: CacheTypings.PlayerLeaderFame;

    20: CacheTypings.PlayerLeaderRedeems;
    21: CacheTypings.PlayerLeaderRedeems;

    22: CacheTypings.PlayerLeaderRating;
}

export type LeaderType = keyof LeaderTypeToList;

export type FactionLeaderType = 7 | 10 | 8 | 9 | 19 | 12 | 5 | 6 | 18;

export default class Leader extends BaseModule {
    static Indexes = {
        Overall: {
            Solo: 1,
            Team: 2,
            Jugg: 16,
            Influence: 11,
            Fame: 14,
            Rarity: 13,
            Faction_Solo: 8,
            Faction_Team: 9,
            Faction_Jugg: 19,
            Faction_Dom: 7,
            Faction_Flags: 10,
            Faction_Influence: 12,
            Redeem: 21,
            Rating: 22,

            All: [1, 2, 16, 11, 14, 13, 8, 9, 19, 12, 21, 22],
            Faction: [7, 10, 8, 9, 19, 12],
            Char: [1, 2, 16, 11, 14, 13, 21, 22],
        },
        Daily: {
            Solo: 3,
            Team: 4,
            Jugg: 17,
            Faction_Solo: 5,
            Faction_Team: 6,
            Faction_Jugg: 18,
            Fame: 15,
            Redeem: 20,

            All: [3, 4, 17, 5, 6, 18, 15, 20],
            Faction: [5, 6, 18],
            Char: [3, 4, 17, 15, 20],
        },
        All: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        Faction: [7, 10, 8, 9, 19, 12, 5, 6, 18],
        Char: [1, 2, 16, 11, 14, 13, 21, 22, 3, 4, 17, 15, 20]
    };

    constructor(public client: Client) {
        super();
    }

    sendRequest(type: LeaderType) {
        if (!type || typeof type !== "number") throw Error("No type of number was given.");

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_LEADERS, { v: type }, 1, SmartFoxClient.XTMSG_TYPE_JSON);
    }
      
    leaderDataAvailable<T extends LeaderType = LeaderType>(leaderData:string[]) {
        const version = parseInt(leaderData[2]) as T;
        const splitIndex = leaderData.indexOf("$");

        const result:LeaderTypeToList[T][] = [];
        const brags = leaderData.slice(3, splitIndex);
        const smalls = leaderData.slice(splitIndex + 1);
        let name = '';

        switch(version) {
            case 1: case 2: case 16:
                // ["charName","charWins1","charBat1","charExp","charLvl","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"]
                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderPvp[]).push({
                        name: brags[i],
                        wins: parseInt(brags[++i]),
                        bat: parseInt(brags[++i]),
                        exp: parseInt(brags[++i]),
                        misc: {
                            lvl: parseInt(brags[++i]),
                            gender: (brags[++i]),
                            classId: parseInt(brags[++i]),
                            pri: (brags[++i]),
                            sec: (brags[++i]),
                            hair: (brags[++i]),
                            skin: (brags[++i]),
                            accnt: (brags[++i]),
                            accnt2: (brags[++i]),
                            eye: (brags[++i]),
                            arm: parseInt(brags[++i]),
                            hairS: parseInt(brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderPvp[]).push({
                        name: smalls[i],
                        wins: parseInt(smalls[++i]),
                        bat: parseInt(smalls[++i]),
                        exp: parseInt(smalls[++i]),
                        // misc: {}
                    });
                }
                break;
            case 3: case 4: case 17:
                // ["dailyWins1","dailyBat1","charName","charExp","charLvl","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"]
                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderPvp[]).push({
                        wins: parseInt(brags[i]),
                        bat: parseInt(brags[++i]),
                        name: brags[++i],
                        exp: parseInt(brags[++i]),
                        misc: {
                            lvl: parseInt(brags[++i]),
                            gender: (brags[++i]),
                            classId: parseInt(brags[++i]),
                            pri: (brags[++i]),
                            sec: (brags[++i]),
                            hair: (brags[++i]),
                            skin: (brags[++i]),
                            accnt: (brags[++i]),
                            accnt2: (brags[++i]),
                            eye: (brags[++i]),
                            arm: parseInt(brags[++i]),
                            hairS: parseInt(brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderPvp[]).push({
                        wins: parseInt(smalls[i]),
                        bat: parseInt(smalls[++i]),
                        name: smalls[++i],
                        exp: parseInt(smalls[++i]),
                        // misc: {}
                    });
                }

                break;
            case 5: case 6: case 18:
                // ["dailyWins1","dailyBat1","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
                // ["dailyWins1","dailyBat1","fctName"]

                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderPvp[]).push({
                        wins: parseInt(brags[i]),
                        bat: parseInt(brags[++i]),
                        name: brags[++i],
                        misc: {
                            align: (brags[++i] === "1") ? "Exile" : "Legion",
                            symb: parseInt(brags[++i]),
                            symbClr: (brags[++i]),
                            back: parseInt(brags[++i]),
                            backClr: (brags[++i]),
                            flagClr: (brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderPvp[]).push({
                        wins: parseInt(smalls[i]),
                        bat: parseInt(smalls[++i]),
                        name: smalls[++i],
                        // misc: {}
                    });
                }

                break;
            case 7:
                // ["fctDom","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
                // ["fctDom","fctName"]

                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderDom[]).push({
                        dom: parseInt(brags[i]),
                        name: brags[++i],
                        misc: {
                            align: (brags[++i] === "1") ? "Exile" : "Legion",
                            symb: parseInt(brags[++i]),
                            symbClr: (brags[++i]),
                            back: parseInt(brags[++i]),
                            backClr: (brags[++i]),
                            flagClr: (brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderDom[]).push({
                        dom: parseInt(smalls[i]),
                        name: smalls[++i],
                        // misc: {}
                    });
                }
                break;
            case 8: case 9: case 19:
                // ["fctLead1","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
                // ["fctLead1","fctName"]

                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderLead[]).push({
                        lead: parseInt(brags[i]),
                        name: brags[++i],
                        misc: {
                            align: (brags[++i] === "1") ? "Exile" : "Legion",
                            symb: parseInt(brags[++i]),
                            symbClr: (brags[++i]),
                            back: parseInt(brags[++i]),
                            backClr: (brags[++i]),
                            flagClr: (brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.FactionLeaderLead[]).push({
                        lead: parseInt(smalls[i]),
                        name: smalls[++i],
                        // misc: {}
                    });
                }
                break;
            case 10: case 12:
                // ["fctFlagCap","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
                // ["fctFlagCap","fctName"]
                name = (version === 10) ? "cap" : "influence";

                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as (CacheTypings.FactionLeaderCap | CacheTypings.FactionLeaderInf)[]).push({
                        [name as "cap"]: parseInt(brags[i]),
                        "name": brags[++i],
                        misc: {
                            align: (brags[++i] === "1") ? "Exile" : "Legion",
                            symb: parseInt(brags[++i]),
                            symbClr: (brags[++i]),
                            back: parseInt(brags[++i]),
                            backClr: (brags[++i]),
                            flagClr: (brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as (CacheTypings.FactionLeaderCap | CacheTypings.FactionLeaderInf)[]).push({
                        [name as "influence"]: parseInt(smalls[i]),
                        "name": smalls[++i],
                        // misc: {}
                    });
                }

                break;
            case 11: case 13: case 14: case 15: case 20: case 21: case 22:
                // "charName","charTotalInfluence","charLvl","charExp","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"
                // "charName","charTotalInfluence"

                name = (version === 11) ? "influence" : (version === 13) ? "rarity" : (version === 14 || version === 15) ? "fame" : (version === 20 || version === 21) ? "redeems" : (version === 22) ? "rating" : "";

                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as (CacheTypings.PlayerLeaderInf | CacheTypings.PlayerLeaderRarity | CacheTypings.PlayerLeaderFame | CacheTypings.PlayerLeaderRedeems | CacheTypings.PlayerLeaderRating)[]).push({
                        "name": brags[i],
                        [name as "rarity"]: parseInt(brags[++i]),
                        misc: {
                            lvl: parseInt(brags[++i]),
                            exp: parseInt(brags[++i]),
                            gender: (brags[++i]),
                            classId: parseInt(brags[++i]),
                            pri: (brags[++i]),
                            sec: (brags[++i]),
                            hair: (brags[++i]),
                            skin: (brags[++i]),
                            accnt: (brags[++i]),
                            accnt2: (brags[++i]),
                            eye: (brags[++i]),
                            arm: parseInt(brags[++i]),
                            hairS: parseInt(brags[++i])
                        }
                    });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as (CacheTypings.PlayerLeaderInf | CacheTypings.PlayerLeaderRarity | CacheTypings.PlayerLeaderFame | CacheTypings.PlayerLeaderRedeems | CacheTypings.PlayerLeaderRating)[]).push({
                        "name": smalls[i],
                        [name as "fame"]: parseInt(smalls[++i]),
                        // misc: {}
                    });
                }

                break;
        }

        CacheManager.update("leaders", version, result);
        this.client.smartFox.emit("leader_lb", result, version);
    }

    async fetch<T extends LeaderType = LeaderType>(type: T) : Promise<WaitForResult<Array<LeaderTypeToList[T]>>> {
        const cache = CacheManager.check("leaders", type);

        if (cache.valid) return { success: true, value: cache.value as Array<LeaderTypeToList[T]> };

        const wait = waitFor(this.client.smartFox, "leader_lb", [1, type], 3500);
        this.sendRequest(type);

        //@ts-expect-error
        return wait;
    }

    static isFaction(type: LeaderType, arg: CacheTypings.AnyLeaders) : arg is CacheTypings.AnyFactionLeaders {
        return this.Indexes.Faction.includes(type)
    }
}