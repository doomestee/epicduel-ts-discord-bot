import { ButtonStyles, ComponentTypes, Embed, MessageComponent } from "oceanic.js";
import Swarm from "../../../manager/epicduel.js";
import Command, { CommandType } from "../../../util/Command.js";

//((v, i) => (i + 26) + `. ${v.name} - ${v.point}`).join("\n")

const mapper = (v: Array<{ point: number, name: string }>) => {
    let res = "";

    for (let i = 0, len = v.length; i < len; i++) {
        res += (i + 26) + `. ${v[i].name} - ${v[i].point}\n`
    }

    return res.trimEnd();
}

export default new Command(CommandType.Application, { cmd: ["gifting", "board", "fetch"], waitFor: ["EPICDUEL", "LOBBY"], cooldown: 3000, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;
        //await interaction.defer();

        //const type = focused.options.find(v => v.name === "type") ? focused.options.find(v => v.name === "type").value : 1;

        const cli = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!cli) return interaction.reply({ content: `this message should not be possible to receive, contact developer.` });

        if (!cli.lobbyInit) return interaction.reply({content: "Woops, the bot is still in the lobby, this means it hasn't joined a room yet... for some reason.", flags: 64});

        await interaction.defer();

        const result = await cli.modules.Advent.getGiftLeaders();//.fetchTournament().catch((err) => { logger.error(err); return {error: err}});

        if (!result.success) return interaction.createFollowup({content: "Unable to grab the gifting leaders! You may have to try again.", flags: 64});

        const leaders = result.value;

        let components:MessageComponent[] = [{
            type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
            label: "Refresh", customID: "refresh_" + interaction.user.id + "_gifting",
            disabled: true
        }];

        let embeds:Embed[] = [{
            title: "Gifting Leaderboard",
            author: {
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()
            },
            fields: [{
                name: "Overall",
                value: leaders.season.slice(0, 25).map((v, i) => {
                    return (i + 1) + `. ${v.name} - ` + v.point
                }).join("\n"), inline: true
            }]
        }]

        // let fields = [{
        //     name: "Overall",
        //     value: leaders.season.map((v, i) => {
        //         return (i + 1) + `. ${v.name} - ` + v.point
        //     }).join("\n"), inline: true
        // }];

        if (leaders.daily.length) {
            embeds[0].fields?.push({
                name: "Daily", value: leaders.daily.slice(0, 25).map((v, i) => {
                    return (i + 1) + `. ${v.name} - ` + v.point
                }).join("\n"), inline: true
            });
        }

        if (leaders.daily.length > 25 || leaders.season.length > 25) {
            embeds[1] = { fields: [] };

            if (leaders.season.length > 25 && embeds[1]["fields"]) embeds[1]["fields"][0] = { name: "Overall", value: mapper(leaders.season.slice(25)), inline: true };
            if (leaders.daily.length > 25 && embeds[1]["fields"]) embeds[1]["fields"].push({ name: "Overall", value: mapper(leaders.daily.slice(25)), inline: true });
        }

        return interaction.createFollowup({embeds, components: [{
            type: 1, components
        }]});
    })