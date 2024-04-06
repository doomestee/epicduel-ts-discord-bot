import { Collection } from "oceanic.js";
import StyleRecord from "../record/StyleRecord.js";
import ClassBox from "./ClassBox.js";
import type Client from "../Proximus.js";
import { Requests } from "../Constants.js";

const objMap = new Collection<number, StyleRecord>();

export default class StyleBox {
    objMap = new Collection<number, StyleRecord>();
    
    static get objMap() {
        return objMap;
    }

    ready = false;
    _gotOwnedHairStyles = -1;

    templates = ["styleId", "styleClassId", "styleGender", "styleIndex", "styleCredits", "styleVarium", "styleHasAbove"];

    populate(list: string[]) {
        let i = 0;
        this.objMap.clear();

        while (i < (list.length / this.templates.length)) {
            let y = 0; let obj = {} as any;

            while (y < (this.templates.length)) {
                obj[this.templates[y]] = list[y + i * this.templates.length];
                y++;
            }

            let rec = new StyleRecord(obj);

            this.objMap.set(rec.styleId, rec);
            objMap.set(rec.styleId, rec);
            i++;
        }

        this.ready = true;
    }

    /**
     * @param {number} classId If this is the only parameter given, it will be used as the style ID.
     * @param {number} styleIndex
     * @param {"M"|"F"} gender
     * @returns 
     */
    getStyleRecord(classId: number) : StyleRecord | null;
    getStyleRecord(classId: number, styleIndex: number, gender: "M" | "F") : StyleRecord | null;
    getStyleRecord(classId: number, styleIndex?: number, gender?: "M" | "F")  : StyleRecord | null {
        const adjusted = ClassBox.getAdjustedClassId(classId);

        const list = this.objMap.toArray();

        for (let i = 0; i < list.length; i++) {
            let style = list[i];

            if ((styleIndex === undefined  &&  style.styleId === classId) || (style.styleClassId === adjusted  &&  style.styleIndex === styleIndex  &&  style.styleGender === gender)) {
                return style;
            }
        }

        return null;
    }

    /**
     * @param {number} classId If this is the only parameter given, it will be used as the style ID.
     * @param {number} styleIndex
     * @param {"M"|"F"} gender
     * @returns 
     */
    static getStyleRecord(classId: number) : StyleRecord | null;
    static getStyleRecord(classId: number, styleIndex: number, gender: "M" | "F") : StyleRecord | null;
    static getStyleRecord(classId: number, styleIndex?: number, gender?: "M" | "F")  : StyleRecord | null {
        const adjusted = ClassBox.getAdjustedClassId(classId);

        const list = this.objMap.toArray();

        for (let i = 0; i < list.length; i++) {
            let style = list[i];

            if ((styleIndex === undefined  &&  style.styleId === classId) || (style.styleClassId === adjusted  &&  style.styleIndex === styleIndex  &&  style.styleGender === gender)) {
                return style;
            }
        }

        return null;
    }

    /**
     * This doesn't return the list of owned styles!
     * Boolean returned means whether if the hair styles were already fetched or not.
     * @param cli 
     * @returns 
     */
    getOwnedHairStyles(cli: Client) {
        const user = cli.getMyUser();


        if (user && this._gotOwnedHairStyles !== user.charClassId) {
            cli.smartFox.sendXtMessage("main", Requests.REQUEST_GET_OWNED_HAIR_STYLES, {}, 1, "json");
            this._gotOwnedHairStyles = user.charClassId;

            return false;
        } return true;
    }

    storeOwnedHairStyles(data: string[]) {
        const styles = data.slice(3);

        for (let i = 0; i < styles.length; i++) {
            this.markHairAsOwned(parseInt(styles[i]));
        }

        // if (!(data[2] === "true"))
    }

    /**
     * @param {number} styleId
     */
    markHairAsOwned(styleId: number) {
        const style = this.objMap.get(styleId);
        
        if (style) style.owned = true;
    }
}