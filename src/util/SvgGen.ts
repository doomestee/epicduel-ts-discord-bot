import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { readFile, readdir } from "fs/promises";
import Config from "../config/index.js";
import Logger from "../manager/logger.js";

import Helper from "svg-boundings/util/helper.js";
import ClassBox from "../game/box/ClassBox.js";
import sharp, { Blend } from "sharp";
import Jimp from "jimp";
import { ColorActionName } from "@jimp/plugin-color";


// import type { ColorActionName } from "../../node_modules/@jimp/plugin-color/index.js"
import Leader, { CharacterLeaderType, LeaderType, LeaderTypeToList } from "../game/module/Leader.js";
import ItemSBox from "../game/box/ItemBox.js";
import { lazyFuck } from "./Leaderboard.js";
import StyleBox from "../game/box/StyleBox.js";
import { CharPage, findIndex, getCharPage, getUserLevelByExp, map } from "./Misc.js";
import DatabaseManager, { quickDollars } from "../manager/database.js";
import { ICharacter } from "../Models/Character.js";
import CacheManager from "../manager/cache.js";

type SvgItem = "armors" | "hairs" | "heads" | "bicepsR" | "symbols";

function quickLvl(v: { lvl?: number, exp?: number, misc?: CacheTypings.PlayerLeaderMiscWithExp | CacheTypings.PlayerLeaderMiscWithoutExp }) : number | string {
    if (v.lvl || v.misc?.lvl) return v.lvl as number ?? v.misc?.lvl;
    if (v.exp) return getUserLevelByExp(v.exp);
    if (v.misc && "exp" in v.misc) return getUserLevelByExp(v.misc.exp);
    return "";
}

export function numberToHex(num?: number | string) {
    if (typeof num === "undefined") num = Math.floor(Math.random()*16777215);
    if (typeof num === "string") num = parseInt(num, 16);

    return "#" + num.toString(16).padStart(6, "0");
}

const align = ["", "exile", "legion"];

export default class SvgGen {
    list:{ [x in SvgItem]: string[] } = {
        "armors": [],
        "hairs": [],
        "heads": [],
        "bicepsR": [],
        "symbols": []
    };

    cache = {
        char: {} as { [name: string]: boolean },
        fact: {} as { [name: string]: boolean },
    }

    parser = new XMLParser({
        ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: true, cdataPropName: '__cdata', isArray: (tag, jpath, leafnode, attribute) => {
            if (tag === "path" && leafnode) return true;
            if (tag === "use" && leafnode) return true;
            //else return true;
            return false;
        }
    });

    builder = new XMLBuilder({ignoreAttributes: false, attributeNamePrefix: '@', cdataPropName: '__cdata'});

    initialised = false;

    constructor() {
        this.initialise();
    }

    private initialise() {
        let mapped:SvgItem[] = [];

        return readdir(Config.svgDir, { withFileTypes: true }).then((dirs) => {
            let list = [];

            for (let i = 0; i < dirs.length; i++) {
                if (!dirs[i].isDirectory()) continue;

                let dir = dirs[i];

                mapped.push(dir.name as SvgItem);

                list.push(readdir(Config.svgDir + "/" + dir.name + "/", { withFileTypes: true }));
            }

            return Promise.all(list);
        }).then((dirsLists) => {

            for (let i = 0; i < dirsLists.length; i++) {
                this.list[mapped[i]] = [];

                for (let y = 0; y < dirsLists[i].length; y++) {
                    let item = dirsLists[i][y];

                    if (!item.name.endsWith(".svg")) continue;

                    this.list[mapped[i]].push(item.name);
                }
            }

            this.initialised = true;

            return Promise.allSettled(["/chars", "/flags"].map(v => readdir(Config.cacheDirectory + v, { withFileTypes: false })))
        }).then((caches) => {
            for (let i = 0, len = caches.length; i < len; i++) {
                const cch = caches[i];

                if (cch.status === "rejected") continue;

                for (let j = 0, jen = cch.value.length; j < jen; j++) {
                    const file = cch.value[j];

                    if (!file.endsWith(".png") || !file.startsWith("D_")) continue;

                    const name = file.slice(2, -4);

                    this.cache[i === 0 ? "char" : "fact"][name] = true;
                }
            }
        }).catch((err) => {
            Logger.error("SVG").error(err);
        })
    }

    /**
     * INTENTIONALLY POORLY DOCUMENTED
     * @param svg must be string
     * @param colours
     * @param overrideColour hex string.
     * @param translucent if true, will set to 0.1 opacity
     */
    protected process(svg: string | Buffer, colours: Record<string, string>, overrideColour?: string | null, translucent?: boolean) : any;
    protected process(svg: string | Buffer, colours: Record<string, string>, translucent?: boolean) : any;
    protected process(svg: string | Buffer, colours: Record<string, string>, overrideColour: string | null | boolean = null, translucent: boolean = false) {
        if (typeof overrideColour === "boolean") {
            translucent = overrideColour; overrideColour = null;
        }

        const xml = this.parser.parse(svg);

        let parse = {} as any;
        let parse2idk = {} as any;

        let bound: {
            top: number, left: number, right: number, bottom: number, width: number, height: number
        };

        let innerParse = (obj: any, type: string, loopCount=0, reverse=false, prevObj:any={}) => {
            let ele = {
                id: null, "href": null,
                fill: null
            } as Record<any, any>;
        
            if (!reverse) {
                if (type === "use" && !Array.isArray(obj)) {
                    //console.log([obj["@xlink:href"], prevObj]);
        
                    ele = {
                        id: obj["@id"] ? obj["@id"] : "",
                        "href": obj["@xlink:href"].slice(1)
                    };
        
                    if (ele.id) parse[ele.href] = ele.id;
        
                    //console.log(ele);
                } else if (type === "g" && obj["use"] && obj["@id"]) {
                    //console.log(obj);
        
                    let uses = Array.isArray(obj["use"]) ? obj["use"] : [obj["use"]];
        
                    for (let i = 0; i < uses.length; i++) {
                        const use = uses[i];
                        
                        if (!parse2idk[obj["@id"]]) parse2idk[obj["@id"]] = [];
                        parse2idk[obj["@id"]].push(use["@xlink:href"].slice(1));
                    }
                    //console.log(obj);
        
                    //console.log([type, uses[0]["@xlink:href"]]);
                }
            } else {
                if (type === "path" && prevObj["@id"]) {
                    for (let path of obj) {
                        let id = prevObj["@id"];

                        if (translucent) {
                            path["@fill-opacity"] = "0.3";
                        } else if (overrideColour) {
                            path["@fill"] = numberToHex(overrideColour);
                        } else {
                            let change = (key: any) => {
                                if (parse[key] && colours[parse[key]] !== undefined) {
                                    path["@fill"] = numberToHex(colours[parse[key]]);
                                }
                            }
            
                            for (const key in parse2idk) {
                                if (parse2idk[key].includes(id)) {
                                    // Check if the corresponding key is in parse
                                    if (parse.hasOwnProperty(key)) {
                                        // Continue with your logic here
                                        // Add your code here to handle the case when both ID and key are found in parse
                                        //console.log(`ID: ${id} found in ${key} in parse2idk, and key exists in parse.`);
                                        return change(key);
                                    }
                                
                                    // Check if the corresponding key is in another list in parse2idk
                                    for (const otherKey in parse2idk) {
                                        if (parse2idk[otherKey].includes(key)) {
                                        // Check if the corresponding key is in parse
                                        if (parse.hasOwnProperty(otherKey)) {
                                            // Continue with your logic here
                                            // Add your code here to handle the case when ID is found in one list,
                                            // and the corresponding key is found in another list, and key exists in parse
                                            //console.log(`ID: ${id} found in ${key} in parse2idk, and ${otherKey} found in ${key} in parse2idk, and key exists in parse.`);
                                            return change(otherKey);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        
            for (let x of Object.keys(obj)) {
                //console.log(typeof obj[x]);
        
                if (typeof obj[x] === "object") innerParse(obj[x], Array.isArray(obj) ? type : x, loopCount + 1, reverse, obj);
                else {
                    //console.log([x, obj[x], type, loopCount]);
                }
            }
        }

        innerParse(xml.svg, "svg");
        innerParse(xml.svg, "svg", 0, true);

        let w = parseFloat(xml.svg["@width"].slice(0, -2));
        let h = parseFloat(xml.svg["@height"].slice(0, -2));
        let l = xml.svg["@x"] || 0; let t = xml.svg["@y"] || 0;
        let r = l + w; let b = t + h;

        if (xml.svg.g["@transform"]) {
            let matrix = Helper.transformToMatrix(xml.svg.g["@transform"]);
            let a = Helper.boundingUnderTransform(matrix, t, r, b, l);

            bound = a;
            //console.log([a]);
        } else throw Error("UH OH!")/*else {
            let dd = {
                left: l,
                top: t,
                right: r,
                bottom: b,
                width: w,
                height: h
            };
        }*/

        //console.log(boundings.path(cheerio.load(svg)("svg")));

        return { xml, bound };
    }

    generator = new Generator(this)
}

export type CharGenKeys = keyof CharToGen;

export type CharToGen = {
    charPri: string,
    charSec: string,
    charHair: string,
    charSkin: string,
    charAccnt: string,
    charAccnt2: string,
    charEye: string,
    charGender: "M"|"F",
    charArm: string | number,
    charClassId: string | number,
    charHairS: string | number,
    customHeadLink: string,
    noHead: string | boolean,
    styleHasAbove: string | boolean,
    defaultLimbs: string | boolean,
    armClass: string | number;//"0"|"1"|"2"|"3" | 0|1|2|3,
    armGender: string;//: "M"|"F",
    armMutate: string | boolean,
    bypass?: { body: string, bicepR: string }
}

export type FactToGen = {
    alignment: 1 | 2 | string,
    symbol: number | string,
    symbolColor: string,
    back: number | string,
    backColor: string,
    flagColor: string,
}

class Generator {
    debug = false;

    constructor(public svg: SvgGen) {

    }

    async char(obj: CharToGen, storeInFileToo=true) {
        try {
            if (obj === undefined) throw Error("Object not passed.");

            const fileName = obj.charArm + "_" + obj.charAccnt + "_" + obj.charAccnt2 + "_" + obj.charPri + "_" + obj.charSec + "_" + obj.charSkin + "_" + obj.charHair + "_" + obj.charEye + "_" + obj.charClassId + "_" + obj.charHairS + "_" + obj.charGender;

            if (this.svg.cache.char[fileName] === true) return readFile(Config.cacheDirectory + "/chars/D_" + fileName + ".png");

            if (typeof obj["charArm"] === "string") obj["charArm"] = parseInt(obj["charArm"]);
            if (typeof obj["charHairS"] === "string") obj["charHairS"] = parseInt(obj["charHairS"]);
            if (typeof obj["noHead"] === "string") obj["noHead"] = (obj["noHead"] === "1");
            if (typeof obj["defaultLimbs"] === "string") obj["defaultLimbs"] = (obj["defaultLimbs"] === "1");
            if (typeof obj["armMutate"] === "string") obj["armMutate"] = (obj["armMutate"] === "1");
            if (typeof obj["styleHasAbove"] === "string") obj["styleHasAbove"] = (obj["styleHasAbove"] === "1");
            if (typeof obj["charClassId"] === "string") obj["charClassId"] = parseInt(obj["charClassId"]);
            if (typeof obj["armClass"] === "string") obj["armClass"] = parseInt(obj["armClass"]);

            // for easier autocorrect idk
            const colours = {
                eye: obj.charEye,
                primary: obj.charPri,
                secondary: obj.charSec,
                accent: obj.charAccnt,
                accent2: obj.charAccnt2,
                hair: obj.charHair,
                skin: obj.charSkin
            };

            let adjustedClassId = ClassBox.getAdjustedClassId(obj.charClassId);// > 3) ? obj.charClassId - 3 : obj.charClassId;
            let classPrefix = ["", "BH", "MC", "TM"];

            const prefix = obj.charArm == 1 || obj.defaultLimbs || obj.armMutate ? classPrefix[adjustedClassId] : obj.armClass == 0 ? "NC" : classPrefix[obj.armClass];
            let genderPrefix = (obj.charArm == 1 || obj.defaultLimbs || obj.armMutate ? obj.charGender : obj.armGender || " ") as string;
            genderPrefix = genderPrefix.length > 0 && genderPrefix != " " ? "_" + genderPrefix : "";

            const paths = {
                head: obj.noHead ? "" : "/heads/" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Head.svg",
                hair: "",
                body: "",
                bicep: "",
                above: ""
            };

            if (obj.noHead === false && obj.customHeadLink === "") {
                paths.hair = "/hairs/" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Hair_" + obj.charHairS + ".svg";

                if (!this.svg.list.hairs.includes(paths.hair.slice("/hairs/".length))) paths.hair = "/hairs/" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Hair_1.svg";

                if (obj.styleHasAbove === true) {
                    paths.above = "/hairs/" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Hair_" + obj.charHairS + "_Above.svg";

                    if (!this.svg.list.hairs.includes(paths.above.slice("/hairs/".length))) paths.above = "";
                    // yeah lmao no
                }
            };

            if (obj.customHeadLink !== "") {
                paths.hair = "";
                paths.head = "/hairs/" + obj.customHeadLink + ".svg"; // yes rip, it's in hairs folder

                if (!this.svg.list.hairs.includes(paths.head.slice("/hairs/".length))) paths.head = "";
            }

            if (obj.charArm) {
                paths.body = "/armors/" + (obj.defaultLimbs ? "NC" : prefix + genderPrefix) + "_Body_" + obj.charArm + ".svg";//ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Body_" + obj.charArm + ".svg";
                paths.bicep = "/bicepsR/" + prefix + genderPrefix + "_Bicep_R_" + obj.charArm + ".svg";//ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Bicep_R_" + obj.charArm + ".svg";
            }

            // cos i cba for leaderboard
            if (obj.bypass) {
                if (obj.bypass.body) paths.body = "/armors/" + obj.bypass.body + ".svg";
                if (obj.bypass.bicepR) paths.bicep = "/bicepsR/" + obj.bypass.bicepR + ".svg";
                // else if (obj.bypass.bicepR === null) paths.bicep = "/bicepsR/Basic_" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Bicep_R_1.svg";
            }

            // final check to see if in list
            // TODO: solve head/hair issue

            //if (obj.defaultLimbs == 1) paths.body = "/armors/NC_Body_" + obj.charArm + ".svg";

            if (paths.body && !this.svg.list.armors.includes(paths.body.slice("/armors/".length))) paths.body = "/armors/Basic_" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Body_1.svg";
            if (paths.bicep && (obj.defaultLimbs || !this.svg.list.bicepsR.includes(paths.bicep.slice("/bicepsR/".length)))) paths.bicep = "/bicepsR/Basic_" + ClassBox.getClassPrefixById(adjustedClassId) + "_" + obj.charGender + "_Bicep_R_1.svg";

            if (this.debug) console.log(paths);

            let proms = await Promise.all([
                paths.head !== "" ? readFile(Config.svgDir + paths.head) : null,
                paths.hair !== "" ? readFile(Config.svgDir + paths.hair) : null,
                paths.body !== "" ? readFile(Config.svgDir + paths.body) : null,
                paths.bicep !== "" ? readFile(Config.svgDir + paths.bicep) : null,
                paths.above !== "" ? readFile(Config.svgDir + paths.above) : null,
            ]);
    
            let xmls = [
                proms[0] === null ? null : this.svg["process"](proms[0] as Buffer, colours),
                proms[1] === null ? null : this.svg["process"](proms[1] as Buffer, colours),
                proms[2] === null ? null : this.svg["process"](proms[2] as Buffer, colours),
                proms[3] === null ? null : this.svg["process"](proms[3] as Buffer, colours),
                proms[4] === null ? null : this.svg["process"](proms[4] as Buffer, colours),
            ];
    
            if (this.debug) console.log(xmls);

            const width = Math.max(500, Math.round(xmls.reduce((a, b) => b === null ? a : b.bound.width + a, 0)));
            const height = Math.max(750, Math.round(xmls.reduce((a, b) => b === null ? a : b.bound.height + a, 0)));
    
            if (this.debug) console.log({ width, height });
    
            let composites = [];

            for (let x = 0; x < xmls.length; x++) {
                if (xmls[x] === null) continue;

                composites.push({
                    input: Buffer.from(this.svg.builder.build(xmls[x].xml)),

                    top: x === 0 || x === 1 || x === 4 ? Math.round(500 - xmls[x].bound.top - 85)
                        : x === 2 ? Math.round(500 - xmls[2].bound.top + 105)
                        : x === 3 ? Math.round(500 - xmls[3].bound.top + 25) : undefined, // throws an error if we've gone over the index
                    left: x === 0 || x === 1 || x === 4 ? Math.round((width / 2) - xmls[x].bound.left - 17)
                        : x === 2 ? Math.round((width / 2) - xmls[2].bound.left - 10)
                        : x === 3 ? Math.round((width / 2) - xmls[3].bound.left - 22) : undefined
                });
            }

            await sharp({
                create: {
                    width, height,
                    channels: 4, background: {
                        b: 0, g: 0, r: 0,
                        alpha: 0
                    }
                }
            }).composite(composites).toFile(Config.cacheDirectory + "/chars/" + fileName + ".png");

            return readFile(Config.cacheDirectory + "/chars/" + fileName + ".png")
                .then((v) => Jimp.create(v))
                .then((i) => {
                    // idek if they mutate to the same object lmao

                    let j = i.crop(
                        Math.max(0, Math.round((width / 2) - ((xmls[1] === null ? -10 : xmls[0]?.bound.left) || xmls[1]?.bound.left || 0) - 17 - 75)),
                        Math.max(0, Math.round(500 - ((xmls[1] === null ? 0 : xmls[0]?.bound.top) || 100) - 85 - 45)),
                        200, 200
                    ).flip(true, false)

                    const cl = j.clone();

                    const scale = 1 + 10 / Math.max(j.bitmap.width, j.bitmap.height);

                    cl.resize(j.bitmap.width * scale, j.bitmap.height * scale)
                        .color([{ apply: 'mix' as ColorActionName.MIX, params: [0x000000, 100] }]);

                    // cl.color([{ apply: "mix", params: [0x000000, 100] }]);

                    j = cl.blur(1).composite(j, 6, 6).crop(5, 5, 200, 200);

                    if (storeInFileToo) return j.writeAsync(Config.cacheDirectory + "/chars/D_" + fileName + ".png")
                    else return Promise.resolve(j);
                })
                .then((r) => {
                    if (storeInFileToo) this.svg.cache.char[fileName] = true;
                    return r.getBufferAsync(Jimp.MIME_PNG)
                })
                .catch(err => {
                    Logger.getLogger("SVG").error(err);
                    return readFile(Config.dataDir + "/misc/skull.png");
                });

        } catch (err) {
            if (err instanceof Error) {
                if (err.message === "Object not passed") throw err; // Rethrow anyways
                if (err.message !== "Error simulated") {
                    Logger.getLogger("SVG").debug(obj);
                    Logger.getLogger("SVG").error(err);
                }
            }
            return readFile(Config.dataDir + "/misc/skull.png");
        }
    }

    async fact(obj: FactToGen, storeInFileToo=true, hideFrame=false) {
        try {
            if (obj === undefined) throw Error("Object not passed.");

            const fileName = obj.alignment + "_" + obj.back + "_" + obj.backColor + "_" + obj.symbol + "_" + obj.symbolColor + "_" + obj.flagColor + "_" + (hideFrame ? 1 : 0);

            if (this.svg.cache.fact[fileName] === true) return readFile(Config.cacheDirectory + "/flags/D_" + fileName + ".png");

            if (typeof obj["alignment"] === "string") obj["alignment"] = parseInt(obj["alignment"]) as 1 | 2;
            if (typeof obj["symbol"] === "string") obj["symbol"] = parseInt(obj["symbol"]);
            if (typeof obj["back"] === "string") obj["back"] = parseInt(obj["back"]);

            if (!hideFrame && (obj["alignment"] < 1 || obj["alignment"] > 2)) throw Error("Alignment is not 1 or 2.");

            // for easier autocorrect idk
            const colours = {
                symbol: obj.symbolColor,
                back: obj.backColor,
                flag: obj.flagColor
            };

            let paths = {
                base: "/flag/base.svg",
                back: "/symbols/SymbolBack" + obj.back + ".svg",
                logo: "/symbols/SymbolLogo" + obj.symbol + ".svg",
                milk: "/flag/milky_overlay.svg",
                shadow: "/flag/shadow_overlay.svg",
            } as Record<string, string>;

            if (!hideFrame) paths["frame"] = "/flag/" + align[obj.alignment] + "_frame.svg";

            if (paths.logo && !this.svg.list.symbols.includes(paths.logo.slice("/symbols/".length))) paths.logo = "/symbols/1.svg";
            if (paths.back && !this.svg.list.symbols.includes(paths.back.slice("/symbols/".length))) paths.back = "/symbols/1.svg";

            if (this.debug) console.log(paths);

            let proms = await Promise.all(Object.values(paths).map(v => readFile(Config.svgDir + v)));

            let xmls = [
                this.svg["process"](proms[0] as Buffer, colours, colours.flag), // base
                this.svg["process"](proms[1] as Buffer, colours, colours.back), // back
                this.svg["process"](proms[2] as Buffer, colours, colours.symbol), // logo
                this.svg["process"](proms[3] as Buffer, colours, true), // milk
                this.svg["process"](proms[4] as Buffer, colours, true), // shadow
                // this.processSvg(proms[5], colours), // frame
            ];

            if (!hideFrame) xmls.push(this.svg["process"](proms[5], colours));

            if (this.debug) console.log(xmls);

            const width = Math.max(500, Math.round(xmls.reduce((a, b) => b === null ? 0 : b.bound.width + a, 0)));
            const height = Math.max(750, Math.round(xmls.reduce((a, b) => b === null ? 0 : b.bound.height + a, 0)));

            /**
             * @type {import("sharp").OverlayOptions[]}
             */
            let composites = [];

            for (let x = 0; x < xmls.length; x++) {
                if (xmls[x] === null) continue;

                // Those are empty back and logo respectively, literally empty so for ppl that just wants a blank flag...
                // Anyways since it's empty, there's no set width/height or smth so this would cause the sharp to throw errors.
                // Hence, continuing.
                
                // As of 2024-04-01, there'll be 2 equal instead of 3 for back/symbol cos of lbs
                if ((x === 1 && obj.back == 15) || (x === 2 && obj.symbol == 19)) continue;

                composites.push({
                    input: Buffer.from(this.svg.builder.build(xmls[x].xml)),

                    top : x === 0 ? Math.round(500 - xmls[x].bound.top)
                        : x === 1 || x === 2 ? Math.round(500 - xmls[x].bound.top + 10)
                        : x === 3 || x === 4 ? Math.round(500 - xmls[x].bound.top - 10)
                        : x === 5 ? Math.round(500 - xmls[x].bound.top - 65) : undefined,

                    left: x === 0 ? Math.round((width / 2) - xmls[x].bound.left)
                        : x === 1 || x === 2 ? Math.round((width / 2) - xmls[x].bound.left + 12)
                        : x === 3 ? Math.round((width / 2) - xmls[x].bound.left + 10)
                        : x === 4 ? Math.round((width / 2) - xmls[x].bound.left)
                        : x === 5 ? Math.round((width / 2) - xmls[x].bound.left - (obj.alignment === 1 ? 72 : 33)) : undefined,

                    blend: x === 1 || x === 2 ? "atop" : "over" as Blend
                });
            }

            await sharp({
                create: {
                    width, height,
                    channels: 4, background: {
                        b: 0, g: 0, r: 0,
                        alpha: 0
                    }
                }
            }).composite(composites).toFile(Config.cacheDirectory + "/flags/" + fileName + ".png");

            return readFile(Config.cacheDirectory + "/flags/" + fileName + ".png")
                .then((v) => Jimp.create(v))
                .then((i) => {
                    // idek if they mutate to the same object lmao
                    let j = i.autocrop(0);

                    if (hideFrame) j.crop(10, 10, 250, 260);

                    if (storeInFileToo) return j.writeAsync(Config.cacheDirectory + "/flags/D_" + fileName + ".png")
                    else return Promise.resolve(j);
                })
                .then((r) => {
                    if (storeInFileToo) this.svg.cache.fact[fileName] = true;
                    return r.getBufferAsync(Jimp.MIME_PNG)
                })
                .catch(err => {
                    Logger.getLogger("SVG").error(err);
                    return readFile(Config.dataDir + "/misc/skull.png");
                });
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === "Object not passed") throw err; // Rethrow anyways
                if (err.message !== "Error simulated") {
                    Logger.getLogger("SVG").debug(obj);
                    Logger.getLogger("SVG").error(err);
                }
            }
            return readFile(Config.dataDir + "/misc/skull.png");
        }
    }

    /**
     * @param storeThoseInFileToo This will store each individual flag or char.
     */
    async lb<T extends LeaderType>(type: T, obj: LeaderTypeToList[T][], storeThoseInFileToo=true) {
        const isFaction = Leader.Indexes.Faction.includes(type);//lazyFuck<CacheTypings.AnyFactionLeaders>(obj, Leader.Indexes.Faction, type)//Leader.Indexes.Faction.includes(type);

        const images = [] as Promise<Buffer>[];

        for (let x = 0; x < 5; x++) {
            const thing = obj[x];

            if (thing === undefined || !thing["misc"]) {
                images[x] = (readFile(Config.dataDir + "/misc/skull.png"));
                continue;
            }

            if (lazyFuck<CacheTypings.AnyPlayerLeaders>(thing, Leader.Indexes.Char, type)) {
                const armor = ItemSBox.getItemById(thing.misc.arm, true);
                const style = StyleBox.getStyleRecord(thing.misc.classId, thing.misc.hairS, thing.misc.gender as "M" | "F");//.objMap.find(v => v.styleIndex === char.misc.hairS && v.styleClassId === adj);

                if (armor == null || !armor.isArmorItemRecord() || !style) {
                    images[x] = (readFile(Config.dataDir + "/misc/skull.png"));
                    continue;
                }

                images[x] = this.char({
                    charAccnt: thing.misc.accnt,
                    charAccnt2: thing.misc.accnt2,
                    charArm: thing.misc.arm,
                    charClassId: thing.misc.classId,
                    charEye: thing.misc.eye,
                    charGender: thing.misc.gender as "M" | "F",
                    charHair: thing.misc.hair,
                    charHairS: thing.misc.hairS,
                    charPri: thing.misc.pri,
                    charSec: thing.misc.sec,
                    charSkin: thing.misc.skin,
                    customHeadLink: armor.customHeadLink,
                    noHead: armor.noHead,
                    bypass: {
                        body: armor.getAssetPool(thing.misc.classId, { g: thing.misc.gender }).body.slice("assets/armors/".length),
                        bicepR: armor.defaultLimbs ? null : armor.getAssetPool(thing.misc.classId, { g: thing.misc.gender }).bicepR.slice("assets/armors/".length)
                    },
                    styleHasAbove: style ? style.styleHasAbove : false,
                    armClass: armor.itemClass as 0 | 1 | 2 | 3,
                    armGender: armor.itemSexReq as "M" | "F",
                    armMutate: armor.itemLinkage === "Mutate",
                    defaultLimbs: armor.defaultLimbs,
                }, storeThoseInFileToo)
            } else if (lazyFuck<CacheTypings.AnyFactionLeaders>(thing, Leader.Indexes.Faction, type)) {
                images[x] = this.fact({
                    alignment: thing.misc.align === "Exile" ? 1 : 2,
                    back: thing.misc.back,
                    backColor: thing.misc.backClr,
                    flagColor: thing.misc.flagClr,
                    symbol: thing.misc.symb,
                    symbolColor: thing.misc.symbClr,
                }, storeThoseInFileToo, true);
            }
        }

        // let jimps:[JimpConstructors["prototype"][], JimpConstructors["prototype"][]] = [[], []];
        let jimps = [[], []] as [Promise<Jimp>[], Promise<Jimp>[]] | [Jimp[], Jimp[]];

        await Promise.all(images).then(v => {
            for (let i = 0, len = v.length; i < len; i++) {
                jimps[0][i] = Jimp.create(700, 200, "3b3b3b");
                jimps[1][i] = Jimp.create(v[i]);
            }
        });

        jimps = [
            await Promise.all(jimps[0]),
            await Promise.all(jimps[1]),
        ];
        
        const image = new Jimp([1, 2, 16, 3, 4, 17].includes(type) ? 1850 : 1800, 1145);

        if (images.length === 0) return image.getBufferAsync(Jimp.MIME_PNG);

        const bigfont = await Jimp.loadFont(Config.dataDir + "/assets/font/Bold_Verdana.fnt");
        const smolfont = await Jimp.loadFont(Config.dataDir + "/assets/font/Normal_Verdana.fnt");

        let text = ["1st", "2nd", "3rd", "4th", "5th"];

        const alignments:Array<[0|1|2, string]> = [];

        if (!isFaction) {
            const cloney = map(obj, v => v.name.toLowerCase());
            const charos = await DatabaseManager.cli.query<ICharacter & { faction_name?: string }>(`SELECT character.*, faction.name as faction_name FROM character JOIN faction ON character.faction_id = faction.id WHERE lower(character.name) IN (${quickDollars(obj.length)})`, cloney)
                .then(v => v.rows);

            if (charos.length) {
                for (let i = 0, len = charos.length; i < len; i++) {
                    const char = charos[i];
                    const index = findIndex(cloney, v => v === char.name.toLowerCase());

                    if (index !== -1 && char.alignment && char.faction_name) alignments[index] = [char.alignment, char.faction_name];
                }
            }
        }

        const scaffold = new Jimp(300, 50);//await Jimp.create(300, 50);

        for (let i = 0; i < 5; i++) {
            const thing = obj[i];

            if (thing === undefined || !thing["misc"]) {
                jimps[0][i].opacity(0.3);
    
                jimps[0][i].print(bigfont, 10, 15, `No ${isFaction ? "Faction" : "Character"}`);
                jimps[0][i].print(smolfont, 30, 45, text[i]);

                image.composite(jimps[0][i], 0, 25 + (i*225));
                continue;
            }

            jimps[0][i].opacity(0.3);

            jimps[0][i].composite(jimps[1][i].scale(0.8), 500, 0)

            jimps[0][i].print(bigfont, 10, 15, obj[i].name);
            jimps[0][i].print(smolfont, 30, 45, text[i]);

            if (lazyFuck<CacheTypings.AnyPlayerLeaders>(thing, Leader.Indexes.Char, type)) {
                jimps[0][i].print(smolfont, 30, 75, ClassBox.CLASS_NAME_BY_ID[thing.misc.classId]);
                jimps[0][i].print(smolfont, 30, 105, "Level " + thing.misc.lvl);
            } else if (lazyFuck<CacheTypings.AnyFactionLeaders>(thing, Leader.Indexes.Faction, type)) {
                jimps[0][i].print(smolfont, 30, 75, thing.misc.align);
            }

            // Yes, I have to make a bloody image because jimp dont just let you easily decide the colour of loaded font
            if (alignments[i] !== undefined) {
                const fontImg = scaffold.clone().print(smolfont, 0, 0, alignments[i][1]);
                fontImg.color([{ apply: ColorActionName.XOR, params: [alignments[i][0] === 1 ? "#cb6724" : "#16e19c"] }]);
                jimps[0][i].composite(fontImg, 30, 135);
            }

            image.composite(jimps[0][i], 0, 25 + (i*225));
        }

        // Battles

        let converters = {} as Record<string, (v: any) => string | number>;

        switch (type) {
            // 1v1/2v2/2v1 all time or dailies, including daily factions.
            case 1: case 2: case 16: case 3: case 4: case 17: case 5: case 6: case 18:
                converters = { "Wins": (v) => { return v.wins; }, "Total": (v) => { return v.bat }, "%": (v) => { return (Math.round((v.wins/v.bat) * 1000) / 10) + "%" } };
                
                if (!isFaction) converters["Lvl"] = quickLvl;
                break;
            // Faction All-Time champions
            case 8: case 9: case 19:
                converters = { "Leads": (v) => { return v.lead; }, "Alignment": (v) => { return v.misc?.align ?? ""; } };
                break;
            // I need to re-look at the specification
            case 7:
                converters = { "Doms": (v) => v.dom, "Alignment": (v) => { return v.misc?.align ?? ""; } };
                break;
            case 10:
                converters = { "Captures": (v) => v.cap, "Alignment": (v) => { return v.misc?.align ?? ""; } };
                break;
            case 11:
                converters = { "Influence": (v) => v.influence, "Level": quickLvl };
                break;
            case 12:
                converters = { "Influence": (v) => v.influence, "Alignment": (v) => { return v.misc?.align ?? ""; } };
                break;
            case 13:
                converters = { "Rarity Score": (v) => v.rarity, "Level": quickLvl };
                break;
            case 14: case 15:
                converters = { "Fame": (v) => v.fame, "Level": quickLvl };
                break;
            case 20: case 21:
                converters = { "Redeem": (v) => v.redeems, "Level": quickLvl };
                break;
            case 22:
                converters = { "Rating": (v) => v.rating, "Level": quickLvl };
                break;
            case 23:
                converters = { "Rank": (v) => v.rank };
                break;
        }

        image.print(bigfont, 800, 35, isFaction ? "Factions" : "Characters");

        const keys = Object.keys(converters);

        const extra:number[] = [];

        for (let x = 0; x < (keys.length - 1); x++) {
            // After a certain length of string, it will push the x for the next key to prevent collision.
            // It will also check for the first row's value for that column to see how much there is

            const key = keys[x];
            const converted = converters[key](obj[0]);
            const toStr = typeof converted === "string" ? converted : converted.toString();

            const lastKey = x === 0 ? 0 : extra[x - 1];

            if (key.length > 5 || toStr.length > 5) {
                extra.push(lastKey + Math.max(key.length, toStr.length));
            } else extra.push(0);
        }

        for (let x = 0; x < keys.length; x++) {
            image.print(bigfont, 1450 + (100*x) + (x === 0 ? 0 : 6 * extra[x - 1]), 35, keys[x]);
        }

        for (let i = 0; i < obj.length; i++) {
            image.print(smolfont, (i > 8) ? 745 : 760, 80 + (i*45), (i + 1) + ".");
            image.print(smolfont, 800, 80 + (i*45), obj[i].name);

            for (let x = 0; x < keys.length; x++) {
                image.print(smolfont, 1450 + (100*x) + (x === 0 ? 0 : 6 * extra[x - 1]), 80 + (i*45), converters[keys[x]](obj[i]));
            }
        }

        //image.print(font, 10, 10, "hi");
        return image.getBufferAsync(Jimp.MIME_PNG);
    }

    async lb20<T extends CharacterLeaderType>(lbType: T, obj: LeaderTypeToList[T][], arrangement:0|1=1, storeThoseInFileToo=true) {
        // const isFaction = Leader.Indexes.Faction.includes(lbType);//lazyFuck<CacheTypings.AnyFactionLeaders>(obj, Leader.Indexes.Faction, lbType)//Leader.Indexes.Faction.includes(lbType);

        const images = [] as Promise<Buffer>[];

        let users:CacheTypings.Player[] = [];

        for (let i = 0, len = obj.length; i < len; i++) {
            const thing = obj[i];
            let misc = thing["misc"];

            if (!thing) continue;
            if (!misc) {
                const cache = CacheManager.check("player", thing.name.toLowerCase());

                if (cache.valid) {
                    if (cache.value.type === 2) misc = cache.value.char;
                    else images[i] = getCharPageToImage(this, cache.value.char, users, i);
                } else images[i] = getCharPageToImage(this, thing.name, users, i);
                // images[i] = (readFile(Config.dataDir + "/misc/skull.png"));
                // continue;
                // continue;

                if (!misc) continue;
            }

            const armor = ItemSBox.getItemById(misc.arm, true);
            const style = StyleBox.getStyleRecord(misc.classId, misc.hairS, misc.gender as "M" | "F");//.objMap.find(v => v.styleIndex === char.misc.hairS && v.styleClassId === adj);

            if (armor == null || !armor.isArmorItemRecord() || !style) {
                images[i] = (readFile(Config.dataDir + "/misc/skull.png"));
                continue;
            }

            users[i] = { type: 2, char: misc };

            images[i] = this.char({
                charAccnt: misc.accnt,
                charAccnt2: misc.accnt2,
                charArm: misc.arm,
                charClassId: misc.classId,
                charEye: misc.eye,
                charGender: misc.gender as "M" | "F",
                charHair: misc.hair,
                charHairS: misc.hairS,
                charPri: misc.pri,
                charSec: misc.sec,
                charSkin: misc.skin,
                customHeadLink: armor.customHeadLink,
                noHead: armor.noHead,
                bypass: {
                    body: armor.getAssetPool(misc.classId, { g: misc.gender }).body.slice("assets/armors/".length),
                    bicepR: armor.defaultLimbs ? null : armor.getAssetPool(misc.classId, { g: misc.gender }).bicepR.slice("assets/armors/".length)
                },
                styleHasAbove: style ? style.styleHasAbove : false,
                armClass: armor.itemClass as 0 | 1 | 2 | 3,
                armGender: armor.itemSexReq as "M" | "F",
                armMutate: armor.itemLinkage === "Mutate",
                defaultLimbs: armor.defaultLimbs,
            }, storeThoseInFileToo)
        }

        // let jimps:[JimpConstructors["prototype"][], JimpConstructors["prototype"][]] = [[], []];
        let jimps = [[], []] as [Promise<Jimp>[], Promise<Jimp>[]] | [Jimp[], Jimp[]];

        await Promise.all(images).then(v => {
            for (let i = 0, len = v.length; i < len; i++) {
                jimps[0][i] = Jimp.create(700, 200, "3b3b3b");
                jimps[1][i] = Jimp.create(v[i]);
            }
        });

        jimps = [
            await Promise.all(jimps[0]),
            await Promise.all(jimps[1]),
        ];

        const arrangements = [[1475, 2275], [3650, 925]];

        const image = new Jimp(...arrangements[arrangement]);//arrangement ? ...[1600, 2400] : ...[]);

        if (images.length === 0) return image.getBufferAsync(Jimp.MIME_PNG);

        const bigfont = await Jimp.loadFont(Config.dataDir + "/assets/font/Bold_Verdana.fnt");
        const smolfont = await Jimp.loadFont(Config.dataDir + "/assets/font/Normal_Verdana.fnt");

        let text = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th"];

        const alignments:Array<[0|1|2, string]> = [];

        {
            const cloney = map(obj, v => v.name.toLowerCase());
            const charos = await DatabaseManager.cli.query<ICharacter & { faction_name?: string }>(`SELECT character.*, faction.name as faction_name FROM character JOIN faction ON character.faction_id = faction.id WHERE lower(character.name) IN (${quickDollars(obj.length)})`, cloney)
                .then(v => v.rows);

            if (charos.length) {
                for (let i = 0, len = charos.length; i < len; i++) {
                    const char = charos[i];
                    const index = findIndex(cloney, v => v === char.name.toLowerCase());

                    if (index !== -1 && char.alignment && char.faction_name) alignments[index] = [char.alignment, char.faction_name];
                }
            }
        }


        let converters = {} as Record<string, (v: any) => string | number>;
        let reversers = {} as Record<string, boolean>;

        switch (lbType) {
            // 1v1/2v2/2v1 all time or dailies, including daily factions.
            case 1: case 2: case 16: case 3: case 4: case 17:
                converters = { "wins": (v) => { return v.wins; }, "battles": (v) => { return v.bat }, "": (v) => { return (Math.round((v.wins/v.bat) * 1000) / 10) + "%" } };
                break;
            case 11:
                converters = { "influence": (v) => v.influence };
                break;
            case 13:
                converters = { "score": (v) => v.rarity };
                break;
            case 14: case 15:
                converters = { "fame": (v) => v.fame };
                break;
            case 20: case 21:
                converters = { "redeems": (v) => v.redeems };
                break;
            case 22:
                converters = { "RP": (v) => v.rating };
                break;
            case 23:
                converters = { "Rank": (v) => v.rank };
                reversers = { "Rank": true };
                break;
        }

        const keys = Object.keys(converters);
        const reversed = map(keys, v => reversers[v] === true);

        const scaffold = new Jimp(300, 50);//await Jimp.create(300, 50);

        for (let i = 0; i < 20; i++) {
            let user = users[i];

            if (user === undefined) {
                jimps[0][i].opacity(0.3);
    
                jimps[0][i].print(bigfont, 10, 15, `No Character`);
                jimps[0][i].print(smolfont, 30, 45, text[i]);

                image.composite(jimps[0][i], 0, 25 + (i*225));
                // continue;
            } else {
                jimps[0][i].opacity(0.3);

                jimps[0][i].composite(jimps[1][i].scale(0.8), 500, 0)

                jimps[0][i].print(bigfont, 10, 15, obj[i].name);
                jimps[0][i].print(smolfont, 30, 45, text[i]);

                jimps[0][i].print(smolfont, 30, 75, ClassBox.CLASS_NAME_BY_ID[user.type === 1 ? parseInt(user.char.charClassId) : user.char.classId]);
                jimps[0][i].print(smolfont, 30, 105, "Level " + (user.type === 1 ? user.char.charLvl : user.char.lvl));

                // Yes, I have to make a bloody image because jimp dont just let you easily decide the colour of loaded font
                if (alignments[i] !== undefined) {
                    const fontImg = scaffold.clone().print(smolfont, 0, 0, alignments[i][1]);
                    fontImg.color([{ apply: ColorActionName.XOR, params: [alignments[i][0] === 1 ? "#cb6724" : "#16e19c"] }]);
                    jimps[0][i].composite(fontImg, 30, 135);
                }

                for (let k = 0, ken = keys.length; k < ken; k++) {
                    // image.print(smolfont, 1450 + (100*x) + (x === 0 ? 0 : 6 * extra[x - 1]), 80 + (i*45), converters[keys[x]](obj[i]));
                    jimps[0][i].print(smolfont, 275, 45 + (30*k), reversed[k] ? (keys[k] + " " + converters[keys[k]](obj[i])) : (converters[keys[k]](obj[i]) + " " + keys[k]));
                }
            }

            // arrangement: 0
            // 1 - 25, 25
            // 2 - 750, 25
            // 3 - 25, 250
            // 4 - 750, 250
            // 5 - 25, 475

            // arrangement: 1
            // 1 - 25, 25
            // 2 - 750, 25
            // 3 - 1475, 25
            // 4 - 2200, 25
            // 5 - 2925, 25
            // 6 - 25, 250

            if (arrangement === 0)      image.composite(jimps[0][i], i % 2 === 0 ? 25 : 750, 25 + (Math.floor(i/2) * 225));//25 + (i > 9 ? 725 : 0), 25 + (i > 9 ? ((i-10)*225) : (i*225)));
            else if (arrangement === 1) image.composite(jimps[0][i], 25 + ((i % 5) * 725), 25 + (Math.floor(i/5) * 225));

            // image.composite(jimps[0][i], 25 + (i > 9 ? 725 : 0), 25 + (i > 9 ? ((i-10)*225) : (i*225)));
        }

        //image.print(font, 10, 10, "hi");
        return image.getBufferAsync(Jimp.MIME_PNG);
    }
}

async function getCharPageToImage(gen: Generator, charPage: CharPage, user: CacheTypings.Player[], index: number) : Promise<Buffer>;
async function getCharPageToImage(gen: Generator, name: string | CharPage, user: CacheTypings.Player[], index: number) : Promise<Buffer>;
async function getCharPageToImage(gen: Generator, name: string | CharPage, user: CacheTypings.Player[], index: number) : Promise<Buffer> {
    let charPg = name;

    if (typeof charPg === "string") {
        let res = await getCharPage(charPg);

        if (!res.success) return readFile(Config.dataDir + "/misc/skull.png");

        charPg = res.result;
    }

    user[index] = { type: 1, char: charPg };

    return gen.char(charPg);
}