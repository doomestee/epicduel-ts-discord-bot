import { readFile } from "fs/promises";
import Config from "../../config/index.js";
import ImageManager from "../../manager/image.js";
import EDEvent from "../../util/events/EDEvent.js";
import { replaceHTMLbits } from "../../manager/designnote.js";
import { map } from "../../util/Misc.js";

/*

- Type:
  0 - announcement
  1 - update or joining
  2 - power hour

*/

let lastTime:number = 0;
let lastType:number = 0;

export default new EDEvent("onAdminMessage", async function (hydra, obj) {
    const time = Date.now();
    
    // 1 seconds grace for admin message
    if (obj.type === lastType && (time + 1000) > Date.now()) return;
    else {
        lastType = obj.type;
        lastTime = time;
    }

    switch (obj.type) {
        case 0:
            if (Config.isDevelopment) return;

            let send = {
                npc: "Titan",
                title: "Admin Message",
                message: obj.message
            }

            if (obj.message.indexOf("}") !== -1) {
                let splitCount = obj.message.match(/\}/g)?.length ?? 0;

                if (splitCount !== 2) return; // Well mistakes were made, blame NW/Aca/whoever made the announcement

                let values = obj.message.split("}");

                send = {
                    npc: values[0],
                    title: values[1],
                    message: values[2],
                };
            }

            if (ImageManager.has("avatars", send.npc + ".png")) {
                return readFile(Config.dataDir + "/assets/avatars/" + send.npc + ".png")
                    .then(f => {
                        return hydra.rest.webhooks.execute(Config.webhooks.updateTracker.id, Config.webhooks.updateTracker.token, {
                            embeds: [{
                                author: {
                                    name: send.npc
                                }, thumbnail: {
                                    url: "attachment://avatar.png"
                                },
                                description: replaceHTMLbits(send.message)
                            }],
                            files: [{
                                name: "avatar.png", contents: f
                            }]
                        });
                    })
            }

            return hydra.rest.webhooks.execute(Config.webhooks.updateTracker.id, Config.webhooks.updateTracker.token, {
                embeds: [{
                    author: {
                        name: send.npc
                    },
                    description: replaceHTMLbits(send.message)
                }]
            })
            break;
        case 1:
            if (Config.isDevelopment) return;

            let content = `**${obj.message}**`;

            let webhook = Config.webhooks.entryTracker;//{ id: process.env.ENTRY_TRACKER_WEBHOOK_ID, token: process.env.ENTRY_TRACKER_WEBHOOK_TOKEN };

            if (["new shipment", "rebooting", "updating"].some(v => obj.message.toLowerCase().includes(v))) {
                let isShipment = obj.message.toLowerCase().includes("new shipment");

                content = (isShipment ? `<@&1125895863550607470> ` : `<@&1152343294727176333> `) + content;
                webhook = Config.webhooks.updateTracker;//{ id: process.env.UPDATE_TRACKER_WEBHOOK_ID, token: process.env.UPDATE_TRACKER_WEBHOOK_TOKEN };
            }

            return hydra.rest.webhooks.execute(webhook.id, webhook.token, {
                wait: true, content, allowedMentions: {
                    roles: ["1125895863550607470", "1152343294727176333"]
                }
            }).catch(e => {console.log(e); return null;});
            break;
        case 2:
            let msgParts = obj.message.split(',');

            let sqlHour = parseInt(msgParts[0]);
            let hoursLeft = sqlHour > 0 ? 24 - sqlHour : 0;
            let soloName = msgParts[1];
            let teamName = msgParts[2];
            let juggName = msgParts[3];

            if (!Config.isDevelopment) {
                // if (this.manager) this.manager.famed = {};

                // setTimeout(() => { // 30 seconds grace in case bot's still attacking
                //     if (this.manager.discord.messages[0].value.autoBattle.left !== 300) {
                //         this.manager.discord.messages[0].value.autoBattle.left = 300;
                //         this.manager.discord.messages[0].save();
                //     }
                // }, 30000);

                Promise.all([this.modules.Leader.fetch(3), this.modules.Leader.fetch(4), this.modules.Leader.fetch(17), this.modules.Advent.getGiftLeaders()]).then((v) => {
                    // if (v.some(o => o.error)) console.log("Error at daily champion fetching leaders.");

                    // let smallText = "";
                    // let bigText = "";

                    // let type = ["1v1", "2v2", "2v1", "Gift"];

                    // for (let i = 0, len = v.length; i < len; i++) {
                    //     if (!v[i].success) {
                    //         if (i > 2) continue;
                    //         smallText += `${type[i]} - ${msgParts[i + 1]}`;
                    //         bigText += `### ${type[i]}`

                    //         continue;
                    //     }
                    // }

                    let champs = {
                        solo: v[0].success ? v[0].value[0] : undefined,//.find(o => o.name === soloName),
                        team: v[1].success ? v[1].value[0] : undefined,//.find(o => o.name === teamName),
                        jugg: v[2].success ? v[2].value[0] : undefined,//.find(o => o.name === juggName),
                    }

                    if (teamName?.includes(" and ")) {
                        const first  = v[1].success ? v[1].value[0] : undefined;
                        const second  = v[1].success ? v[1].value[1] : undefined;

                        //@ts-expect-error
                        if (first && second && champs.team?.misc?.lvl) champs.team.misc.lvl = [first, second].join(", ");
                    }// else champs.team.misc.lvl = [champs.team.misc.lvl];

                    let giftText = "";

                    if (v[3].success && v[3].value.daily.length) {
                        giftText = `\n\n__Event ${hoursLeft === 0 ? "Daily" : "Hourly"} Champion:__\nGift - **${v[3].value.daily[0].name}** (**${v[3].value.daily[0].point}** gifts)`;
                    }

                    hydra.rest.channels.createMessage("1095797998275014767", {
                        content: `__Today's ${hoursLeft === 0 ? "Daily" : "Hourly"} Champions:__`
                        + `\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                        + `\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl) ? ", Lv: " + champs.team.misc.lvl : "") + ")" : '')
                        + `\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                        + giftText
                    }).then((v) => v.crosspost());

                    hydra.rest.channels.createMessage("1180881297179168936", {
                        content: `# __Today's ${hoursLeft === 0 ? "Daily" : "Hourly"} Champions:__`
                        + (v[0].success && v[0].value.length ? `\n### 1v1:\n` + map(v[0].value.slice(0, 5), (u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc?.lvl})`).join("\n") : "")//`\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                        + (v[1].success && v[1].value.length ? `\n### 2v2:\n` + map(v[1].value.slice(0, 5), (u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc?.lvl})`).join("\n") : "")//`\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl && champs.team.misc.lvl.length) ? ", Lv: " + champs.team.misc.lvl.join(", ") : "") + ")" : '')
                        + (v[2].success && v[2].value.length ? `\n### 2v1:\n` + map(v[2].value.slice(0, 5), (u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc?.lvl})`).join("\n") : "")//`\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                        + (v[3].success && v[3].value.daily.length ? `\n\n### Gift:\n` + map(v[3].value.daily.slice(0, 5), (u, i) => (i + 1) + ` - **${u.name}** (**${u.point}** gifts)`).join("\n") : "")//giftText
                    }).then((v) => v.crosspost());
                }, (err) => {
                    hydra.rest.channels.createMessage("1095797998275014767", {
                        content: `__Today's ${hoursLeft === 0 ? "Daily" : "Hourly"} Champions:__\n1v1 - ${soloName}\n2v2 - ${teamName}\n2v1 - ${juggName}`
                    }).then((v) => v.crosspost());
                });
            }

            if (hoursLeft == 0) {
                this.famed = {};
            } else {
                if (obj.powerHourMultiplier == 2) {
                    //this.manager.discord.emit("epicduel_power_hour", hoursLeft);

                    // this.manager.logEmit("epicduel_notification", {type: 2, message: "Power Hour has started, " + hoursLeft + " hour(s) left!", args: [hoursLeft, 2]});
                } else if (hoursLeft == 1) {
                    //this.manager.discord.emit("epicduel_hours_left", hoursLeft);
                    // this.manager.logEmit("epicduel_notification", {type: 3, message: "Power Hour has " + hoursLeft + " hour(s) left!", args: [1, powerHourMultiplier]});
                } else {
                    //this.manager.discord.emit("epicduel_hours_left", hoursLeft);
                    // this.manager.logEmit("epicduel_notification", {type: 4, message: "idk", args: [hoursLeft, powerHourMultiplier]});
                }
            }
    }
    
});