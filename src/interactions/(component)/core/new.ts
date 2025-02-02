import SkillsSMBox from "../../../game/box/SkillsBox.js";
import Command, { CommandType } from "../../../util/Command.js";
import { SwarmError } from "../../../util/errors/index.js";
import EntitySkill from "../../../Models/EntitySkill.js";

export default new Command(CommandType.Component, { custom_id: "core_open_<skillId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (SkillsSMBox.objMap.all.size === 0) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const skillId = parseInt(variables.skillId);

        if (skillId < 0) return interaction.reply({ content: "unknown core id", flags: 64 });

        return interaction.createFollowup(await EntitySkill.getSkillInfo(skillId, interaction.user));
    })