import SkillsSMBox from "../../game/box/SkillsBox.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";
import EntitySkill from "../../Models/EntitySkill.js";

export default new Command(CommandType.Application, { cmd: ["core", "search"], cooldown: 5000, usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        if (SkillsSMBox.objMap.all.size === 0) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const skillId = interaction.data.options.getInteger("name") ?? -1;

        if (skillId < 0) return interaction.reply({ content: "unknown core id", flags: 64 });

        return interaction.createFollowup(await EntitySkill.getSkillInfo(skillId, interaction.user));
    });

// const { readFile } = require("fs/promises");
// const { ComponentTypes, ButtonStyles, ApplicationCommandTypes } = require("oceanic.js");
// const Command = require("../../structures/Command");
// const { ITEM_CATEGORY_MAPPED_BY_ID } = require("../../server/structures/box/ItemBox");