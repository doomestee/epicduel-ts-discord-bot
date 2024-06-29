import { readFile } from "fs/promises";
import Config from "../../config/index.js";
import ImageManager from "../../manager/image.js";
import EDEvent from "../../util/events/EDEvent.js";
import { replaceHTMLbits } from "../../manager/designnote.js";
import { findLast, map } from "../../util/Misc.js";
import { TrackedWarUse } from "../../util/game/SwarmResources.js";

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
    if (obj.type === lastType && (lastTime + 1000) > Date.now()) return;
    else {
        lastType = obj.type;
        lastTime = time;
    }

    switch (obj.type) {
        case 0:
            if (Config.isDevelopment) return;

            let send = {
                npc: "Nightwraith",
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

                    let lvlDuoText = champs.team ? String(champs.team.misc?.lvl) : "";

                    if (teamName?.includes(" and ")) {
                        const first  = v[1].success ? v[1].value[0] : undefined;
                        const second  = v[1].success ? v[1].value[1] : undefined;

                        if (first && second && champs.team?.misc?.lvl) lvlDuoText = [first.misc?.lvl, second.misc?.lvl].join(", ");
                    }// else champs.team.misc.lvl = [champs.team.misc.lvl];

                    let giftText = "";

                    if (v[3].success && v[3].value.daily.length) {
                        giftText = `\n\n__Event ${hoursLeft === 0 ? "Daily" : "Hourly"} Champion:__\nGift - **${v[3].value.daily[0].name}** (**${v[3].value.daily[0].point}** gifts)`;
                    }

                    hydra.rest.channels.createMessage("1095797998275014767", {
                        content: `__Today's ${hoursLeft === 0 ? "Daily" : "Hourly"} Champions:__`
                        + `\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                        + `\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl) ? ", Lv: " + lvlDuoText : "") + ")" : '')
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

                    // Now, for the sake of pissing few people off.

                    if (v[2].success) {
                        const toId = this.swarm.resources.tracker.player.charToId;

                        let str = ``;

                        for (let i = 0, len = v[2].value.length; i < len; i++) {
                            const m = v[2].value[i];

                            //@ts-expect-error
                            if (toId[m.name] !== undefined) {
                                const charId = toId[m.name as "Despair"];
                                const track = this.swarm.resources.tracker.player.chars[charId];

                                if (track.lastJugg[0] !== -1) {
                                    if (track.lastJugg[1] === m.bat) { track.time = time; continue; }
    
                                    str += `**${m.name}** gained ${m.wins - track.lastJugg[0]} wins (${m.bat - track.lastJugg[1]} battles, ${Math.round(((m.wins - track.lastJugg[0])/(m.bat - track.lastJugg[1])) * 1000) / 10}%)\nOverall battle: ${m.bat}, wins: ${m.wins} - ${Math.round((m.wins / m.bat) * 1000) / 10}%\nTracked from <t:${Math.floor(track.time/1000)}:T> to <t:${Math.floor(time / 1000)}:T>.\n\n`;
                                }


                                track.lastJugg = [m.wins, m.bat];
                                track.time = time;
                            }
                        }

                        if (str.length !== 0) {
                            hydra.rest.channels.createMessage("1243557222668046396", {
                                content: str.trim()
                            });
                        }
                    }

                }, (err) => {
                    hydra.rest.channels.createMessage("1095797998275014767", {
                        content: `__Today's ${hoursLeft === 0 ? "Daily" : "Hourly"} Champions:__\n1v1 - ${soloName}\n2v2 - ${teamName}\n2v1 - ${juggName}`
                    }).then((v) => v.crosspost());
                });

            // }

                if (this.modules.WarManager.cooldownHours < 1 && this.swarm.resources.tracker.war.active) {
                    const list:TrackedWarUse[] = this.swarm.resources.tracker.war.list.splice(0);
                    const lastTime = this.swarm.resources.tracker.war.startedSince;

                    if (list.length === 0) break; // No war bombs were collected.

                    // this.swarm.resources.tracker.war.list = [];
                    this.swarm.resources.tracker.war.startedSince = time;

                    const bombsToAlign = this.modules.WarManager.getAlignMappedByBombId();
                    const bombsToType = this.modules.WarManager.getAlignMappedByBombId(true);

                    // I still have no idea why am i looping 3 times in total, 1 for exile, 1 for legion then all in all.
                    const lastBomb = {
                        overall: list[list.length - 1],
                        exile: undefined as TrackedWarUse | undefined,//findLast(list, v => bombsToAlign[v.usedItemId] === "exile"),//undefined as unknown as TrackedWarUse,
                        legion: undefined as TrackedWarUse | undefined,//findLast(list, v => bombsToAlign[v.usedItemId] === "legion")//undefined as unknown as TrackedWarUse,
                    };//list[list.length - 1];//this.swarm.resources.tracker.war.list[this.swarm.resources.tracker.war.list.length - 1];
                    // let lastExileBomb: TrackedWarUse;
                    // let lastLegionBomb: TrackedWarUse;

                    let firstBomb = {
                        overall: list[0],
                        exile: undefined as TrackedWarUse | undefined,
                        legion: undefined as TrackedWarUse | undefined,
                    }

                    let stat = {
                        score: {
                            get overall() {
                                return this.exile + this.legion
                            },
                            exile: 0,
                            legion: 0,
                        },
                        count: {
                            exile: [0, 0],
                            legion: [0, 0]
                        }, user: {} as Record<string, { count: { basic: number, super: number, overall: number }, score: number, alignment: "exile" | "legion" }>
                    };

                    let sorted:Record<"byCount"|"byScore", [string, number]> = {
                        byCount: ["", -1],
                        byScore: ["", -1],
                    }

                    for (let i = 0; i < list.length; i++) {
                        const point = list[i];

                        const align = bombsToAlign[point.usedItemId];

                        const isSuper = bombsToType[point.usedItemId] === "super";

                        stat.score[align] += point.influence;//bombsToAlign//gift.count.room;
                        stat.count[align][isSuper ? 1 : 0]++;

                        lastBomb[align] = point;

                        if (!firstBomb[align]) firstBomb[align] = point;

                        if (!stat.user[point.name]) stat.user[point.name] = { alignment: align, count: { basic: isSuper ? 0 : 1, super: isSuper ? 1 : 0, get overall() { return this.basic + this.super } }, score: point.influence };//{ combo: point.count.combo, current: point.count.room, start: point.count.total - point.count.room, end: point.count.total, count: 1 };
                        else {
                            // stat.user[point.name].combo = Math.max(stat.user[point.name].combo, point.count.combo);
                            stat.user[point.name].score += point.influence;//.current += point.count.room;
                            // stat.user[point.name].end += point.count.room;
                            stat.user[point.name].count[bombsToType[point.usedItemId]]++;
                        }

                        if (sorted["byCount"][1] < stat.user[point.name].count.overall) sorted["byCount"] = [point.name, stat.user[point.name].count.overall];
                        if (sorted["byScore"][1] < stat.user[point.name].score)         sorted["byScore"] = [point.name, stat.user[point.name].score];
                        // if (sorted["byCombo"][1] < stat.user[point.name].combo) sorted["byCombo"] = [point.name, stat.user[point.name].combo];
                    }

                    let text:string = `**${list.length}** bombs were dropped from <t:${Math.floor(lastTime/1000)}:T> to <t:${Math.floor(lastBomb.overall.time / 1000)}:T>.\n\nStat:\n\n`;

                    // list.length / (lastBomb.overall.time - list[0].time)*1000;
                

                    // (list.length / ((lastBomb.exile.time-list[0].time)/1000))

                    // (list.length / (lastBomb.exile.time - list[0].time) / 1000).toFixed(4)

                    // list.length/((lastBomb.exile.time-list[0].time)/1000/60)

                    text += `* Overall:\n  * **Total Bomb**: ${stat.count.exile[0] + stat.count.exile[1] + stat.count.legion[0] + stat.count.legion[1]} (Regular: ${stat.count.exile[0] + stat.count.legion[0]}, Super: ${stat.count.exile[1] + stat.count.legion[1]})\n  ` + /** **Bomb Per Second**: ${(list.length / ((lastBomb.overall.time - firstBomb.overall.time) / 1000)).toFixed(4)} bomb(s)\n */ `* **Bomb Per Minute**: ${(list.length/((lastBomb.overall.time-firstBomb.overall.time)/1000/60)).toFixed(4)} bomb(s).\n`;

                    if (lastBomb.exile && firstBomb.exile) text += `\n* Exile:\n  * **Total Bomb**: ${stat.count.exile[0] + stat.count.exile[1]} (Regular: ${stat.count.exile[0]}, Super: ${stat.count.exile[1]})\n  * **Total Influence**: ${stat.score.exile}\n  ` + /** * **Bomb Per Second**: ${((stat.count.exile[0] + stat.count.exile[1]) / ((lastBomb.exile.time - firstBomb.exile.time) / 1000)).toFixed(4)} bomb(s)\n */ `* **Bomb Per Minute**: ${((stat.count.exile[0] + stat.count.exile[1])/((lastBomb.exile.time-firstBomb.exile.time)/1000/60)).toFixed(4)} bomb(s).\n`;
                    if (lastBomb.legion && firstBomb.legion) text += `\n* Legion:\n  * **Total Bomb**: ${stat.count.legion[0] + stat.count.legion[1]} (Regular: ${stat.count.legion[0]}, Super: ${stat.count.legion[1]})\n  * **Total Influence**: ${stat.score.legion}\n  ` + /*** **Bomb Per Second**: ${((stat.count.legion[0] + stat.count.legion[1]) / ((lastBomb.legion.time - firstBomb.legion.time) / 1000)).toFixed(4)} bomb(s)\n  */ `* **Bomb Per Minute**: ${((stat.count.legion[0] + stat.count.legion[1])/((lastBomb.legion.time-firstBomb.legion.time)/1000/60)).toFixed(4)} bomb(s).\n`;

                    // TODO: biggest bomber by count by score etc for both  side as well

                    text += `\nBiggest bomber:\n* By Count: **${sorted.byCount[0]}** with ${sorted.byCount[1]} bombs.\n* By Score: **${sorted.byScore[0]}** with ${sorted.byScore[1]} influence.`;

                    text += `\n\n${Object.keys(stat.user).length} unique warriors achieved ${stat.score.overall} influence.`;

                    const orderedUsers = {} as Record<string, unknown>;

                    const keys = Object.keys(stat.user).sort();

                    for (let i = 0, len = keys.length; i < len; i++) {
                        orderedUsers[keys[i]] = stat.user[keys[i]];
                    }

                    return hydra.rest.channels.createMessage("1232008738399981629", {
                        content: text.trim(),
                        files: [{
                            name: "bombs.json",
                            contents: Buffer.from(JSON.stringify(list, undefined, 2)),
                        }, {
                            name: "users.json",
                            contents: Buffer.from(JSON.stringify(orderedUsers, undefined, 2))
                        }]
                        //content: (globalGift === 0 ? `**${gifterName}** sent a present at Central Station, VendBot.` : `**${gifterName}** sent a global present.`) + `\nThis person has given away ${totalGiftCount} in total, to ${globalGift === 0 ? "a room" : "the server"} with ${roomGiftCount} characters.`
                    }).then(v => v.crosspost());//.catch((err) => this._logger.error(err));

                }

                if (hoursLeft === 0) {
                    const keys = Object.keys(this.swarm.resources.tracker.player.chars);

                    for (let i = 0, len = keys.length; i < len; i++) {
                        if (this.swarm.resources.tracker.player.chars[keys[i]].lastJugg[0] !== -1) {
                            if (this.swarm.resources.tracker.player.chars[keys[i]].time !== time) {
                                this.swarm.resources.tracker.player.chars[keys[i]].lastJugg = [0, 0];
                                this.swarm.resources.tracker.player.chars[keys[i]].time = time;
                            }
                        }
                    }
                }
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