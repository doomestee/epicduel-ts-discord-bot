import Logger from "../../manager/logger.js";
import ClientEvent from "../../util/ClientEvent.js";

export default new ClientEvent("error", function (err, shard) {
    if (typeof err === "string") {
        throw err; // sike idk
    }

    if ("code" in err) {
        switch (err.code) {
            case 1006:
                this.connectedAt = Date.now();

                return Logger.getLogger("Bot").info(`Shard ${shard} has been reset by Discord, reconnecting automatically.`);
            default:
                return Logger.getLogger("Bot").error(err);
        }
    }
});