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
                this.list[keys[i]] = v;
                this.ready[keys[i]] = true;
            });
        }
    }
}

ImageManager["init"]();