import SwarmResources from "../../util/game/SwarmResources.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import BaseModule from "./Base.js";
import RoomManager from "./RoomManager.js";

export default class MapModule extends BaseModule {
    _merchantBlackList = [298,288,53,81,125,182,183,191,194,216,229,259,264,266,296,297,299,301,306,307,308,310,311,313,220,214,37,327,328,330,331,332,334,338,339,340,346,345,342];
    _worldSwitchTime = -999999;

    regions = {
        afterlife: { id: RoomManager.REGION_AFTERLIFE_ID, name: RoomManager.REGION_AFTERLIFE, desc: "A realm beyond life and death, and home to many dark secrets. Tread carefully." },
        biological_preserve: { id: RoomManager.REGION_BIOLOGICAL_PRESERVE_ID, name: RoomManager.REGION_BIOLOGICAL_PRESERVE, desc: "Only the bravest adventurers dare to confront the deadly creatures within this refuge for organic life." },
        barrens_outpost: { id: RoomManager.REGION_BARRENS_OUTPOST_ID, name: RoomManager.REGION_BARRENS_OUTPOST, desc: "Irradiated desert home to Marauders, bandits, and merchants. Littered with wreckage from Legion and Exile warships." },
        central_station: { id: RoomManager.REGION_CENTRAL_STATION_ID, name: RoomManager.REGION_CENTRAL_STATION, desc: "Once a prosperous Train Hub, it is now a derelict monument to Delta V\'s former glory." },
        dread_plains: { id: RoomManager.REGION_DREAD_PLAINS_ID, name: RoomManager.REGION_DREAD_PLAINS, desc: "War-torn Legion and Exile battleground that\'s home to the mysterious and powerful Control Array." },
        frysteland: { id: RoomManager.REGION_FRYSTELAND_ID, name: RoomManager.REGION_FRYSTELAND, desc: "Frigid Northern island that\'s home to the native Krampus people and the demi-god Titan." },
        fortune_city: { id: RoomManager.REGION_FORTUNE_CITY_ID, name: RoomManager.REGION_FORTUNE_CITY, desc: "Commercial hub of Delta V and the seat of Baelius\' power. Many merchants can be found here." },
        infernal_mines: { id: RoomManager.REGION_INFERNAL_MINES_ID, name: RoomManager.REGION_INFERNAL_MINES, desc: "Abandoned Varium mines populated by mechanical insectoid workers called Mechachillids." },
        overlord_facility: { id: RoomManager.REGION_OVERLORD_FACILITY_ID, name: RoomManager.REGION_OVERLORD_FACILITY, desc: "Few guards still defend this defunct outpost, but its massive armory is still ready for use." },
        wasteland: { id: RoomManager.REGION_WASTELAND_ID, name: RoomManager.REGION_WASTELAND, desc: "Sand-blasted desert created by Baelius\' strip mining operations. Home to The Lawman." },
        west_naval_yard: { id: RoomManager.REGION_WEST_NAVAL_YARD_ID, name: RoomManager.REGION_WEST_NAVAL_YARD, desc: "No ships travel the polluted seas. Only the craziest Delta V inhabitants still call this marina home." },
    };

    readonly regionNameMappedById = [undefined, RoomManager.REGION_FORTUNE_CITY, RoomManager.REGION_CENTRAL_STATION, RoomManager.REGION_WEST_NAVAL_YARD, RoomManager.REGION_OVERLORD_FACILITY, RoomManager.REGION_BIOLOGICAL_PRESERVE, RoomManager.REGION_BARRENS_OUTPOST, RoomManager.REGION_WASTELAND, RoomManager.REGION_FRYSTELAND, RoomManager.REGION_INFERNAL_MINES, RoomManager.REGION_DREAD_PLAINS, undefined, RoomManager.REGION_AFTERLIFE] as const;

    constructor(public client: Client) {
        super();
    }

    instanceChangeHandler(worldId: number) {
        // if (this.client.user._myAvatar != null) {
            this.client.smartFox.sendXtMessage("main", Requests.REQUEST_JOIN_WORLD, { inst: worldId }, 1, "json");
        // }
    }

    joinSavedInstance() {
        // if (this.client.user._myAvatar == null) return;
        // let currentRoom = this.client.smartFox.getActiveRoom();
        
        // if (currentRoom == null) return;
        
        // this.client.user._worldIndex = this._savedInstance;

        // let [roomIsHome, roomIsHQ] = [RoomManager.roomIsHome(roomName), RoomManager.roomIsHQ(roomName)];
        // if (roomIsHome || roomIsHQ) { return; }
        // else {
        //     this.client.user._arrivalX = this.client.user._myAvatar.x || 450;
        //     this.client.user._arrivalY = this.client.user._myAvatar.y || 450;
        //     this.client.user._warpIn = true;
        //     this.client.joinRoom(this.client.user._currentRoomBaseName + "_" + this.client.user._worldIndex);
        // }
    }

    joinWorldFailed() {
        console.log(SwarmResources.languages["DYN_map_err_worldFull"])
    }

    saveLocation() {
        let [fullName, fileName] = [this.client.user._currentRoomFullName, this.client.user._currentRoomFileName];
        let roomRecord = RoomManager.getRoomRecord(fileName);

        if (RoomManager.roomIsHQ(fileName)) return console.log("Room is HQ.");
        if (RoomManager.roomIsHome(fileName) && !this.client.isHomeMine(fullName)) return console.log("Room is not your home.");
        if (roomRecord != null && roomRecord.saveDisabled) console.log("Room forbids saving to.");

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_SAVE_LOCATION, {}, 1, "json");
        console.log("Saving location!");
        this.client.user._startRoom = fileName;
    }

    travelHandler(roomName: string) {
        let currentRoom = this.client.smartFox.getActiveRoomFr();
        let currentRoomName = currentRoom.getName();
        let fileName = RoomManager.getRoomFileName(currentRoomName);

        if (fileName != roomName) this.client.jumpToRoomConfirm(roomName + "_" + this.client.user._worldIndex, this.client.user._worldIndex)
        else console.log("Already there!");
    }
}