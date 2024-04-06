import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import { getHighestTime } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";

export default new Command(CommandType.Application, { cmd: ["war", "leader"], description: "Sees who's currently leading the war.", waitFor: ["EPICDUEL"], cooldown: 3000, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        const time = process.hrtime.bigint();

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.createMessage(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const alignId = interaction.data.options.getInteger("alignment") as 1 | 2 | undefined ?? 1;
        const mode = interaction.data.options.getInteger("mode") as 1 | 2 | undefined ?? 1;
        const regionId = interaction.data.options.getInteger("region");

        const response = await ed.modules.WarManager.fetchLeaders(alignId, mode, regionId);

        if (!response.success) return interaction.reply({ content: "The request for war leaders timed out.", flags: 64 });

        const result = response.value;

        console.log(result);
        console.log(ed.boxes.war.getRegionById(result.regionId));

        return interaction.reply({
            embeds: [{
                title: (result.mode === 1 ? "Daily " : "Overall ") + ed.boxes.war.getRegionById(result.regionId)?.warTitle + " Leaders" + (alignId === 1 ? " - Exile" : " - Legion"),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                description: (result === undefined) ? "Sorry, there has been a problem fetching the war leaders, the developer has been notified." : result.player.map((v, i) => (i+1) + ". " +  v[0] + " - " + v[1]).join("\n"),
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }
            }],
            components: [{
                type: 1, components: [{
                    type: 3, customID: "war_leader_select_" + alignId + "_" + result.mode + "_" + result.regionId + "_" + interaction.user.id, minValues: 1, maxValues: 1, disabled: false, options: [{
                        label: "Player", value: "player", default: true, description: "Shows the top 20 " + (result.mode === 1 ? "daily" : "overall") + " players.", emoji: { name: "ArcadeToken", id: "1109227594462810142" }
                    }, {
                        label: "Faction", value: "faction", default: false, description: "Shows the top 20 " + (result.mode === 1 ? "daily" : "overall") + " factions.", emoji: { name: "faction", id: "1069333514811609138" }
                    }, {
                        label: "Info", value: "info", default: false, description: "Shows the basic information regarding to this previous war."
                    }, {
                        label: "List of Rallies", value: "rally", default: false, description: "Shows the list of the rallies that have taken place during this war."
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, label: "Refresh", style: 1, customID: "refresh_war_leader_info_" + interaction.user.id, disabled: true
                }]
            }]
        })
    })