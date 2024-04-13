import { Requests } from "../Constants.js";
import type Chat from "../module/Chat.js";

export default class ActiveChat {
    userId: number;
    pmCount: number = 0;
    messages: string[] = [];
    charName: string;

    // module: Chat;

    module?: Chat;

    constructor(charName: string, userId: number, module: Chat) {
        this.charName = charName;
        this.userId = userId;

        this.module = module;
    }

    resetCount() {
        this.pmCount = 0;
    }

    /**
     * @param {[string, string]} msg list of name and content
     */
    appendMsg(msg: [string, string]) {
        console.log(msg[0] + ": " + msg[1]);
        this.messages.push(msg[0] + ": " + msg[1]);
    }

    sendPM(msg: string, bypassRestrictions=false) {
        if (msg == "") return { type: -1 };

        if (!this.module) return { type: -5 };

        let msgLower = msg.toLowerCase();

        let lower = {
            msg: msg.toLowerCase(),
            pass: this.module.client.user.password.toLowerCase(),
            user: this.module.client.user.username.toLowerCase(),
        };

        if (!bypassRestrictions && lower.msg.indexOf(lower.pass) !== -1) return { type: -2, extra: "Similar password." };
        if (!bypassRestrictions && lower.msg.indexOf(lower.user) !== -1) return { type: -2, extra: "Similar username/email." };
        if (!bypassRestrictions && lower.msg.indexOf("password") !== -1 || lower.msg.indexOf("pass word") !== -1) return { type: -3, extra: "Talking about 'Password'"};
        if (!bypassRestrictions/* && !LanguageFilter.messageIsClean(msg)*/) return { type: -4, extra: "Language filter."};
        if (!bypassRestrictions/* && !LanguageFilter.messageHasNoRestrictions(msg)*/) return { type: -4, extra: "Wrong topic stuff"};

        let newTrimMsg = msg.trim();

        this.module.client.smartFox.sendXtMessage("main", Requests.REQUEST_SEND_PM, { msg: newTrimMsg , uId: this.userId }, 2, "json");
        this.appendMsg([this.module.client.getMyUserFr().charName, newTrimMsg]);
        this.module.client.swarm.execute("onPrivateMessage", this.module.client, { message: newTrimMsg, userId: this.userId, userName: this.charName, isFromMe: true });
        // this.module.client.manager.discord.emit("epicduel_private_chat", newTrimMsg, -1, [this.charName, this.userId]);
    }

    terminate() {
        // this.module.client.smartFox.sendXtMessage("main", Requests.REQUEST_PM_CANCEL, { targetId: this.userId }, 2, "json");
        // delete this.module;
        // delete this;
    }
}