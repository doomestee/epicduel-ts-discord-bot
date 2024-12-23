import { readdir } from "fs/promises";
import SvgGen from "../util/SvgGen.js";
import Config from "../config/index.js";

type ImageItem = "avatars" | "cores" | "swords" | "guns" | "auxiliary";// | "cheevo"

function toList<T extends string = string>(...keys: T[]) {//<T = Array<string>>(keys: T) {
    const obj = {} as Record<T, [string, string][]>;

    for (let i = 0; i < keys.length; i++) {
        obj[keys[i]] = [];
    }

    return obj;
}

// toList("abc", "def", "nice")

/**
 * This will keep a list of images like achievements, avatars, cores etc as well as being able to make images with svgs.
 */
export default class ImageManager {
    static readonly SVG = new SvgGen();

    static list:{ [x in ImageItem]: [string, string][] }
        = toList("avatars", "cores", "swords", "guns", "auxiliary");

    static ready = {
        avatars: false,
        // cheevo: false,
        cores: false,

        swords: false,
    } as { [x in ImageItem]: boolean }

    protected static init() {
        const keys = Object.keys(this.list) as ImageItem[];

        for (let i = 0, len = keys.length; i < len; i++) {
            this.ready[keys[i]] = false;

            readdir(Config.dataDir + "/assets/" + keys[i]).then(v => {
                for (let j = 0, len = v.length; j < len; j++) {
                    if (v[j].startsWith("._")) continue; // Fucking shitty macos with the ._file.ext

                    this.list[keys[i]].push([v[j].split(".").slice(0, -1).join("."), v[j]]);
                }

                // this.list[keys[i]] = v;
                this.ready[keys[i]] = true;
            });
        }
    }

    /**
     * If status boolean is false, result will be empty string.
     */
    static has(type: ImageItem, str: string) : boolean;
    static has(type: ImageItem, str: string, legacy?: true) : boolean;
    static has(type: string, str: string, legacy: false) : { status: boolean, result: string };
    static has(type: ImageItem, str: string, legacy: false) : { status: boolean, result: string };
    static has(type: ImageItem, str: string, legacy = true) {
        if (this.list[type] === undefined) return legacy ? false : { status: false, result: "" };

        for (let i = 0, len = this.list[type].length; i < len; i++) {
            if (this.list[type][i][0] === str || this.list[type][i][1] === str) return legacy ? true : { status: true, result: this.list[type][i][1] };
        }
        return legacy ? false : { status: false, result: "" };
    }
}

ImageManager["init"]();