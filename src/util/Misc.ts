import { readFile } from "fs/promises";
import Config from "../config/index.js";
import { request } from "undici";
import Logger from "../manager/logger.js";
import Constants from "../game/Constants.js";
import { parseStringPromise } from "xml2js";
import { BASE_URL, Routes, type Collection, type Message } from "oceanic.js";
import CacheManager from "../manager/cache.js";

/**
 * Starts at level 1, even though the index is 0. Level 40 = 39th index
 */
export const levels = [0, 13, 33, 63, 106, 166, 246, 350, 480, 640, 833, 1063, 1333, 1646, 2006, 2416, 2880, 3400, 3980, 4623, 5333, 6113, 6966, 7896, 8906, 10000, 11180, 12450, 13813, 15273, 16833, 18496, 20266, 22146, 24140, 26250, 28480, 30833, 33333, 35923];
export const reversedLevels = levels.toReversed();

// const undici = require("undici");
// const { readFile } = require("fs/promises");
// const { parseStringPromise } = require("xml2js");

export async function requestLangFile(i: number | "backup", languages: Record<string, string>) : Promise<[boolean, number]> {
    let text: string;

    if (i === "backup") text = await readFile(Config.cacheDirectory + "/backup.xml", "utf-8");
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

            languages[field.id] = field.txt;
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

/**
 * @param {string} str
 */
export function countRepeatedChars(str: string) {
    const len = str.length; let repeated = {} as Record<string, number>;

    for (let i = 0; i < len; i++) {
        repeated[str[i]] = repeated[str[i]] ? repeated[str[i]] + 1 : 1
    };

    return len ? Object.values(repeated).sort((a, b) => b - a)[0] / len : 0;
}

/**
 * @param {string} str
 */
export function isAllCharsSame(str: string) {
    for (let i = 1, len = str.length; i < len; i++) {
        if (str[i] != str[0]) return false;
    }; return true;
}

/**
 * Minimum is inclusive, maximum is exclusive.
 * @param min Inclusive
 * @param max Exclusive
 */
export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min; 

export const epoch = {
    special0: 1108382400000
};

export const regexes = {
    grabWordsInsideEqualitySymbols: /\<.{0,}\>/g,
    dateFormatWithEunderscore: /(E_|)\d{2}-\d{2}-\d{4}/gi,
    sanitiseEmojiName: / *\([^)]*\) */g, // Only removes parenthesis
    snowflake: /\d{17,21}/g
};

/**
 * If shorten is true, it's better to put empty string for replace.
 * replace only works for hide.
 */
export function getTime(milli: number | Date, hide=false, replace=', ', shorten=false) {
    let result = [];

    let time = milli instanceof Date ? milli : new Date(milli);
    //let months = time.getUTCMonth();
    let days = (Math.floor(time.getTime()/(1000*60*60*24)));
    let hours = time.getUTCHours().toString().padStart(2, '0');
    let minutes = time.getUTCMinutes().toString().padStart(2, '0');
    let seconds = time.getUTCSeconds().toString().padStart(2, '0');
    //let milliseconds = time.getUTCMilliseconds(); // too precise which is sad enough imo

    if (days) result.push(days + ((!shorten) ? ' days' : 'd'));
    if (hours != '00' || days) result.push(hours + ((!shorten) ? ' hours' : 'h')); // 3 hours and no days
    if (minutes != '00' || (hours != '00' || days)) result.push(minutes + ((!shorten) ? ' minutes' : 'm'));
    if (seconds != '00' || (minutes != '00' || hours != '00' || days)) result.push(seconds + ((!shorten) ? ' seconds' : 's'));

    if (hide)
        return result.join((typeof(replace) === 'string') ? replace : ', ');//return `${(!days) ? '' : days + ' days, '}${(hours == '00') ? '' : hours + ' hours, '}${(minutes == '00') ? '' : minutes + ' minutes, '}${(seconds == '00') ? '' : seconds + ' seconds, '}`;
    else
        return (!shorten) ? `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds` : `${days}d${hours}h${minutes}m${seconds}s`;
}

/**
 * Created by someone, danke.
 * @param arrayBuffer Must be already parsed as UInt8Array.
 */
export function UInt8ArrayToBase64String(arrayBuffer: Uint8Array) {
    let base64      = '';
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  
    const bytes         = arrayBuffer;
    const byteLength    = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength    = byteLength - byteRemainder;
  
    let a, b, c, d;
    let chunk;
  
    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63;               // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength];
  
      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4; // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
  
      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2; // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }
    
    return base64;
}

/**
 * Credit: https://stackoverflow.com/a/3983830
 * @param {number[]} probas List of percentages in decimal form, must be summed up to 1
 * @returns 
 */
export function randexec(probas:number[]=[0.3, 0.3, 0.4]) {
    let ar = []; let sum = 0;

    probas = [0, ...probas];

    for (let i = 0; i < probas.length - 1; i++) {
        sum += probas[i];
        ar[i] = sum;
    }

    let r = Math.random();

    let o = 0;
    for (let i = 0; i < ar.length && r >= ar[i]; i++) {
        o = i;
    }

    return o;
}

export function rawHoursified(hours: number, lastRecordedTime=Date.now()) {
    const msPerHour = 60 * 60 * 1000; // number of milliseconds in an hour
    const hoursRoundedDown = Math.floor(hours); // round down to nearest integer
    const timeToAdd = hoursRoundedDown * msPerHour; // convert hours to milliseconds
  
    const date = new Date(lastRecordedTime);
    date.setTime(date.getTime() + timeToAdd); // add milliseconds to the last recorded time
  
    // Set the minutes, seconds, and milliseconds to zero
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  
    return date;
}

export function getStarColorRank(starCount: number) {
    if (starCount <= 7) return 1;
    if (starCount > 7 && starCount <= 14) return 2;
    
    let x = 1;
    for (let i = 7; starCount > i && starCount <= (x + 7); i++) {
        x++;
    }
    if (x > 13) return -1;
    else return x;
}

export function getStarCount(ratingPts: number) {
    // As of 05/10/24 23:09 BST, this is the maximum amount of rating and stars.
    if (ratingPts >= 4790000) return 196;

    // (OUTDATED) references (90): [2140000,2115000,2090000,2065000,2040000,2015000,1990000,1965000,1940000,1915000,1890000,1865000,1840000,1815000,1790000,1765000,1740000,1715000,1690000,1665000,1640000,1615000,1590000,1565000,1540000,1515000,1490000,1465000,1440000,1415000,1390000,1365000,1340000,1315000,1290000,1265000,1240000,1215000,1190000,1165000,1140000,1115000,1090000,1065000,1040000,1015000,990000,965000,940000,915000,890000,865000,840000,815000,790000,765000,740000,715000,690000,665000,640000,615000,590000,565000,540000,515000,490000,465000,440000,415000,390000,365000,340000,315000,290000,265000,240000,215000,190000,165000,140000,115000,90000,65000,45000,30000,15000,5000,1500,500];

    let abnormal = [65000, 45000, 30000, 15000, 5000, 1500, 500];

    if (ratingPts <= 65000) {
        for (let i = 0; i < abnormal.length; i++) {
            if (ratingPts >= abnormal[i]) return 7 - i;
        } if (ratingPts < 500) return 0;
    }

    for (let i = 7; i < 125; i++) {
        let rp = 65000 + ((25000 * (i - 7)))

        if (ratingPts >= rp && ratingPts < (rp + 25000)) return i;
    } return 126;
}

export function emojiStarCount(starCount: number = 1) {
    let star = "";

    for (let x = 0, len = emojis.stars.length; x < len; x++) {
        if (starCount >= (x*7) && starCount <= ((x+1)*7)) {
            star = "<:" + emojis.stars[x] + ">";

            return star.repeat(starCount - ((x)*7))
        }
    } return "";
}

export const emojis = {
    /**
     * Each string is in the form of "Name:ID" of an emoji
     */
    stars: [
        "star1:1292245710015828040",
        "star2:1292245720140615822",
        "star3:1292245729321943050",
        "star4:1292245737320484886",
        "star5:1292245745918939166",
        "star6:1292245753942642768",
        "star7:1292245762780168274",
        "star8:1292245771248206015",
        "star9:1292245778823250092",
        "star10:1292245786909872198",
        "star11:1292245795516583966",
        "star12:1292245807914942524",
        "star13:1292245814013591663",
        "star14:1292245822477570122",
        "star15:1292245832204030022",
        "star16:1292245840093511750",
        "star17:1292245848863801408",
        "star18:1292245857315323957",
        "star19:1292245866224291963",
        "star20:1292245874939920395",
        "star21:1292245883513212968",
        "star22:1292245898461712478",
        "star23:1292245907487723601",
        "skull1:1292247033939492966",
        "skull2:1292247041346506752",
        "skull3:1292247048829141032",
        "skull4:1292247055955267736",
        "skull5:1292247065098719242"
      ],

    letters: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴"],

    alignment: ["", "exile:1085244911005208596", "legion:1085244935042764881"],

    numbers: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "keycap_eleven:1226302349169922190", "keycap_twelve:1226302356149244077", "keycap_thirteen:1226302407302975561", "keycap_fourteen:1226302423518154763", "keycap_fifteen:1226302448403087450", "keycap_sixteen:1226302620558163988", "keycap_seventeen:1226302640305209497", "keycap_eighteen:1226302655652036649", "keycap_nineteen:1226302676569165836", "keycap_twenty:1226302710618263552", "keycap_twenty_one:1226302813483565066", "keycap_twenty_two:1226302832672505887", "keycap_twenty_three:1226302847730061332", "keycap_twenty_four:1226302865698590740", "keycap_twenty_five:1226302905863377026"].map(v => { const a = v.split(":"); return a.length === 1 ? { id: null, name: a[0] } : { id: a[1], name: a[0] } }) as { id: string | null, name: string }[]
};

export const letters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
export const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

export interface CharPage {
    armClass: string,
    armGender: "M" | "F",
    armMutate: string,
    auxLink: string,
    charAccnt: string,
    charAccnt2: string,
    charArm: string,
    charClassId: string,
    charEye: string,
    charGender: "M" | "F",
    charHair: string,
    charHairS: string,
    charId: string,
    charJug: string,
    charLikes: string,
    charLvl: string,
    charName: string,
    charPri: string,
    charSec: string,
    charSkin: string,
    charWins1: string,
    charWins2: string,
    customHeadLink: string,
    defaultLimbs: string,
    gunLink: string,
    noHead: string,
    noHip: string,
    rating: string,
    styleHasAbove: string,
    wpnCat: string,
    wpnLink: string,

    items: CacheTypings.PlayerItems
}

export type CharPageResult = { success: true, result: CharPage } | { success: false, extra: { r: string } | { l: number } | { c: number } };

export async function getCharPage(charName: string) : Promise<CharPageResult> {
    const { statusCode, body } = await request("https://epicduel.artix.com/charpage.asp?id=" + encodeURIComponent(charName), { method: "GET", maxRedirections: 2});

    let result = {} as CharPage;

    if (statusCode >= 200 && statusCode < 300) {
        let html = await body.text();

        let lines = html.split("\n").filter(v => v.includes("CharacterPage_Red") && v.includes("AC_FL_RunContent"))
        
        if (!lines.length) return { success: false, extra: {l: 0}};

        let vars = lines[0].split("flashvars")[1].slice(3, -19)

        vars.split("&").map(g => g.split("=")).forEach(v => {
            result[v[0] as "rating"] = v[1];
        });

        if (Object.keys(result).length === 1 || result["charId"] === undefined) return { success: false, extra: { r: "No character found." } };

        const invIndex = html.indexOf("Inventory");
        const achIndex = html.indexOf("Achievements");

        const inventoryHtml = html.substring(invIndex + 32, achIndex - 42);

        // inventoryHtml.match();
        // TODO: use more simpler, faster method rather than using an iterator

        const invterators = inventoryHtml.matchAll(/<a href=\'https\:[^ ]*\' target='_blank' >([\w'\-\=\(\)\. ]*)<\/a>/g);
        const items:string[] = [];

        const dupes:Record<string, number> = {};

        for (const item of invterators) {
            if (item.length == 2) {
                items.push(item[1]);
                
                if (dupes[item[1]] === undefined) dupes[item[1]] = 1;
                else dupes[item[1]]++;
            }
        }

        CacheManager.update("useritems", parseInt(result["charId"]), result["items"] = { items, dupes });

        if (!CacheManager.check("player", result.charName.toLowerCase()).valid) {
            CacheManager.update("player", result.charName.toLowerCase(), { type: 1, char: result });
        }

        return { success: true, result };
    }

    return { success: false, extra: { c: statusCode }};
}

export function map<T, U>(arr: Array<T> | Collection<any, T>, cb: (value: T, index: number, obj: T[]) => U) : U[] {
    const res:U[] = [];

    if (!Array.isArray(arr)) arr = arr.toArray();

    for (let i = 0, len = arr.length; i < len; i++) {
        res[i] = cb(arr[i], i, arr);
        // if (pred(arr[i], i, arr)) res.push(arr[i]);
    }

    return res;
}

export function filter<T>(arr: Array<T> | Collection<any, T>, pred: (value: T, index: number, obj: T[]) => boolean | number) : T[] {
    const res:T[] = [];

    if (!Array.isArray(arr)) arr = arr.toArray();

    for (let i = 0, len = arr.length; i < len; i++) {
        if (pred(arr[i], i, arr)) res.push(arr[i]);
    }

    return res;
}

export function find<T>(arr: Array<T> | Collection<any, T>, pred: (value: T, index: number, obj: T[]) => boolean) : T | undefined {
    if (!Array.isArray(arr)) arr = arr.toArray();

    for (let i = 0, len = arr.length; i < len; i++) {
        if (pred(arr[i], i, arr)) return arr[i];
    }
    return undefined;
}

export function findLast<T>(arr: Array<T> | Collection<any, T>, pred: (value: T, index: number, obj: T[]) => boolean) : T | undefined {
    if (!Array.isArray(arr)) arr = arr.toArray();

    let l = arr.length;
    while (l--) {
        if (pred(arr[l], l, arr))
            return arr[l];
    }; return undefined;
}

export function findIndex<T>(arr: Array<T> | Collection<any, T>, pred: (value: T, index: number, obj: T[]) => boolean) : number {
    if (!Array.isArray(arr)) arr = arr.toArray();

    for (let i = 0, len = arr.length; i < len; i++) {
        if (pred(arr[i], i, arr)) return i;
    }
    return -1;
}

export function findLastIndex<T>(arr: Array<T> | Collection<any, T>, pred: (value: T, index: number, obj: T[]) => boolean) {
    if (!Array.isArray(arr)) arr = arr.toArray();

    let l = arr.length;
    while (l--) {
        if (pred(arr[l], l, arr))
            return l;
    }; return -1;
}

/**
 * @param str
 * @param length can't be lower than 3
 */
export function trimString(str: string, length: number) {
    str = str.trim();
    return (str.length < length) ? str : str.slice(0, length-3) + '...';
}

/**
 * idk the naming
 * @param strList
 * @param count
 * @returns true if naughty, false if okay
 */
export function countCommonStrings(strList: { c: string, t: number}[], count=5) : boolean {
    let obj = {};

    let repeated = 0;

    for (let i = 0, len = strList.length; i < len; i++) {
        let str = strList[i];

        if (isAllCharsSame(str.c) || countRepeatedChars(str.c) > 0.8) {
            if (++repeated > count) return true;
        }
    }

    // TODO: expand more

    return false;
}

export function discordDate(date: Date | number) {
    // if (!(date instanceof Date)) date = new Date(date);
    if (date instanceof Date) date = date.getTime();

    return "<t:" + Math.round(date/1000) + ":F>";
}

/**
 * This requires you to have calculated the difference.
 * Avoid using this if your bigint is too big even after the calculation.
 */
export function getHighestTime(time: number | bigint, type: "s" | "ms" | "mi" | "ns" = "ms") : string {
    time = typeof time === "bigint" ? Number(time) : Math.round(time * 100) / 100;
    switch (type) {
        case "s": return time + "s";// < 60000 ? time + "s" : getHighestTime(time / 60000, "s");
        case "ms": return time < 1000 ? time + "ms" : getHighestTime(time / 1000, "s");
        case "mi": return time < 1000 ? time + "µs" : getHighestTime(time / 1000, "ms");
        case "ns": return time < 1000 ? time + "ns" : getHighestTime(time / 1000, "mi");
        default: return time + String(type);
    }
}

export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function lazyTrimStringList(list: string[], limit=1024, limitByItem=false, separator="\n") {
    let str = "";
    let str2 = "";

    for (let i = 0; i < list.length; i++) {
        str2 += list[i] + separator;

        if ((limitByItem && i === limit) || (!limitByItem && str2.length > limit)) {
            str += "And " + (list.length - i) + " more.";
            return str;
        } str += list[i] + separator;
    }; return str.slice(0, -separator.length);
}

// Using this as Oceanic's message#jumplink won't guild id if the message was fetched (not via gateway)
export function jumpLink(guildId: string, messageId: string, channelId: string) : string
export function jumpLink(guildId: string, message: Message) : string
export function jumpLink(guildId: string, messageId: Message | string, channelId?: string) : string {
    // bloody type checking
    if (typeof messageId === "string" && channelId) return `${BASE_URL}${Routes.MESSAGE_LINK(guildId, channelId, messageId)}`;
    if (typeof messageId === "string") return "i will kill myself if this actually shows up";

    return `${BASE_URL}${Routes.MESSAGE_LINK(guildId, messageId.channelID, messageId.id)}`;
}