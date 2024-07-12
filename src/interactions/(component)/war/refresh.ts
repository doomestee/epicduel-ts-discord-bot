import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import Swarm from "../../../manager/epicduel.js";
import DatabaseManager from "../../../manager/database.js";
import { IRally } from "../../../Models/Rally.js";
import { WarObjective } from "../../../game/module/WarManager.js";
import { discordDate, getHighestTime, getTime, rawHoursified } from "../../../util/Misc.js";

export default new Command(CommandType.Component, { custom_id: "refresh_war_info_<userId>", waitFor: ["EPICDUEL", "LOBBY"], gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { userId }}) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const time = process.hrtime.bigint();
        const timeM = Date.now();

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.deferUpdate();

        let isInCoolDown = ed.modules.WarManager.cooldownHours > 0;// && epicduel.sussyModeActivated !== true;

        // if (!ed.lobbyInit) return interaction.createFollowup({content: "Woops, the bot is still in the lobby, this means it hasn't joined a room yet... for some reason.", flags: 64});

        let warM = ed.modules.WarManager;
        let points = warM.warPoints();

        let rally = (warM.warRallyStatus == 0) ? "There's no active rally." : 
                    (warM.warRallyStatus == 1) ? "Exile rally is active!" :
                    (warM.warRallyStatus == 2) ? "Legion rally is active!" : "Unknown rally status.";

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

        let gapCmt = `There is a gap of **${points.gap}** influence (**${points.gapPt}**)`;

        if (points.gap >= Math.round(points.max[0] / 100)) {
            const losingAlign = (points.remaining[0] >= points.remaining[1]) ? " Legion" : "n Exile";

            gapCmt += `\nThere is enough influence to reach the threshold for a${losingAlign} rally!\n(Provided it's been 6 hours since the last rally)`;
        } else gapCmt += "\nThe gap must be bigger than 1% for a rally to become feasible.";

        const war = await Swarm.getActiveWar();

        return interaction.editOriginal({
            embeds: [{
                title: obj.title,
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                description: `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\n${gapCmt}\n\n${rally}${(isInCoolDown) ? `\n\nWar has already ended, it is currently in cooldown for ${ed.modules.WarManager.cooldownHours} hours (<t:${Math.round(rawHoursified(ed.modules.WarManager.cooldownHours, ed.modules.WarManager.cooldownLastUpdated).getTime()/1000)}:F>)` : `\n\nThis war has been going on for **${getTime(war.type === 1 ? Date.now () - war.result.created_at.getTime() : 0, true, "", true)}.**\n\nProjected end date: ${war.type === 1 ? discordDate(war.result.created_at.getTime() + ((timeM - war.result.created_at.getTime()) / Math.max(Number(points.currentPercent[0].slice(0, -1)), Number(points.currentPercent[1].slice(0, -1)))/100)) : "N/A"}`}`,
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                },
                //description: `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\nMain Objective: ${emojis[defAlignId]}\nHealth: **${obj.def[0].hp}** / **${obj.def[0].max}** - ${Math.round((obj.def[0].hp / obj.def[0].max) * 10000) / 100}%\n\n`
                //+ obj.off.map(v => `Side Objective: ${emojis[defAlignId === 1 ? 2 : 1]}\nHealth: **${v.hp}** / **${v.max}** - ${Math.round((v.hp / v.max) * 10000) / 100}%`).join("\n\n"),
                //fields: [{
                //    name: "Rally", value: rally, inline: true
                //}]
            }],
            components: [{
                type: 1, components: [{
                    type: 3, customID: "war_select_" + userId, minValues: 1, maxValues: 1, options: [{
                        label: "Basic War Information", value: "basic_info", default: true, description: "See the current status of the war."
                    }, {
                        label: "List of Rallies", value: "rallies_info", description: "See all of the rallies under this war."
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, label: "Refresh", style: 1, customID: "refresh_war_info_" + userId,
                //}, {
                //    type: 2, style: 5, url: "https://doomester.grafana.net/d/xatJoSF4z/ed-war-influence?orgId=1", label: "Metrics", emoji: {name: "📈"}
                }]
                // }, {
                //     type: 2, style: 1, label: "(DEV) Chart Test 01", customID: "chart_0_" + interaction.user.id
                // }]
            }]
        })
    });