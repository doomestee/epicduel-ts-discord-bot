import { MainMessageStorage } from "../../manager/discord.js";
import Logger from "../../manager/logger.js";
import ClientEvent from "../../util/events/ClientEvent.js";

let once = false;

export default new ClientEvent("ready", function () {
    Logger.getLogger("Bot").info(`Bot took ${(Date.now() - this.connectedAt)/1000} seconds to connect!`)

    if (!once) {
        once = true;
        this.loadMessage<MainMessageStorage>("937078109751083038", "1071155768201580635").then(v => this.messages[0] = v);
    }
});