import ItemSBox from "../../game/box/ItemBox.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";
import { getHighestTime } from "../../util/Misc.js";
import { Item } from "../../Models/Item.js";

export default new Command(CommandType.Application, { cmd: ["item", "search"], description: "Shows description and stuff about an item.", cooldown: 1000, usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        if (ItemSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const itemId = interaction.data.options.getInteger("name", true);
        const item = ItemSBox.objMap.get(itemId);

        if (itemId < 0 || !item) return interaction.reply({ content: "There's no item for that ID (" + itemId + ")" });

        if (!interaction.acknowledged) await interaction.defer();

        const { components, embeds, files } = await Item.resultify(item);

        embeds[0]["author"] = {
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL()
        };

        embeds[embeds.length - 1]["footer"] = {
            text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
        };

        return interaction.createFollowup({
            embeds,
            components,
            files
        });

    });