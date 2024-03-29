import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import BaseModule from "./Base.js";

interface IFriend {
    id: number, label: string, charName: string, data: number, isOnline: boolean, sfsUserId: number, mute: boolean, linked: boolean
}

export default class Buddy extends BaseModule {
    list:IFriend[] = [];

    constructor(public client: Client) {
        super();
    }

    /**
     * @param {number|{charId: number, sfsUserId: number, charName: string}} obj If number, will be used to check against charId or sfsUserId, but sent as sfsUserId.
     */
    addBuddy(obj: number | { charId: number, sfsUserId: number }) {
        if (this.list.length >= this.client.user._buddyListSize) return { type: -1 };

        // { charId, sfsUserId, charName })
        if (typeof obj === "number") {
            if (this.list.some(v => v.id === obj || v.sfsUserId === obj)) return;
        } else {
            if (obj.charId && this.list.some(v => v.id === obj.charId)) return { type: -2 };
        }
        // TODO: return error if target is mod

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_FRIEND_REQUEST, { targetId: (typeof obj === "number") ? obj : obj.sfsUserId }, 2, "json");
    }

    addFriendToList(charId: number, charName: string, sfsUserId: number, showMsg=true, isMuted=false) {
        this.list.push({
            id: charId,
            label: charName,
            charName: charName,
            data: charId,
            isOnline: sfsUserId != 1,
            sfsUserId: sfsUserId,
            mute: isMuted,
            linked: false,
        });

        if (showMsg) console.log("Friend's been added: " + charName);
    }

    sonar(charId: number) {
        let buddy = this.list.find(v => v.id === charId);

        if (buddy === undefined) return { type: -1}; // Curse you Roman/Ginger for making sonar the most dangerous command to use

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_BUDDY_SONAR, { my: 0, sfsUserId: buddy.sfsUserId, cNm: buddy.charName }, 1, "json");
    }
  
    friendStatusChange(charId: number, isOnline: boolean, sfsUserId: number, link=false, isMuted=false) {
        let friendIndex = this.list.findIndex(v => v.id === charId);

        if (friendIndex === -1) return;

        if (link) {
            this.list[friendIndex].linked = true;
            this.client.user._allySfsId = sfsUserId;
            this.client.user._allyCharId = charId;
            console.log("Linked successfully");
        }

        this.list[friendIndex].isOnline = isOnline;
        this.list[friendIndex].sfsUserId = sfsUserId;
        this.list[friendIndex].mute = isMuted;

        // if (this.client.manager.discord) this.client.manager.discord.emit("epicduel_friend_status", { charId, isOnline, sfsUserId, link, isMuted });
    }

    /**
     * @param {string[]} rawData 
     */
    friendDataAvailable(rawData: string[]) {
        this.list = [];
        
        let friendData = rawData.slice(3);

        for (let i = 0; i < friendData.length / 4; i++) {
            this.addFriendToList(parseInt(friendData[0 + 4 * i]), friendData[1 + 4 * i], parseInt(friendData[2 + 4 * i]), false, Boolean(parseInt(friendData[3 + 4 * i])))
        }
    }

    friendNameChange(charId: number, newName='') {
        let friendIndex = this.list.findIndex(v => v.id === charId);

        if (friendIndex === -1) return;

        this.list[friendIndex].charName = newName;
        this.list[friendIndex].label = newName;
    }

    removeFriendResponse(charId: number, notify=false) {
        let friendIndex = this.list.findIndex(v => v.id === charId);

        if (friendIndex === -1) return;

        // this.unlinkAllyByCharId(charId);

        if (notify) console.log("Removed friendship with " + this.list.find(v => v.id === charId)?.charName);

        this.list.splice(friendIndex, 1);
    }

    removeFriend(charId: number) {
        if (this.list.length < 1) return { type: -1 };

        if (!this.list.some(v => v.id === charId)) return { type: -2 };

        let friend = this.list.find(v => v.id === charId);

        if (!friend) throw Error("friend not exist in list: " + charId);

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_REMOVE_FRIEND, { charId: (charId), charName: friend.charName }, 1, "json");
        
        return { type: 1 };
    }

    /**
     * @param {number} charId
     * @param {boolean} bypassRestrictions NOTE this will not bypass internal friend check, due to risk of permaban. If typeof number, will be used for sfsUserId. Restrictions still will not be bypassed.
     * @returns 
     */
    createPMChat(charId: number, bypassRestrictions=false) {
        if (charId === -1) return { type: -1, v: 'really' };
        //if (!this.list.some(v => v.id === charId)) return { type: -2 };

        let buddy = (typeof bypassRestrictions === "number") ? this.list.find(v => v.sfsUserId === charId) : this.list.find(v => v.id == charId);
        
        if (!buddy) return { type: -2, v: 'Fake buddy' };
        if (!bypassRestrictions && !buddy.isOnline) return { type: -3, v: "Offline" };

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_PM_REQUEST, { targetId: buddy.sfsUserId }, 2, "json");
    }
  
    acceptBuddyRequest(sfsUserId: number, skipRestrictions=false) {
        if (!skipRestrictions && this.list.length >= this.client.user._buddyListSize) throw Error("Buddy list full.");

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_FRIEND_ACCEPT, { sfsUserId }, 2, "json");
    }

    jumpToBuddyRequest(charId: number) {
        if (this.list.length < 1) return { type: -1, v: "maidenless" };

        let buddy = this.list.find(v => v.sfsUserId === charId) || this.list.find(v => v.id == charId);

        if (buddy == null) return { type: -2, v: "unknown friend" };
        if (!buddy.isOnline) return { type: -3, v: "offline" };

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_JUMP_TO_BUDDY, { targetId: buddy.sfsUserId }, 1, "json");
    }
}