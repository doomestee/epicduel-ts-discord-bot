import { Embed } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import Swarm from "../../../manager/epicduel.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import DatabaseManager from "../../../manager/database.js";
import { IRally } from "../../../Models/Rally.js";
import { IWar } from "../../../Models/War.js";
import { discordDate, filter, getHighestTime, getTime, rawHoursified } from "../../../util/Misc.js";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };

export default new Command(CommandType.Component, { custom_id: "war_select_<userId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { userId } }) => {
        if (interaction.data.componentType !== 3) return;

        const time = process.hrtime.bigint();
        const timeM = Date.now();

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        // ik there's !ed twice for the same thing, but screw ts fr
        if (!ed && interaction.data.values.raw[0] === "basic_info") return interaction.reply(SwarmError.noClient());
        
        if (!interaction.acknowledged) await interaction.deferUpdate();

        let embeds:Embed[] = [];

        let lazyEmbed = (description: string) : Embed => {
            return {
                title: "Error 69x",
                author: {
                    name: interaction.message.embeds[0].author?.name ?? "N/A",
                    iconURL: interaction.message.embeds[0].author?.iconURL
                },
                description: description//`There's been a problem trying to access database / getting active war ID on our database.`
            }
        }

        let activeWar = await Swarm.getActiveWar();
        let war:IWar | undefined = activeWar.type === 0 ? activeWar.prev : activeWar.type === 1 ? activeWar.result : undefined;

        switch (interaction.data.values.raw[0]) {
            case "basic_info":
                if (!ed) return; // intellisense

                let points = ed.modules.WarManager.warPoints();

                let prevRally = await DatabaseManager.cli.query<IRally>(`SELECT * FROM rallies ORDER BY id desc LIMIT 1`).then(v => v.rows);
                let rally = (ed.modules.WarManager.warRallyStatus == 0) ? "There's no active rally." : 
                            (ed.modules.WarManager.warRallyStatus == 1) ? "Exile rally is active!" :
                            (ed.modules.WarManager.warRallyStatus == 2) ? "Legion rally is active!" : "Unknown rally status.";

                rally += "\nLast rally triggered at <t:" + Math.round(prevRally[0].triggered_at.getTime()/1000) + ":D> <t:" + Math.round(prevRally[0].triggered_at.getTime()/1000) + ":T>.";

                let isInCoolDown = ed.modules.WarManager.cooldownHours > 0;// && ed.sussyModeActivated !== true

                let gapCmt = `There is a gap of **${points.gap}** influence (**${points.gapPt}**)`;

                if (points.gap >= Math.round(points.max[0] / 100)) {
                    const losingAlign = (points.remaining[0] >= points.remaining[1]) ? " Legion" : "n Exile";

                    gapCmt += `\nThere is enough influence to reach the threshold for a${losingAlign} rally!\n(Provided it's been 6 hours since the last rally)`;
                } else gapCmt += "\nThe gap must be bigger than 1% for a rally to become feasible.";

                embeds.push({
                    title: ed.modules.WarManager.activeRegion?.warTitle ?? "unknown region title",
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "unknown user",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    },
                    description: `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\n${gapCmt}\n\n${rally}${(isInCoolDown) ? `\n\nWar has already ended, it is currently in cooldown for ${ed.modules.WarManager.cooldownHours} hours (<t:${Math.round(rawHoursified(ed.modules.WarManager.cooldownHours, ed.modules.WarManager.cooldownLastUpdated).getTime()/1000)}:F>)` : `\n\nThis war has been going on for **${getTime(war ? Date.now () - war.created_at.getTime() : 0, true, "", true)}.`}**\n\nProjected end date: ${war ? discordDate(war.created_at.getTime() + ((timeM - war.created_at.getTime()) / (Number(points.currentPercent[0].slice(0, -1))/100)) ) : "N/A"}`,
                    footer: {
                        text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                    }
                });
                break;
            case "rallies_info":
                if (!war) { embeds.push(lazyEmbed(`Error, a problem occurred trying to get the active war ID (TODO: this needs a rewrite)`)); break; }

                const rallies = await DatabaseManager.helper.getRallies(war.id);

                let count = filter(rallies, v => v.alignment === 1).length;
                let contentParsed = "";

                let sillyThing = false;

                // In case the war didn't have any rallies yet.
                for (let i = rallies.length; i > 0; i--) {
                    let v = rallies[i - 1];

                    if (contentParsed.length > 1900) continue;

                    const time = v.triggered_at.getTime();

                    if (war.id === 28 && sillyThing === false && 1710277236526 > time) {
                        sillyThing = true;
                        contentParsed += `\n\n**!!!**\nTriggered at: <t:1710277236:D> <t:1710277236:T>.\nDetails: **James and Mandatory stopped playing**.`
                    }

                    contentParsed += `\n\n#${i}\nTriggered at: <t:${Math.round(time/1000)}:D> <t:${Math.round(time/1000)}:T>.\nAlignment: **${alignment(v.alignment)}**.`;
                }

                embeds.push({
                    title: "Rallies Info - War ID: " + war.id,
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "unknown",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    },
                    description: `There are ${rallies.length} rallies - Exile ${count}, Legion ${rallies.length-count}.${contentParsed}`,
                    footer: {
                        text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                    }
                });
                break;
        }

        /*if (!epicduel.connected) {
            return interaction.createMessage({ content: "The bot is currently not connected to EpicDuel, please try again later!", flags: 64 });
        }*/

        return interaction.editOriginal({
            embeds, components: [{
                type: 1, components: [{
                    type: 3, customID: "war_select_" + userId, minValues: 1, maxValues: 1, options: [{
                        label: "Basic War Information", value: "basic_info", default: interaction.data.values.raw[0] !== "rallies_info", description: "See the current status of the war."
                    }, {
                        label: "List of Rallies", value: "rallies_info", description: "See all of the rallies under this war.", default: interaction.data.values.raw[0] === "rallies_info",
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, label: "Refresh", style: 1, customID: "refresh_war_info_" + userId, disabled: interaction.data.values.raw[0] === "rallies_info"
                // }, {
                //     type: 2, style: 5, url: "https://doomester.grafana.net/d/xatJoSF4z/ed-war-influence?orgId=1", label: "Metrics", emoji: {name: "📈"}
                }]
            }]
        });
    })