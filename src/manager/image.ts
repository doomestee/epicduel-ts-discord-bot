import { readdir } from "fs/promises";
import SvgGen from "../util/SvgGen.js";
import Config from "../config/index.js";

type ImageItem = "avatars" | "cores";// | "cheevo"

/**
 * This will keep a list of images like achievements, avatars, cores etc as well as being able to make images with svgs.
 */
export default class ImageManager {
    static readonly SVG = new SvgGen();

    static list:{ [x in ImageItem]: string[] } = {
        avatars: [],
        // cheevo: [],
        cores: [],
    }

    static ready:{ [x in ImageItem]: boolean } = {
        avatars: false,
        // cheevo: false,
        cores: false,
    }

    protected static init() {
        const keys = Object.keys(this.list) as ImageItem[];

        for (let i = 0, len = keys.length; i < len; i++) {
            readdir(Config.dataDir + "/assets/" + keys[i]).then(v => {
                for (let j = 0, len = v.length; j < len; j++) {
                    if (v[j].startsWith("._")) continue; // Fucking shitty macos with the ._file.ext

                    this.list[keys[i]].push(v[j]);
                }

                // this.list[keys[i]] = v;
                this.ready[keys[i]] = true;
            });
        }
    }

    static has(type: ImageItem, str: string) {
        if (this.list[type] === undefined) return false;

        for (let i = 0, len = this.list[type].length; i < len; i++) {
            if (this.list[type][i] === str) return true;
        }
        return false;
    }
}

ImageManager["init"]();