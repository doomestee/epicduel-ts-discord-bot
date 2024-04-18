import Config from "../../config/index.js";
import EDEvent from "../../util/events/EDEvent.js";
import { filter, map } from "../../util/Misc.js";

export default new EDEvent("onJoinRoom", async function (hydra, { room: currRoom }) {
    if (Config.isDevelopment) return;

    const time = Date.now();

    if (!currRoom) return;

    let puppetNTxt = this.swarm.length > 1 ? `Puppet ID: ${this.settings.id} ` : "";//(this.settings.id > 1) ? `Puppet ID: ${this.settings.id}` : "";

    let isLobby = currRoom.name === "Lobby"; 

    const joinRoomListText = ":\n" + ((currRoom.userList.size - 1) ? map(filter(currRoom.getUserList(), v => v.id !== this.smartFox.myUserId && ![768687, 4191948, 9317271].some(a => a === v.charId)), v => v.charName + ' (' + v.charId + ')').join(', ') : 'nobody.');

    let res = await hydra.rest.webhooks.execute(Config.webhooks.entryTracker.id, Config.webhooks.entryTracker.token, {
        wait: true, content: (!isLobby) ? "Puppet ID: " + this.settings.id + " has joined the room (**" + currRoom.name + "**), there are" + (joinRoomListText.length >= 1900 ? ` ${currRoom.userList.size} characters in the room. (The full list is too big to send.)` : joinRoomListText) + '\n----------------------------' : "Bot has joined the lobby." + '\n----------------------------', //'**' + user.charName + '** (**' + user.charId +  "**) has " + ((type === 1) ? "joined" : 'left') + ' the room (Total: ' + (userList.length - 1 - ((type === 2) ? 1 : 0))  + ')' //content: "**" + ((author.name) ? author.name + "**" + ' (**' + author.id + '**)' : author.id + "**") + ': ' + message,
        files: joinRoomListText.length >= 1900 ? [{
            contents: Buffer.from(JSON.stringify(map(filter(currRoom.getUserList(), v => v.id !== this.smartFox.myUserId && ![768687, 4191948, 9317271].some(a => a === v.charId)), v => ({ name: v.charName, id: v.charId, sfsUserId: v.id, isMod: v.isModerator() })), undefined, 2)),//JSON.stringify(currRoom.userList.filter(v => v.id !== epicduel.client.smartFox.myUserId && ![768687, 4191948, 9317271].some(a => a === v.charId)).map(v => ({ name: v.charName, id: v.charId, sfsUserId: v.id, isMod: v.isMod })), undefined, 2),
            name: "chars.json"
        }] : []
    }).catch(e => {console.log(e); return null;});

    hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
        wait: false, content: ((res !== null) ? puppetNTxt + "[Joined room](" + res.jumpLink + ") at <t:" + Math.floor((time/1000)) + ":f>" : puppetNTxt + (puppetNTxt !== "" ? " j" : "J") + "oined room at <t:" + Math.floor((time/1000)) + ':f>')//"**" + ((author.name) ? author.name + "**" + ' (**' + author.id + '**)' : author.id + "**") + ': ' + message,
    }).catch(e => {console.log(e)});
});