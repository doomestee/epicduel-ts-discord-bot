import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import HomeRecord from "../record/HomeRecord.js";
import HomeRow from "../record/HomeRow.js";
import BaseModule from "./Base.js";
import RoomManager from "./RoomManager.js";

export default class Homes extends BaseModule {

    homeList = {
        homeData: [] as string[],
        list: [] as HomeRow[]
    }

    /**
     * Used to identify what was bought
     */
    protected homeId = -1;

    protected _activeOwnerChar: string = "";
    protected _activeOwnerCharId: number = -1;

    constructor(public client: Client) {
        super();
    }


    setHomeArrivalCoordinates() {
        this.client.user._arrivalX = Math.ceil(Math.random() * 200) + 120;
        this.client.user._arrivalY = Math.ceil(Math.random() * 120) + 380;
    }

    /**
     * DEFUNCT! DON'T USE!
     * @param {{homeIds: any[], perms: any}} objs 
     */
    savePermission(objs: {homeIds: any[], perms: any}) {
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_UPDATE_HOME_PERMISSION, objs, 1, "json");
    }
      
    userOwnsHome(homeId: number | string) {
        if (!this.homeList.homeData.length) {
            return false;
        }

        homeId = String(homeId);

        for (let h = 0; h < this.homeList.homeData.length; h += 2) {
            if (this.homeList.homeData[h] === homeId) return true;
        } return false;
    }

    /**
     * @param {number} id
     * @param {0|1|2} buyMode 0 is for free, 1 is credits, 2 is varium. 
     */
    buyHome(id: 0 | 1 | 2, buyMode: number) {
        let homeItem = this.client.boxes.home.getHomeById(id);

        if (homeItem == null) throw Error("Unknown home ID.");

        if (this.userOwnsHome(homeItem.homeId)) {
            return [-1, "Home already owned."];
        }

        if (buyMode === 1 && this.client.currency.credits < homeItem.homeCredits) {
            return [-2, "Insufficient credits.", [this.client.currency.credits, homeItem.homeCredits]];
        } else if (buyMode === 2 && this.client.currency.varium < homeItem.homeVarium) {
            return [-2, "Insufficient varium.", [this.client.currency.varium, homeItem.homeVarium]]
        } else if (buyMode < 0 && buyMode > 2) {
            return [-3, "Unknown buy mode."];
        }

        let buy = {
            homeId: homeItem.homeId,
            mode: buyMode
        }

        this.homeId = homeItem.homeId;

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_BUY_HOME, buy, 1, "json");
        return [1, "Being bought."];
    }

    buyHomeComplete(data: any) {
        let mode = parseInt(data.mode);
        let homeRecord = this.client.boxes.home.getHomeById(this.homeId);

        if (!homeRecord) throw Error("Unknown home, ID: " + this.homeId);

        if (Boolean(data.saleFail)) {
            console.log(this.client.swarm.languages["DYN_home_err_buyFail"]); return;
        } if (Boolean(data.noSale)) {
            console.log(this.client.swarm.languages["DYN_home_err_noMeetReqs"]); return;
        }

        if (mode === 1) {
            this.client.currency.credits -= homeRecord.homeCredits;
        } else if (mode === 2) {
            this.client.currency.varium -= homeRecord.homeVarium;
        }

        this.homeList.homeData = [];
        console.log("Bought/redeemed home!");
        this.search(this.client.getMyUserFr().charName);
    }

    /**
     * @param {string[]} homeData 
     * @param {number} charId parseInt pls
     * @param {string} charName 
     */
    homeDataAvailable(homeData: string[], charId: number, charName: string) {
        this.homeList.list = [];
        for (let h = 0; h < homeData.length; h += 2) {
            this.homeList.list.push(new HomeRow(this.client.boxes.home.getHomeById(parseInt(homeData[h])) as HomeRecord, charId, parseInt(homeData[h + 1]), this.client));
        }
        if (this.homeList.list.length > 0) {
            if (this.client.user._myCharId == charId) {
                this.homeList.homeData = homeData;
            }
        }

        this._activeOwnerChar = charName;
        this._activeOwnerCharId = charId;

        // if (this.client.manager.homeJump && charId == this.client.user._myCharId) {
        //     this.client.manager.homeJump = false;
        //     this.visitHome(8);
        // }
    }

    search(charName: string) {
        let myUser = this.client.getMyUser();

        if (!myUser) throw Error("getmyuser returned nullish.");

        if (charName.toLowerCase() === myUser.charName.toLowerCase()) {
            if (this.homeList.homeData != null) {
                this.homeDataAvailable(this.homeList.homeData, myUser.charId, myUser.charName);
            } else {
                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MY_HOMES, {}, 1, "json");
            }
        } else if (charName.length > 0) {
            this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_CHARACTER_HOMES, {charName}, 1, "json");
        }
    }

    /**
     * @param {number} homeId
     * @param {number} charId
     */
    visitHome(homeId: number, charId: number) {
        let homeRecord = this.client.boxes.home.getHomeById(homeId);

        if (!homeRecord) throw Error("unknown id: " + homeId);

        let currentRoom = this.client.smartFox.getActiveRoomFr();
        let roomName = currentRoom.getName();

        if (RoomManager.roomIsHome(roomName)) {
            let roomParts = roomName.split("_");
            
            if (parseInt(roomParts[1]) == homeRecord.homeId && parseInt(roomParts[3]) == this._activeOwnerCharId) {
                return [-1, "Already there"];
            }
        }

        if (!RoomManager.roomIsHome(roomName) && !RoomManager.roomIsHQ(roomName)) {
            this.client.user._returnFromHomeRoomName = roomName;
            //this.client.user._returnFromHomeX = this.client.user._myAvatar['x'];
            //this.client.user._returnFromHomeY = this.client.user._myAvatar['y'];
        }

        let home = {
            currRoomId: currentRoom.getId(),
            style: homeRecord.homeId,
            room: 1,
            charId: this._activeOwnerCharId || charId || this.client.user._myCharId,
            warp: true
        };

        this.setHomeArrivalCoordinates();
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_FIND_OR_CREATE_HOME, home, 3, "json");
    }
}