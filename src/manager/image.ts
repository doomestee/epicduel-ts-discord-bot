import { readdir } from "fs/promises";
import SvgGen from "../util/SvgGen.js";
import Config from "../config/index.js";

type ImageItem = "avatar" | "core";// | "cheevo"

/**
 * This will keep a list of images like achievements, avatars, cores etc as well as being able to make images with svgs.
 */
export default class ImageManager {
    static readonly SVG = new SvgGen();

    static list:{ [x in ImageItem]: string[] } = {
        avatar: [],
        // cheevo: [],
        core: [],
    }

    static ready:{ [x in ImageItem]: boolean } = {
        avatar: false,
        // cheevo: false,
        core: false,
    }

    protected static init() {
        const keys = Object.keys(this.list) as ImageItem[];

        for (let i = 0, len = keys.length; i < len; i++) {
            readdir(Config.dataDir + "/assets/" + keys).then(v => {
                this.list[keys[i]] = v;
            });
        }
    }
}

ImageManager["init"]();