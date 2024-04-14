import { InteractionTypes } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager, { quickDollars } from "../../manager/database.js";

export default new Command(CommandType.Application, { cmd: ["track"], description: "Command that provides additional information...", usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        // idk why is typescript type narrowing weird
        if (interaction.guild === undefined) return;

        if (!client.isMaintainer(interaction.user.id) && !["540224423567949834", "950028793450483712"].some(v => v === interaction.user.id)) return;

        const links = await DatabaseManager.helper.getCharacterLinks(interaction.user.id);

        if (links.length === 0) {
            return interaction.createMessage({
                content: "You have no linked character."
            });
        }

        const list:number[] = [];

        for (let i = 0; i < links.length; i++) {
            const char = links[i];

            if (char.link_flags & 1 << 5) continue;

            char.link_flags += 1 << 5;
            list.push(char.id);
        }

        if (list.length === 0) return interaction.createMessage({ content: "All of your linked characters are being tracked." });

        await DatabaseManager.cli.query(`UPDATE characterlink SET flags = flags + ${(1 << 5)} WHERE id IN (${quickDollars(list)})`, list);;

        return interaction.createMessage({ content: "All of your linked characters are now being tracked, this only works if they're a buddy of the bot's character in game.\nOnce a character is detected to go off, it will no longer be tracked to check for disconnection so you'll have to use the command again.\n*TODO: add a button*"});
    });