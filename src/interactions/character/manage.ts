import Character from "../../Models/Character.js";
import DatabaseManager from "../../manager/database.js";
import Command, { CommandType } from "../../util/Command.js";

export default new Command(CommandType.Application, { cmd: ["character", "manage"], cooldown: 5000, usableEdRestricted: false })
    .attach("run", async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        await interaction.defer(64);

        const links = await DatabaseManager.helper.getCharacterLinks(interaction.user.id);

        if (!links.length) return interaction.reply({ content: "You do not have a linked character to manage." });

        let dom = links[0];
        let domIndex = 0;

        for (let i = 1; i < links.length; i++) {
            if (links[i].exp > dom.exp) {
                dom = links[i];
                domIndex = i;
            }
        }

        console.log(dom);

        return interaction.reply(Character.manageify(domIndex, links));
    });