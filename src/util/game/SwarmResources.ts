import { IUserRecord } from "../../Models/UserRecord.js";
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

    // 503 as of 07-04-2024
    async getNewLang() {
        let v = this.langVersion > 0 ? this.langVersion : 503;

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

    skills: { [userId: number]: { id: number, lvl: number }[] } = {};
    records: { [userId: number]: IUserRecord } = {};
}