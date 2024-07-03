import CacheManager from "../../manager/cache.js";
import { map } from "../../util/Misc.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import Constants, { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export interface FactionMember {
    id: number,
    name: string;
    title: string;
    influence: number,
    lastActive: number,
    isOnline: number,
    rank: number;
}

export interface Faction {
    id: number,
    name: string,
    alignment: 1 | 2,
    flag: {
        symbol: number,
        symbolColor: string,
        back: number,
        backColor: string,
        flagColor: string
    },
    influence: {
        daily: number,
        total: number
    },
    lead: {
        one: number,
        two: number,
        jugg: number
    },
    domination: number,
    wins: {
        one: number,
        two: number,
        jugg: number
    },
    warUpgrade: number,
    alignWins: number,
    rank: {
        rank: string;
        lvl: number;
    }
    members: FactionMember[]
}

export default class FactionManager extends BaseModule {
    static readonly PERM_MEMBER = "member";
    static readonly PERM_OFFICER = "officer";
    static readonly PERM_FOUNDER = "founder";
    
    static readonly PERM_MEMBER_ID = 1;
    static readonly PERM_OFFICER_ID = 2;
    static readonly PERM_FOUNDER_ID = 3;

    static readonly FACTION_SIZE = 18;

    static readonly fctRanks = ['Recruits', 'Initiates', 'Militia', 'Squad', 'Enforcers', 'Syndicate', 'Coalition',
    'Veterans', 'Guardians', 'Harbingers', 'Champions', 'Grand Champions', 'Duel Masters', 'Juggernauts', 
    'Immortals', 'Immortal Champions', 'Immortal Legends', 'Eternal Legends']

    constructor(public client: Client) {
        super();
    }

    /**
     * This doesn't return the results.
     * Use the smartFox event "factionData" for the data.
     * @param {number} factionId
     */
    getFactionData(factionId: number) {
        return this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_FACTION_DATA, {fctId: factionId}, 1, "json");
    }

    factionDataAvailable(data: string[]) {
        const officersIndex = data.indexOf("$");
        const membersIndex = data.indexOf("#");
        const success = data[2];

        // if (success != 1) {
        //     this.client.smartFox.emit("factionData", [])

        //     return; // No faction, TODO: Handle this.
        // }

        let fctId = Number(data[3]);

        const fact:Faction = {
            id: fctId,
            name: data[4],
            alignment: Number(data[5]) as 1 | 2,
            flag: {
                symbol: Number(data[6]),
                symbolColor: data[7],
                back: Number(data[8]),
                backColor: data[9],
                flagColor: data[10]
            },
            influence: {
                daily: Number(data[11]),
                total: Number(data[12])
            },
            lead: {
                one: Number(data[13]),
                two: Number(data[14]),
                jugg: Number(data[15])
            },
            domination: Number(data[16]),
            wins: {
                one: Number(data[17]),
                two: Number(data[18]),
                jugg: Number(data[19])
            },
            warUpgrade: Number(data[20]),
            alignWins: Number(data[21]),
            rank: this.getFactionRank(Number(data[12])),
            members: []
        };// as Omit<Faction, "members">// as Omit<"members", Faction>;

        const founders = data.slice(22, officersIndex);
        const officers = data.slice(officersIndex + 1, membersIndex);
        const members = data.slice(membersIndex + 1);

        let fctCharRecords = [] as FactionMember[];

        for (let x = 0; x < 3; x++) {
            let t = (x === 0) ? founders : (x === 1) ? officers : members;

            for (let y = 0; y < t.length / 6; y++) {
                fctCharRecords.push({
                    id: Number(t[0 + 6 * y]),
                    name: t[1 + 6 * y],
                    title: t[2 + 6 * y],
                    influence: Number(t[3 + 6 * y]),
                    lastActive: Number(t[4 + 6 * y]),
                    isOnline: Number(t[5 + 6 * y]),
                    rank: (x === 0) ? 3 : (x === 1) ? 2 : 1
                })
            }
        }

        // this.fctCharNames = fctCharRecords;

        fact.members = fctCharRecords;

        CacheManager.update("faction", fctId, fact);
        this.client.smartFox.emit("faction_data", fact, fctId);
        this.client.swarm.execute("onFactionEncounter", this.client, { fact: { id: fact.id, name: fact.name, alignment: fact.alignment as 1 | 2 } });
        this.client.swarm.execute("onFactionMemberEncounter", this.client, { alignment: fact.alignment, faction_id: fact.id, chars: map(fact.members, v => ({ id: v.id, name: v.name })) });
        // this.client.smartFox.emit("factionData", fctId, this.cache[fctId]);
    }

    getFactionRank(influence: number) {
        let obj = { rank: "", lvl: 0 };

        let scores = [2500,5000,10000,25000,50000,100000,250000,500000,1000000,2500000,5000000,7500000,10000000,15000000,20000000,25000000,30000000];

        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > influence) {
                obj.rank = FactionManager.fctRanks[i + 1];
                obj.lvl = i + 1;
                break;
            }
        }

        return obj;
    }

    static alignmentName(alignId: number) {
        return alignId == 0 ? "None" : alignId == Constants.EXILE_ID ? "Exile" : alignId == Constants.LEGION_ID ? "Legion" : "Unknown";
    }

    getFaction(id: number) : Promise<WaitForResult<Faction>> {
        const cache = CacheManager.check("faction", id);

        if (cache.valid) return Promise.resolve({ success: true, value: cache.value });

        const wait = waitFor(this.client.smartFox, "faction_data", [1, id], 4000);
        this.getFactionData(id);

        return wait;
    }
}
