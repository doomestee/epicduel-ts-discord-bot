import Logger from "../../manager/logger.js";
import ClientEvent from "../../util/ClientEvent.js";

export default new ClientEvent("ready", function () {
    Logger.getLogger("Bot").info(`Bot took ${(Date.now() - this.connectedAt)/1000} seconds to connect!`)
});