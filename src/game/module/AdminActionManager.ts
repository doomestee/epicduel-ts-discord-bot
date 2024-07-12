import { map } from "../../util/Misc.js";
import Constants, { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import { SkillTypes } from "../box/SkillsBox.js";
import BaseModule from "./Base.js";

export default class AdminActionManager extends BaseModule {
    secondsLeft = 0;

    constructor(public client: Client) {
        super();
    }

    processAction(data: string[]) {
        const type = parseInt(data[2]);
        const msg = data[3];

        switch (type) {
            // Update?
            case 1:
                this.secondsLeft = 300;
                setTimeout(() => {
                    this.client.swarm.probing = true;
                    // this.client.swarm.resources.checkpoints.comparison[0] = -1;

                    const obj = {} as Record<SkillTypes, any[]>;
                    const keys = Object.keys(this.client.boxes.skills.objMap).concat(Object.keys(this.client.boxes.skills.objList)) as unknown as SkillTypes[];

                    const abc = map(keys, v => v === "tree" ? this.client.boxes.skills.objList[v] : this.client.boxes.skills.objMap[v].toArray());

                    for (let i = 0, len = keys.length; i < len; i++) {
                        obj[keys[i]] = abc[i];
                    }

                    this.client.swarm.resources.comparisonFiles.skills = obj;
                    this.client.swarm.resources.comparisonFiles.item = this.client.boxes.item.objMap.toArray();

                    // this.client.selfDestruct(false);
                    this.client.smartFox.disconnect();
                    // this.client.manager.langReset = true;
                    //this.client.manager.langVersion++; Commented out just in case they may haven't incremented.
                }, 300*1000);
                
                //let es = (!this.client.manager.standalone) ? this.client.manager.discord.emit : this.client.manager._logger;

                this.client.swarm.execute("onAdminMessage", this.client, { type: 0, message: msg });
                // idk why do i have these two
                // this.client.manager.logEmit("epicduel_notification", {type: 0, message: "**" + msg + "**", args: [msg]});
                // this.client.manager.logEmit("epicduel_message", {message: msg, type: 1}, true);

                break;
            // Announcement from an admin.
            case 2:
                this.client.swarm.execute("onAdminMessage", this.client, { type: 1, message: msg });
                // this.client.manager.logEmit("epicduel_notification", {type: 0, message: "**" + msg + "**", args: [msg]});
                // this.client.manager.logEmit("epicduel_message", {message: msg, type: 2});
                break;
            // Power hours / Hours left til end of day?
            case 3:
                this.client.swarm.execute("onAdminMessage", this.client, { type: 2, message: msg, powerHourMultiplier: parseInt(data[4]) });
                return;
                // let msgParts = msg.split(',');

                // let sqlHour = parseInt(msgParts[0]);
                // let hoursLeft = sqlHour > 0 ? 24 - sqlHour : 0;
                // let soloName = msgParts[1];
                // let teamName = msgParts[2];
                // let juggName = msgParts[3];

                if (false) { //hoursLeft == 0) {
                    // if (this.client.manager) this.client.manager.famed = {};

                    // if (this.client.manager.discord.ready) {
                    //     setTimeout(() => { // 30 seconds grace in case bot's still attacking
                    //         if (this.client.manager.discord.messages[0].value.autoBattle.left !== 300) {
                    //             this.client.manager.discord.messages[0].value.autoBattle.left = 300;
                    //             this.client.manager.discord.messages[0].save();
                    //         }
                    //     }, 30000);

                    //     Promise.all([this.client.fetchLeaders(3), this.client.fetchLeaders(4), this.client.fetchLeaders(17), this.client.modules.Advent.getGiftLeaders()]).then((v) => {
                    //         if (v.some(o => o.error)) console.log("Error at daily champion fetching leaders.");

                    //         let champs = {
                    //             solo: v[0][0],//.find(o => o.name === soloName),
                    //             team: v[1][0],//.find(o => o.name === teamName),
                    //             jugg: v[2][0],//.find(o => o.name === juggName),
                    //         }
    
                    //         if (teamName?.includes(" and ")) {
                    //             champs.team.misc.lvl = [v[1][0].misc.lvl, v[1][1].misc.lvl];
                    //         } else champs.team.misc.lvl = [champs.team.misc.lvl];

                    //         let giftText = "";

                    //         if (v[3].daily.length) {
                    //             giftText = `\n\n__Event Hourly Champion:__\nGift - **${v[3].daily[0].name}** (**${v[3].daily[0].point}** gifts)`;
                    //         }

                    //         this.client.manager.discord.rest.channels.createMessage("1095797998275014767", {
                    //             content: `__Today's Daily Champions:__`
                    //             + `\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                    //             + `\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl && champs.team.misc.lvl.length) ? ", Lv: " + champs.team.misc.lvl.join(", ") : "") + ")" : '')
                    //             + `\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                    //             + giftText
                    //         }).then((v) => v.crosspost());

                    //         this.client.manager.discord.rest.channels.createMessage("1180881297179168936", {
                    //             content: `# __Today's Daily Champions:__`
                    //             + (v[0].length ? `\n### 1v1:\n` + v[0].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                    //             + (v[1].length ? `\n### 2v2:\n` + v[1].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl && champs.team.misc.lvl.length) ? ", Lv: " + champs.team.misc.lvl.join(", ") : "") + ")" : '')
                    //             + (v[2].length ? `\n### 2v1:\n` + v[2].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                    //             + (v[3].daily.length ? `\n\n### Gift:\n` + v[3].daily.slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.point}** gifts)`).join("\n") : "")//giftText
                    //         }).then((v) => v.crosspost());
                    //     }, (err) => {
                    //         this.client.manager.discord.rest.channels.createMessage("1095797998275014767", {
                    //             content: `__Today's Daily Champions:__\n1v1 - ${soloName}\n2v2 - ${teamName}\n2v1 - ${juggName}`
                    //         }).then((v) => v.crosspost());
                    //     })
                    // }
                } else {
                    // let powerHourMultiplier = parseInt(data[4]);
                    // if (powerHourMultiplier == 2) {
                    //     //this.client.manager.discord.emit("epicduel_power_hour", hoursLeft);
                    //     this.client.manager.logEmit("epicduel_notification", {type: 2, message: "Power Hour has started, " + hoursLeft + " hour(s) left!", args: [hoursLeft, 2]});
                    // } else if (hoursLeft == 1) {
                    //     //this.client.manager.discord.emit("epicduel_hours_left", hoursLeft);
                    //     this.client.manager.logEmit("epicduel_notification", {type: 3, message: "Power Hour has " + hoursLeft + " hour(s) left!", args: [1, powerHourMultiplier]});
                    // } else {
                    //     //this.client.manager.discord.emit("epicduel_hours_left", hoursLeft);
                    //     this.client.manager.logEmit("epicduel_notification", {type: 4, message: "idk", args: [hoursLeft, powerHourMultiplier]});
                    // }

                    // Promise.all([this.client.fetchLeaders(3), this.client.fetchLeaders(4), this.client.fetchLeaders(17), this.client.modules.Advent.getGiftLeaders()]).then((v) => {
                    //     if (v.some(o => o.error)) console.log("Error at hourly champion fetching leaders.");

                    //     let champs = {
                    //         solo: v[0][0],//.find(o => o.name === soloName),
                    //         team: v[1][0],//.find(o => o.name === teamName),
                    //         jugg: v[2][0]//.find(o => o.name === juggName),
                    //     }

                    //     if (teamName?.includes(" and ")) {
                    //         champs.team.misc.lvl = [v[1][0].misc.lvl, v[1][1].misc.lvl];
                    //     } else champs.team.misc.lvl = [champs.team.misc.lvl];

                    //     let giftText = "";

                    //     if (v[3].daily.length) {
                    //         giftText = `\n\n__Event Hourly Champion:__\nGift - **${v[3].daily[0].name}** (**${v[3].daily[0].point}** gifts)`;
                    //     }

                    //     this.client.manager.discord.rest.channels.createMessage("1095797998275014767", {
                    //         content: `__Today's Hourly Champions:__`
                    //         + `\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                    //         + `\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl && champs.team.misc.lvl.length) ? ", Lv: " + champs.team.misc.lvl.join(", ") : "") + ")" : '')
                    //         + `\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                    //         + giftText
                    //     }).then((v) => v.crosspost());

                    //     this.client.manager.discord.rest.channels.createMessage("1180881297179168936", {
                    //         content: `# __Today's Hourly Champions:__`
                    //         + (v[0].length ? `\n### 1v1:\n` + v[0].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n1v1 - ${(soloName) ? "**" + soloName + "**" : "N/A"}` + ((champs.solo) ? ` (**${champs.solo.wins}** wins, ${Math.round((champs.solo.wins/champs.solo.bat) * 1000)/10}%` + ((champs.solo.misc && champs.solo.misc.lvl) ? ", Lv: " + champs.solo.misc.lvl : "") + ")" : '')
                    //         + (v[1].length ? `\n### 2v2:\n` + v[1].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n2v2 - ${(teamName) ? "**" + teamName + "**" : "N/A"}` + ((champs.team) ? ` (**${champs.team.wins}** wins, ${Math.round((champs.team.wins/champs.team.bat) * 1000)/10}%` + ((champs.team.misc && champs.team.misc.lvl && champs.team.misc.lvl.length) ? ", Lv: " + champs.team.misc.lvl.join(", ") : "") + ")" : '')
                    //         + (v[2].length ? `\n### 2v1:\n` + v[2].slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.wins}** wins, ${Math.round((u.wins / u.bat) * 1000) / 10}%, Lv: ${u.misc.lvl})`).join("\n") : "")//`\n2v1 - ${(juggName) ? "**" + juggName + "**" : "N/A"}` + ((champs.jugg) ? ` (**${champs.jugg.wins}** wins, ${Math.round((champs.jugg.wins/champs.jugg.bat) * 1000)/10}%` + ((champs.jugg.misc && champs.jugg.misc.lvl) ? ", Lv: " + champs.jugg.misc.lvl : "") + ")" : '')
                    //         + (v[3].daily.length ? `\n\n### Gift:\n` + v[3].daily.slice(0, 5).map((u, i) => (i + 1) + ` - **${u.name}** (**${u.point}** gifts)`).join("\n") : "")//giftText
                    //     }).then((v) => v.crosspost());
                    // }, (err) => {
                    //     this.client.manager.discord.rest.channels.createMessage("1095797998275014767", {
                    //         content: `Today's Hourly Champions:\n1v1 - ${soloName}\n2v2 - ${teamName}\n2v1 - ${juggName}`
                    //     }).then((v) => v.crosspost());
                    // });
                }

                break;
            // Daily missions reset.
            case 4:
                // this.client.manager.logEmit("epicduel_notification", {type: 1, message: "Daily missions have been reset."});
                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_UPDATE_MISSION_GROUPS, {end: 0}, 2, "json");
                //MissionGroupsModule.instance.loadData();
                break;
            // Regional influence set to 0?
            case 5:
                this.client.modules.WarManager.myRegionalInfluence = 0;
                break;
            // Victory
            case 6:
                // let winAlign = data[4];
                // this.client.smartFox.emit("war_status", { type: "end", align: parseInt(winAlign) });

                this.client.swarm.execute("onWarStatusChange", this.client, { type: "end", alignment: parseInt(data[4]) as 1 | 2 });
                // this.client.manager.logEmit("epicduel_war", {type: "end", align: winAlign});
                break;
            // War Rally
            case 7:
                let alignId = parseInt(data[4]);

                if(alignId !== Constants.EXILE_ID && alignId !== Constants.LEGION_ID) {
                    return;
                }

                this.client.modules.WarManager.warRallyStatus = (alignId);

                if (this.client.modules.WarManager.activeRegion != null) {
                    //this.client.manager.discord.emit("epicduel_war_end", {type: "rally", align: winAlign});
                }

                this.client.swarm.execute("onWarStatusChange", this.client, { type: "rally", alignment: parseInt(data[4]) as 1 | 2 , status: "start" });
                // this.client.smartFox.emit("war_status", { type: "rally", align: (alignId), status: "start" });
                // this.client.manager.logEmit("epicduel_war", {type: "rally", align: alignId, status: "start"});
                break;
            // End of war rally
            case 8:
                this.client.modules.WarManager.warRallyStatus = 0;
                // this.client.manager.logEmit("epicduel_war", {type: "rally", status: "end"});
                this.client.swarm.execute("onWarStatusChange", this.client, { type: "rally", status: "end" });
                // this.client.smartFox.emit("war_status", { type: "rally", align: (-1), status: "end" });
                break;
        }
    }
}