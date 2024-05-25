import { IUserRecord } from "../../Models/UserRecord.js";
import { Gift } from "../../game/module/Advent.js";
import Logger from "../../manager/logger.js";
import { requestLangFile, sleep } from "../Misc.js";

export default class SwarmResources {
    // boxes = {

    // }

    languages:Record<string, string> = {};
    langVersion = -1;

    gameVersion = "";

    /**
     * This will be invoked if there's a new game version not identical to previous.
     */
    clear() {
        this.languages = {};

        this.getNewLang();
    }

    // 504 as of 14-04-2024
    async getNewLang() {
        let v = this.langVersion > 0 ? this.langVersion - 2 : 504;

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
            this.langVersion = index;
        }

        return { index, success: finalSuccess };
    }

    skills: { [userId: number | number]: { id: number, lvl: number }[] | undefined } = {};
    records: { [userId: number | number]: Omit<IUserRecord, "char_id"> | undefined } = {};

    tracker = {
        war: lazyMakeTracker<TrackedWarUse>("War"),
        gift: lazyMakeTracker<Gift>("Gift"),
        // TODO: simplify this if we get another similar unorthodox tracker.
        player: {
            active: true,
            chars: {
                9130082: { lastJugg: [-1, -1], time: -1 },
            } as Record<number | string, { lastJugg: [number, number], time: number }>,

            idToChar: {
                9130082: "Despair"
            } as Record<number | string, string>,

            charToId: {
                "Despair": 9130082
            }
        }
    }

    checkpoints = {
        comparison: [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]] as [number, number[]]
    }
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