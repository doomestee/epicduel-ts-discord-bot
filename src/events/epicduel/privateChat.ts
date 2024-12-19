import Config from "../../config/index.js";
import EDEvent from "../../util/events/EDEvent.js";

export default new EDEvent("onPrivateMessage", function (hydra, { isFromMe, message, userId, userName }) {
    const time = Date.now();

    let content = "";

    if (isFromMe) content = `**BOT** > **${userId}** [${userId}]: ${message}`;
    else content = ` **${userId}** [${userId}] > **BOT**: ${message}`;

    // if (userId === -1) content = "**BOT** > **" + tgtId[0] + "** [" + tgtId[1] + "]: " + message;
    // else content = "**" + userId[0] + "** [" + userId[1] + "] > **BOT**: " + message.slice(userId[0].length + 2); 

    if (isFromMe) {
        switch (content) {//(userId === -1 ? message : message.slice(userId[0].length + 2)).toLowerCase()) {
            case "jump":
                // this.jumpToPlayerRequest(userId === -1 ? tgtId[1] : userId[1]);
                break;
            case "setup":
                this.setupMyAvatar();
                break;
        }
    }

    // Non queue
    hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
        wait: false, content//: "**" + ((author.charName) ? author.charName + "**" + ' (**' + author.charId + '**)' : author.charId + "**") + ': ' + message,
    }).catch(e => {console.log(e)});
})