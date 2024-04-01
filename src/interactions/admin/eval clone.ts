import { ButtonStyles, ComponentTypes, Constants } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import Config from "../../config/index.js";
import { inspect } from "util";
import DatabaseManager from "../../manager/database.js";
import Swarm from "../../manager/epicduel.js";

export default new Command(CommandType.Application, { cmd: ["youre-gay"]})
    .attach("run", async ({ client, interaction }) => {

        // For intellisense
        if (interaction.type !== 2) return;

        if (!client.isMaintainer(interaction.user.id)) return interaction.createMessage({content: "You are not a bot admin!", flags: 64});
        // await interaction.defer();

        const a = interaction.data.options.getString("a");

        return interaction.createMessage({
            content: a ?? "sike",
            flags: a ? 4096 : 64
        });
    })