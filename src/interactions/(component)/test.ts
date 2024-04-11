import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "test" })
    .attach("run", ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        //let variables = {};// as Record<ParamsKey<"sussy_<baka>_<wanker>">, string>;

        return interaction.createMessage({ content: "Sussico" });
    });