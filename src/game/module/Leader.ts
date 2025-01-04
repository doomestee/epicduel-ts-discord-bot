import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import SmartFoxClient from "../sfs/SFSClient.js";
import BaseModule from "./Base.js";
import CacheManager from "../../manager/cache.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import { CharPage, CharPageResult, filter, find, findIndex, getCharPage, map } from "../../util/Misc.js";
import DatabaseManager, { quickDollars } from "../../manager/database.js";
import { ICharacter } from "../../Models/Character.js";
import Logger from "../../manager/logger.js";
import SwarmResources from "../../util/game/SwarmResources.js";

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
    23: CacheTypings.PlayerLeaderRank;
}

export type LeaderType = keyof LeaderTypeToList;

export type FactionLeaderType = 7 | 10 | 8 | 9 | 19 | 12 | 5 | 6 | 18;
export type CharacterLeaderType = 1 | 2 | 16 | 3 | 4 | 17 | 11 | 13 | 14 | 15 | 20 | 21 | 22 | 23;

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
            Rank: 23,

            All: [1, 2, 16, 11, 14, 13, 8, 9, 19, 12, 21, 22, 23],
            Faction: [7, 10, 8, 9, 19, 12],
            Char: [1, 2, 16, 11, 14, 13, 21, 22, 23],
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
        Char: [1, 2, 16, 11, 14, 13, 21, 22, 23, 3, 4, 17, 15, 20]
    };

    /**
     * List of character names, shared between all clients here, that are ignored when fetching.
     * (LOWER CAPITALISED)
     */
    static ignoreJuggs:string[] = [];

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

        if (this.debug === true) {
            console.log(leaderData);
        }

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

                    CacheManager.update("player", result[result.length - 1].name.toLowerCase(), { type: 2, char: result[result.length - 1].misc as CacheTypings.PlayerLeaderMiscWithExp });
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

                    CacheManager.update("player", result[result.length - 1].name.toLowerCase(), { type: 2, char: result[result.length - 1].misc as CacheTypings.PlayerLeaderMiscWithExp });
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

                    CacheManager.update("player", result[result.length - 1].name.toLowerCase(), { type: 2, char: result[result.length - 1].misc as CacheTypings.PlayerLeaderMiscWithExp });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as (CacheTypings.PlayerLeaderInf | CacheTypings.PlayerLeaderRarity | CacheTypings.PlayerLeaderFame | CacheTypings.PlayerLeaderRedeems | CacheTypings.PlayerLeaderRating)[]).push({
                        "name": smalls[i],
                        [name as "fame"]: parseInt(smalls[++i]),
                        // misc: {}
                    });
                }

                break;
            case 23:
                // ["charName","rank","charLvl","charExp","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"]
                for (let i = 0, len = brags.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderRank[]).push({
                        name: brags[i],
                        rank: parseInt(brags[++i]),
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

                    CacheManager.update("player", result[result.length - 1].name.toLowerCase(), { type: 2, char: result[result.length - 1].misc as CacheTypings.PlayerLeaderMiscWithExp });
                }

                for (let i = 0, len = smalls.length; i < len; i++) {
                    (result as CacheTypings.PlayerLeaderRank[]).push({
                        name: smalls[i],
                        rank: parseInt(smalls[++i]),
                        // misc: {}
                    });
                }
                break;
        }

        CacheManager.update("leaders", version, result);
        this.client.smartFox.emit("leader_lb", result, version);
    }

    /**
     * NOTE: If it's DAILY CHAR JUGG leaderboard, all the char names will get automatically fetched, this will make this fetching take a significantly long time.
     */
    async fetch<T extends LeaderType = LeaderType>(type: T) : Promise<WaitForResult<Array<LeaderTypeToList[T]>>> {
        const cache = CacheManager.check("leaders", type);

        if (cache.valid) return { success: true, value: cache.value as Array<LeaderTypeToList[T]> };

        const wait = waitFor(this.client.smartFox, "leader_lb", [1, type], 3500);
        this.sendRequest(type);

        if (Leader.Indexes.Char.includes(type)) {
            const waited = await wait; // yes

            //@ts-expect-error
            if (!waited.success || waited.value.length === 0) return waited;

            const list = waited.value as CacheTypings.AnyPlayerLeaders[];
            const names = map(list, c => c.name.toLowerCase()); // Converting cos there's an index only for lowercase'd names..

            const { rows: chars } = await DatabaseManager.cli.query<ICharacter>(`SELECT * FROM character WHERE lower(name) IN (${quickDollars(names.length)})`, names);

            for (let i = 0, len = chars.length; i < len; i++) {
                if (SwarmResources.tracker.player.idToChar[chars[i].id] !== undefined) {
                    SwarmResources.tracker.player.idToChar[chars[i].id] = chars[i].name;
                    SwarmResources.tracker.player.charToId[chars[i].name as "Despair"] = chars[i].id;
                }
            }

            //@ts-expect-error
            if (names.length === chars.length) return waited;

            const missings = filter(names, n => !Leader.ignoreJuggs.includes(n) && findIndex(chars, c => c.name.toLowerCase() === n) === -1);

            //@ts-expect-error
            if (missings.length === 0) return waited;

            let charPgs:CharPage[] = [];

            for (let i = 0, len = missings.length; i < len; i++) {
                //@ts-expect-error
                charPgs.push(getCharPage(missings[i]).then(v => {
                    if (!v.success) Leader.ignoreJuggs.push(missings[i]); // For unviewable characters, such as Musashi.

                    return v;
                }));
            }

            // Why the hell does process.exit() work
            charPgs = map(filter(await Promise.all(charPgs as unknown as Promise<CharPageResult>[]), v => v.success), v => v.success ? v.result : process.exit(1));//(Promise.all(charPgs) as CharPageResult[]), v => v.success);

            const { rows: existings } = await DatabaseManager.cli.query<ICharacter>(`SELECT * FROM character WHERE id IN (${quickDollars(charPgs.length)})`, map(charPgs, c => c.charId));

            const proms:Promise<any>[] = [];

            for (let i = 0, len = charPgs.length; i < len; i++) {
                const exist = find(existings, v => v.id === parseInt(charPgs[i].charId));
                
                if (exist === undefined) { Leader.ignoreJuggs.push(charPgs[i].charName.toLowerCase()); continue; }

                if (SwarmResources.tracker.player.idToChar[exist.id] !== undefined) {
                    SwarmResources.tracker.player.idToChar[exist.id] = charPgs[i].charName;
                    SwarmResources.tracker.player.charToId[charPgs[i].charName as "Despair"] = exist.id;
                }

                const user = charPgs[i];

                proms.push(
                    DatabaseManager.update("character", { id: exist.id, user_id: exist.user_id }, { name: user.charName, fame: user.charLikes }),

                    DatabaseManager.cli.query(`SELECT * FROM character_name WHERE id = $1 ORDER BY last_seen desc LIMIT 1`, [user.charId])
                        .then(v => {
                            if (v.rows.length && v.rows[0].name.toLowerCase() === user.charName.toLowerCase()) {
                                return DatabaseManager.cli.query(`UPDATE character_name SET last_seen = $1 WHERE o_id = $2 `, [new Date(), v.rows[0]["o_id"]]);
                            } else return DatabaseManager.cli.query(`INSERT INTO character_name (id, name) VALUES ($1, $2)`, [user.charId as unknown as string, user.charName]);
                        }).catch(e => Logger.getLogger("CharTracker").error(e))
                );
            }

            await Promise.all(proms);
        }

        // @ts-expect-error
        return wait;
    }

    static isFaction(type: LeaderType, arg: CacheTypings.AnyLeaders) : arg is CacheTypings.AnyFactionLeaders {
        return this.Indexes.Faction.includes(type)
    }
}