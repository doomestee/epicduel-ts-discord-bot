import type { AnyItemRecordsExceptSelf } from "../../game/box/ItemBox.js";
import type { SkillTypes } from "../../game/box/SkillsBox.js";
import type { GiftObject } from "../../game/module/Advent.js";
import type Room from "../../game/sfs/data/Room.js";
import Logger from "../../manager/logger.js";
import type { IUserRecord } from "../../Models/UserRecord.js";
import { requestLangFile, sleep } from "../Misc.js";

// type BecauseICantThink<T extends Exclude<SkillTypes, "tree"> = Exclude<SkillTypes, "tree">> = Record<T, ExtractValueType<typeof SkillsSMBox.objMap[T]>>//T extends "tree" ? typeof SkillsSMBox.objList[T] : ExtractValueType<typeof SkillsSMBox.objMap>[T]>

/**
 * This is a bit weird but I have converted this to static since nearly the end of 2024 as it's better a design choice.
 */
export default class SwarmResources {
    static languages:Record<string, string> = {};

    static version = {
        game: "",
        lang: -1
    };

    static comparisonFiles: { skills: Record<SkillTypes, any[]>, item: AnyItemRecordsExceptSelf[] };

    static comparison = {
        gameVersion: "",
        time: -1,
        doneById: -1,
        fileRetrieved: false
    }

    /**
     * This will be invoked if there's a new game update.
     */
    static clear() {
        this.languages = {};
        this.getNewLang();
    }

    // 504 as of 14-04-2024
    static async getNewLang() {
        let v = this.version.lang > 0 ? this.version.lang - 2 : 504;

        // fails is an array, 1st index is the number of time it has failed overall, 2nd index is the number of times it has failed for that version.
        let fails = [0, 0];
        let timeBetween = 900;
        let finalSuccess = false;
        let index = -1;

        for (let i = 0; i < 20; i++) {

            if (fails[0] > 25) { Logger.getLogger("Languages").error("Failed too many times trying to fetch the languages files (A)."); break; }
            if (fails[1] > 5) { continue; } //logger.error("Failed too many times trying to fetch the languages file (B)."); break; }

            let [success, value] = await requestLangFile(v + i, this.languages);

            if (success) {
                finalSuccess = true;
                index = v + i;
                //if (value === 0) {
                    break;
                //}
            } 
            if (value === -1) {
                fails[0]++;
                fails[1]++;

                i--;
                await sleep(timeBetween);
                continue;
            } if (value === -2) {
                fails[0]++;
                fails[1]++;

                i--;
                await sleep(timeBetween + 2000);
                continue;
            }
        }

        if (!finalSuccess) {
            Logger.getLogger("Languages").error("Was unable to fetch the newest language file, using backup now.");
            // logger.error("Failed to fetch the languages files, using backup.");
            await requestLangFile('backup', this.languages);
        }

        if (finalSuccess) {
            this.version.lang = index;
        }

        return { index, success: finalSuccess };
    }

    static skills: { [userId: number | number]: { id: number, lvl: number }[] | undefined } = {};
    static records: { [userId: number | number]: Omit<IUserRecord, "char_id"> | undefined } = {};

    static tracker = {
        war: lazyMakeTracker<TrackedWarUse>("War"),
        gift: lazyMakeTracker<GiftObject>("Gift"),
        // TODO: simplify this if we get another similar unorthodox tracker.
        player: {
            active: true,
            chars: {
                9130082: { lastJugg: [-1, -1], time: -1 },
                8958672: { lastJugg: [-1, -1], time: -1 },
                9069893: { lastJugg: [-1, -1], time: -1 },
            } as Record<number | string, { lastJugg: [number, number], time: number }>,

            idToChar: {
                9130082: "Despair",
                8958672: "CactusChan",
                9069893: "Vendetta",
            } as Record<number | string, string>,

            charToId: {
                "Despair": 9130082,
                "CactusChan": 8958672,
                "Vendetta": 9069893,
            }
        }
    }

    static rooms = new Map<number, Room>();
}

function lazyMakeTracker<T>(name: string) {
    return {
        active: false,
        startedSince: -1,
        list: [] as T[],
        initiated: false,
        activate() {
            if (this.active) throw Error(name + " is already being tracked!");

            this.active = true;
            this.startedSince = Date.now();
            this.initiated = true;
            this.list.splice(0);

            return true;
        }
    }
}

export interface TrackedWarUse {
    name: string,
    influence: number,
    usedItemId: number,
    time: number,
}