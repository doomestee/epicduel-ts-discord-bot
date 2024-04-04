import { IRally } from "../../Models/Rally.js";
import { WarObjective } from "../../game/module/WarManager.js";
import DatabaseManager from "../../manager/database.js";
import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import { rawHoursified } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";

export default new Command(CommandType.Application, { cmd: ["war", "current"], description: "Sees the current state of the war that's been repeating for the 93rd time.", waitFor: ["EPICDUEL"], cooldown: 3000 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;
        //if (!interaction.acknowledged) await interaction.defer();

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient());

        let isInCoolDown = ed.modules.WarManager.cooldownHours > 0;// && epicduel.sussyModeActivated !== true;

        // if (!ed.lobbyInit) return interaction.createFollowup({content: "Woops, the bot is still in the lobby, this means it hasn't joined a room yet... for some reason.", flags: 64});

        let war = ed.modules.WarManager;
        let points = war.warPoints();

        let rally = (war.warRallyStatus == 0) ? "There's no active rally." : 
                    (war.warRallyStatus == 1) ? "Exile rally is active!" :
                    (war.warRallyStatus == 2) ? "Legion rally is active!" : "Unknown rally status.";

        let [prevRally] = await DatabaseManager.cli.query<IRally>(`SELECT * FROM rallies ORDER BY id desc LIMIT 1`).then(v => v.rows);

        rally += "\nLast rally triggered at <t:" + Math.round(prevRally.triggered_at.getTime()/1000) + ":D> <t:" + Math.round(prevRally.triggered_at.getTime()/1000) + ":T>.";

        let objs = ed.modules.WarManager.currentObjectives();

        // As in, the main one tower thing that needs to be defended.
        let defAlignId = objs.filter(v => v.alignmentId === 1).length === 1 ? 1 : 2;//ed.modules.WarManager.getControlAlignmentInActiveRegion();
        let defObj = objs.find(v => v.alignmentId === defAlignId) as WarObjective;
        let offObjs = objs.filter(g => g.alignmentId !== defAlignId);

        let obj = {
            def: [{
                hp: defObj.points, max: defObj.maxPoints, obj: defObj.objectiveId
            }], off: offObjs.map(g => { return { hp: g.points, max: g.maxPoints, obj: g.objectiveId }}),
            region: ed.modules.WarManager.activeRegionId,
            rally: ed.modules.WarManager.warRallyStatus,
            title: ed.modules.WarManager.activeRegion?.warTitle ?? "Unknown title"
        }

        // if (client.cache.war && client.cache.war === obj) return;

        // client.cache.war = obj;

        let emojis = {
            1: "<:exile:1085244911005208596>",
            2: "<:legion:1085244935042764881>"
        }

        let extFields = [];
        
        if (isInCoolDown) extFields.push({ name: "Cooldown", value: `\n\nWar has already ended, it is currently in cooldown for ${ed.modules.WarManager.cooldownHours} hours (<t:${Math.round(rawHoursified(ed.modules.WarManager.cooldownHours, ed.modules.WarManager.cooldownLastUpdated).getTime()/1000)}:F>)`, inline: true });

        return interaction.createFollowup({
            embeds: [{
                title: obj.title,
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                description: `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\n${rally}${(isInCoolDown) ? `\n\nWar has already ended, it is currently in cooldown for ${ed.modules.WarManager.cooldownHours} hours (<t:${Math.round(rawHoursified(ed.modules.WarManager.cooldownHours, ed.modules.WarManager.cooldownLastUpdated).getTime()/1000)}:F>)` : ""}`
                //description: `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\nMain Objective: ${emojis[defAlignId]}\nHealth: **${obj.def[0].hp}** / **${obj.def[0].max}** - ${Math.round((obj.def[0].hp / obj.def[0].max) * 10000) / 100}%\n\n`
                //+ obj.off.map(v => `Side Objective: ${emojis[defAlignId === 1 ? 2 : 1]}\nHealth: **${v.hp}** / **${v.max}** - ${Math.round((v.hp / v.max) * 10000) / 100}%`).join("\n\n"),
                //fields: [{
                //    name: "Rally", value: rally, inline: true
                //}]
            }],
            components: [{
                type: 1, components: [{
                    type: 3, customID: "war_select_" + interaction.user.id, minValues: 1, maxValues: 1, options: [{
                        label: "Basic War Information", value: "basic_info", default: true, description: "See the current status of the war."
                    }, {
                        label: "List of Rallies", value: "rallies_info", description: "See all of the rallies under this war."
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, label: "Refresh", style: 1, customID: "refresh_war_info_" + interaction.user.id,
                //}, {
                //    type: 2, style: 5, url: "https://doomester.grafana.net/d/xatJoSF4z/ed-war-influence?orgId=1", label: "Metrics", emoji: {name: "📈"}
                }, {
                    type: 2, style: 1, label: "(DEV) Chart Test 01", customID: "chart_0_" + interaction.user.id
                }]
            }]
        });
    })