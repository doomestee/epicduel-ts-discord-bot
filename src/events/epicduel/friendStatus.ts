import DatabaseManager from "../../manager/database.js";
import EDEvent from "../../util/events/EDEvent.js";
import { find } from "../../util/Misc.js";

export default new EDEvent("onFriendStatus", async function (hydra, obj) {
    const time = Date.now();
    
    console.log(obj);
    if (obj.isOnline) return;

    DatabaseManager.helper.getCharacterLinks(obj.charId).then((links) => {
        if (links.length == 0) return;

        // We know there can only be 1 anyways cos each character id is unique so...

        const char = find(links, v => v.id === obj.charId);//links.result.find(v => v.id === obj.charId);

        if (char && char.link_flags & 1 << 5) {
            char.link_flags -= 1 << 5;

            DatabaseManager.cli.query("UPDATE characterlink SET flags = flags - $1 WHERE id = $2", [1 << 5, obj.charId])
                // .catch(err => Logger.getLogger("Database").error(err));

            hydra.rest.users.createDM(char.discord_id)
                .then(dm => dm.createMessage({ content: "Your character **" + char.name + "** (ID: " + char.id + ") has just been disconnected.\n*Note you need to re-use /track for next round of bout.*" }))
                // .catch(err => logger.error(err));
        }
    });
});