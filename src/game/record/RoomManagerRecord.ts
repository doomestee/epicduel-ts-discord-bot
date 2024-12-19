import { MapItemRuleSet } from "./map/MapItem.js";
import { MapStateRuleSet } from "./map/MapStateRule.js";

export default class RoomManagerRecord {
    roomName: string;
    version: number;
    coords: [number, number];
    merchants: number[];
    regionId: number;
    permissions: [number, number, number, number];
    objectiveId: number;
    backgroundSet: string[];
    mapStateRuleSet: MapStateRuleSet | null;
    mapItemRuleSet: MapItemRuleSet | null;

    constructor(roomName: string, version: number, coords: [number, number], merchants: number[], regionId: number, permissions: [number, number, number, number], objectiveId: number, backgroundSet: string[], mapStateRuleSet: MapStateRuleSet | null, mapItemRuleSet: MapItemRuleSet | null) {
        this.roomName = roomName;
        this.version = version;
        this.coords = coords;//new Point(coords[0],coords[1]);
        this.merchants = merchants;
        this.regionId = regionId;
        this.permissions = permissions;
        this.objectiveId = objectiveId;
        this.backgroundSet = backgroundSet;
        this.mapStateRuleSet = mapStateRuleSet;
        this.mapItemRuleSet = mapItemRuleSet;
    }

    get levelRequired() {
        return this.permissions[0];
    }

    get alignmentRequired() {
        return this.permissions[1];
    }

    get jumpDisabled() {
        return this.permissions[2] == 1;
    }

    get saveDisabled() {
        return this.permissions[3] == 1;
    }

    isHome() {
        return this.roomName.includes("HOME");
    }

    isHQ() {
        return this.roomName.includes("FACT");
    }

    isHomeOrHQ() {
        return this.isHome() || this.isHQ();
    }
}