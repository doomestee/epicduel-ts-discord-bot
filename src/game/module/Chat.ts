import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import ActiveChat from "../record/ActiveChat.js";
import BaseModule from "./Base.js";

export default class Chat extends BaseModule {
    list: ActiveChat[] = [];

    constructor(public client: Client) {
        super();
    }

    acceptDialogue(tgtId: number, charName: string) {
        let loc22 = new ActiveChat(charName, tgtId, this);
        this.list.push(loc22);

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_PM_CONFIRM, { targetId: tgtId }, 2, "json");
    }

    /**
     * @param str no validation so.
     */
    sendPublicChat(str: string) {
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_PUBLIC_CHAT, { msg: str }, 3, "json")
    }

    selfDestruct() {
        for (let i = 0; i < this.list.length; i++) {
            delete this.list[i].module;
            delete this.list[i];

            //@ts-expect-error
            this.list[i] = null;
        }

        //@ts-expect-error
        delete this.list;
    }
}