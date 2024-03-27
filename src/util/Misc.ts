import { readFile } from "fs/promises";
import Config from "../config/index.js";
import { request } from "undici";
import Logger from "../manager/logger.js";
import Constants from "../game/Constants.js";
import { parseStringPromise } from "xml2js";

/**
 * Starts at level 1, even though the index is 0. Level 40 = 39th index
 */
export const levels = [0, 13, 33, 63, 106, 166, 246, 350, 480, 640, 833, 1063, 1333, 1646, 2006, 2416, 2880, 3400, 3980, 4623, 5333, 6113, 6966, 7896, 8906, 10000, 11180, 12450, 13813, 15273, 16833, 18496, 20266, 22146, 24140, 26250, 28480, 30833, 33333, 35923];
export const reversedLevels = levels.toReversed();

// const undici = require("undici");
// const { readFile } = require("fs/promises");
// const { parseStringPromise } = require("xml2js");

export async function requestLangFile(i: number | "backup") : Promise<[boolean, number]> {
    let text: string;

    if (i === "backup") text = await readFile(Config.dataDir + "/backup.xml", "utf-8");
    else {
        try {
            const { body, statusCode } = await request("https://epicduelstage.artix.com/languages/en" + i + ".xml", { maxRedirections: 1});

            if (!(statusCode >= 200 && statusCode < 300)) {
                if (statusCode === 404) return [false, 0];
                return [false, -2];
            }

            text = await body.text();
        } catch (err) {
            Logger.getLogger("Languages").error(err);
            return [false, -2];
        }
    }

    if (text?.includes("<body>")) {
        let xmled = await parseStringPromise(text);

        for (let i = 0; i < xmled.body.field.length; i++) {
            let field = xmled.body.field[i]['$'];

            // epicduel.languages[field.id] = DesignNoteManager.functions.replaceHTMLbits(field.txt);
        }

        return [true, 1];
    }

    return [false, -1];
};

export function getUserLevelByExp(exp: number) {
    let lvl = 1;
    for (let i = 0; i < reversedLevels.length; i++) {
        if (exp >= reversedLevels[i]) {
            lvl = 40 - i;
            break;
        }
    }

    return lvl;
}

export function getIndexesOf(arr: string[], delimiter: string) {
    let indexes = [];
    let nextIndex = 0;
    let fromIndex = 0;

    //for (let i = 0; i < )
    while (arr.indexOf(delimiter,fromIndex) != -1) {
        let newIndex = arr.indexOf(delimiter,fromIndex);
        indexes.push(newIndex);
        nextIndex = newIndex = newIndex + 1;
        fromIndex = nextIndex;
    }
    return indexes;
}

// export function loop(v = 500) {
//     // fails is an array, 1st index is the number of time it has failed overall, 2nd index is the number of times it has failed for that version.
//     let fails = [0, 0];
//     let timeBetween = 900;
//     let finalSuccess = false;
//     let index = -1;

//     for (let i = 0; i < 20; i++) {

//         if (fails[0] > 25) { logger.error("Failed too many times trying to fetch the languages files (A)."); break; }
//         if (fails[1] > 5) { continue; } //logger.error("Failed too many times trying to fetch the languages file (B)."); break; }

//         let [success, value] = await requestLangFile(v + i, epicduel, logger);

//         if (success) {
//             finalSuccess = true;
//             index = v + i;
//             //if (value === 0) {
//                 break;
//             //}
//         } 
//         if (value === -1) {
//             fails[0]++;
//             fails[1]++;

//             i--;
//             await sleep(timeBetween);
//             continue;
//         } if (value === -2) {
//             fails[0]++;
//             fails[1]++;

//             i--;
//             await sleep(timeBetween + 2000);
//             continue;
//         }
//     }

//     if (!finalSuccess) {
//         logger.error("Failed to fetch the languages files, using backup.");
//         await requestLangFile('backup', epicduel, logger);
//     }

//     return { index, success: finalSuccess };
// }

export function getLegendRankByExp(exp: number) {
    return Math.ceil((exp - Constants.CHAR_MAX_EXP + 1) / Constants.EXP_PER_LEGEND_RANK);
}

export function nextLegendRankByExp(exp: number) {
    let x = 7500 - Math.ceil((exp - Constants.CHAR_MAX_EXP + 1)) % 7500;
    let y = Math.ceil((exp - Constants.CHAR_MAX_EXP + 1) / Constants.EXP_PER_LEGEND_RANK) + 1;

    if (x === 7500) x = 1;
    else x += 1;

    return [y, x];
}