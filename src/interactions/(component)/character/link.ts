import Swarm from "../../../manager/epicduel.js";
import Command, { CommandType } from "../../../util/Command.js";
import { generatePhrase } from "../../../util/Phrase.js";
import { SwarmError } from "../../../util/errors/index.js";

export default new Command(CommandType.Component, { custom_id: "character_link" })
    .attach('run', async ({ client, interaction, variables }) => {
        const ed = Swarm.getClient(v => v.connected && v.lobbyInit && v.smartFox.getActiveRoom()?.name !== "Lobby");

        if (!ed || !ed.lobbyInit) return interaction.createMessage(SwarmError.noClient());

        await interaction.defer(64);

        const room = ed.smartFox.getActiveRoomFr();

        let instruction = "You must say this code in room **" + room.name.slice(0, -2) + "**, world **" + room.name.slice(-1) + "**.\n\nNote that the bot is invisible so can't be seen (thanks EpicDuel's security) so you will receive either a direct message from the bot, or in case the DM fails, you'll be pinged in this channel."
        
        const has = client.cache.codes.findIndex(v => v && v[0] === interaction.user.id);
        if (has !== -1) {
            // Allow for 5 seconds grace, cos this is practically unrealistic for the user to verify when they were reminded of their code just a few seconds before it expires.
            if (Date.now() < (client.cache.codes[has][2] - 5000)) return interaction.reply({embeds: [{ description: `The code is still \`${client.cache.codes[has][1]}\`, this will expire by either when the bot restarts (the code is temporarily cached) or <t:${Math.floor(client.cache.codes[has][2]/1000)}:R>.\n\n` + instruction }], flags: 64});
            else delete client.cache.codes[has];
        }

        const code = generatePhrase(4, 1, ' ');

        client.cache.codes.push([interaction.user.id, code, Date.now() + 1000*60*10, interaction.applicationID, interaction.token]);

        return interaction.createFollowup({content: `Your code: \`${code}\`.\nThe code will expire in **10 minutes**.\n\n` + instruction, flags: 64})
    });