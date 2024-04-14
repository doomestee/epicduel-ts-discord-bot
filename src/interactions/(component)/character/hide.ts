import { ButtonStyles, ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import DatabaseManager from "../../../manager/database.js";
import { find } from "../../../util/Misc.js";

export default new Command(CommandType.Component, { custom_id: "hide_<toggle>_<charId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        let bypass = false;

        // const toggle = (variables.toggle === "1");
        const charId = parseInt(variables.charId);

        await interaction.defer(64);

        const [charLink] = await DatabaseManager.helper.getCharacterLinks(charId);

        // const char = find(charLinks, v => v.id === charId);

        if (!charLink) return interaction.reply({ content: "This character does not have a linked discord user.", flags: 64 });

        if (charLink.discord_id === interaction.user.id) bypass = true;

        // for maintainers
        if (client.isMaintainer(interaction.user.id)) bypass = true;
        if (bypass === false) return interaction.createFollowup({ content: "You do not have the authorisation to manage this character.", flags: 64 });

        let isHidden = (charLink.link_flags & 1 << 4) !== 0;

        await DatabaseManager.update("characterlink", { id: charId, user_id: charLink.user_id }, { flags: isHidden ? charLink.link_flags - (1 << 4) : charLink.link_flags + (1 << 4) });

        return interaction.reply({
            content: `The selected character is ${isHidden ? "no longer" : "now"} hidden!`,
            flags: 64
        });
    });