import WarObjectiveStaticRecord from "../record/war/ObjectiveRecord.js";
import WarRegionRecord from "../record/war/RegionRecord.js";
import { SharedMultipleBox } from "./SharedBox.js";

export default class WarSMBox extends SharedMultipleBox<{ objective: WarObjectiveStaticRecord, region: WarRegionRecord }> {
    constructor() {
        super({
            objective: ["objectiveId", "regionId", "isMainObj", "objTitle", "objType", "objStates", "objDesc"],
            region: ["regionId", "warTitle", "warDesc", "defenseObjAction", "offenseObjAction", "defenseUnit", "offenseUnit", "defenseItemId", "defenseSuperItemId", "offenseItemId", "offenseSuperItemId", "defenseVictory", "offenseVictory", "defenseNotification", "offenseNotification"],
        }, {
            objective: null,
            region: null
        });
    }

    /**
     * Region
     * @param {number} id
     */
    getRegionById(id: number) {
        return this.objMap.region.get(id) ?? null;
    }

    /**
     * Objectives
     * @param {number} id
     */
    getObjectiveById(id: number) {
        return this.objMap.objective.get(id) ?? null;
        // for (let record of this.objList.objectives) {
        //     if (record.objectiveId == id) {
        //         return result;
        //     }
        // }

        // return null;
    }

    /**
     * Objectives
     * @param {number} id
     */
    getObjectivesByRegionId(id: number | string) {
        const list = this.objMap.objective.toArray();
        const result: WarObjectiveStaticRecord[] = [];

        for (let i = 0, len = list.length; i < len; i++) {
            if (list[i].regionId == id) result.push(list[i]);
        }

        return result;
    }

    /**
     * Objectives
     * @param {number} id
     */
    getMainObjectiveByRegionId(id: number | string) {
        const list = this.objMap.objective.toArray();
        const result: WarObjectiveStaticRecord[] = [];

        for (let i = 0, len = list.length; i < len; i++) {
            if (list[i].regionId == id && list[i].isMainObj) return list[i];
        }

        return null;
    }
}