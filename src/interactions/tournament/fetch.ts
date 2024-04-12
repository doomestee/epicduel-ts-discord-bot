import { ButtonStyles, ComponentTypes, EmbedField, MessageComponent } from "oceanic.js";
import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";

export default new Command(CommandType.Application, { cmd: ["tournament", "fetch"], waitFor: ["EPICDUEL", "LOBBY"], cooldown: 3000, gateVerifiedChar: 1 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        const time = process.hrtime.bigint();

        if (!interaction.acknowledged) await interaction.defer();

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.createMessage(SwarmError.noClient());

        const result = await ed.modules.Tournament.getLeaders();

        if (!result.success) return interaction.reply({content: "Unable to grab the tournament! Bot faced errors trying to fetch the information.", flags: 64});

        const leaders = result.value;

        const aggregates:EmbedField[] = [{name: "Top 17", value: "", inline: true}];

        let indexes = [0];
        let lastIndex = 0;

        for (let i = 0; i < leaders.length; i++) {
            if (indexes[lastIndex] > 900 || (i !== 0 && i % 17 === 0)) {
                indexes.push(0);
                lastIndex++;

                let x = (lastIndex + 1) * 17;

                aggregates.push({name: "Top " + ((x <= leaders.length) ? x : leaders.length), value: "", inline: true});
            }

            aggregates[lastIndex].value += (i + 1) + ". " + leaders[i].name + " - " + leaders[i].score + "\n";
        }

        let components:MessageComponent[] = [{
            type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
            label: "Refresh", customID: "refresh_tourney_" + interaction.user.id// + "_tournament"
        }];

        // if (client.isMaintainer(interaction.user.id)) {
        //     components.push({
        //         type: 2, style: 2, label: "[DEV] Auto-Refresh", customID: "automatic_refresh_tournament"
        //     }); components.reverse();
        // }

        return interaction.createFollowup({embeds: [{
            title: ed.modules.Tournament.name,
            /*description: leaders.map((v, i) => {
                return (i + 1) + `. ${v.name} - ` + v.score
            }).join("\n"),*/
            fields: aggregates,
            author: {
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()
            }, footer: {
                text: (ed.modules.Tournament.minutesUntilStart > 0) ? "Tournament starts at" : "Tournament ends at"
            }, timestamp: new Date(ed.modules.Tournament.fetchedAt + ((ed.modules.Tournament.minutesUntilStart > 0) ? (ed.modules.Tournament.minutesUntilStart * 60 * 1000) : (ed.modules.Tournament.minutesUntilEnd * 60 * 1000))).toISOString()
        }], components: [{
            type: 1, components
        }]});
    });