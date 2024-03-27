import type { MapStateRule } from "./MapStateRule.js";

export const MapObject =  {
    FACTION_ALIGN_FLAG: "CLASS_FactionAlignFlag",
    WAR_HERO_BOARD_LOADER_EXILE: "CLASS_WarHeroBoardLoaderExile",
    WAR_HERO_BOARD_LOADER_LEGION: "CLASS_WarHeroBoardLoaderLegion",
    WAR_HERO_BOARD_LOADER: "CLASS_WarHeroBoardLoader",
    HOME_NAME_LOADER: "CLASS_HomeNameLoader",
    HQ_FLAG: "CLASS_HQ_Flag",
    WAR_OBJECTIVE: "CLASS_WarObjective",
    ITEM_LOADER: "CLASS_ItemLoader",
    CLASS_WAR_LEADERS_LEGION: "CLASS_WarLeadersLegion",
    CLASS_WAR_LEADERS_EXILE: "CLASS_WarLeadersExile",
} as const;

export default class MapObjectGroup {
    stateRules: MapStateRule[];

    constructor(public prefix: string, ...stateRules: MapStateRule[]) {
        this.stateRules = stateRules;
    }

    getStateRule(state: number) {
        for (let i = 0, len = this.stateRules.length; i < len; i++) {
            if (this.stateRules[i].state === state) {
                return this.stateRules[i];
            }
        }

        return undefined;
    }
}
