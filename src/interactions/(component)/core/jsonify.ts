import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import SkillsSMBox from "../../../game/box/SkillsBox.js";
import PassiveRecord from "../../../game/record/skills/PassiveRecord.js";

export default new Command(CommandType.Component, { custom_id: "core_<type>_<skillId>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const type = parseInt(variables.type);
        const skillId = parseInt(variables.skillId);
        const userId = (variables.userId);

        let bypass = false;

        if (userId === "000") bypass = true;
        else if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());//createMessage({content: "You are not the person who've used the command, or lacks sufficient permission!", flags: 64});

        if (SkillsSMBox.objMap.all.size === 0) return interaction.reply(SwarmError.noClient());

        const core = SkillsSMBox.getSkillInfoById(skillId);

        if (core === null) return interaction.reply({ flags: 64, content: "The records for that ID does not exist? Or something went wrong as the parser may have errored processing the records associated with the ID, this can happen if there's been a new balance update." });

        await interaction.defer(64);

        let json = null;
        
        switch (parseInt(variables.type)) {
            case 0:
                json = core;//.skillValue;

                // for (let ding of ["constVariables", "mode", "level"]) {
                //     delete json[ding];
                // }
                break;
            case 1:
                const passiveRec =       SkillsSMBox.recordBySkillId("passive", skillId) as PassiveRecord;//.objList.passive.find(v => v.skillId === variables.skillId);
                const passiveMiscRules = SkillsSMBox.objMap.passiveMiscRules.get(passiveRec.miscRulesId);//objList.passiveMiscRules.find(v => v.miscRulesId === passiveRec.miscRulesId);
                const passiveStatRules = SkillsSMBox.objMap.passiveStatRules.get(passiveRec.statRulesId);//objList.passiveStatRules.find(v => v.statRulesId === passiveRec.statRulesId);

                json = {
                    info: passiveRec,
                    misc: passiveMiscRules,
                    stat: passiveStatRules
                };
                break;
        }

        return interaction.createFollowup({
            files: [{
                name: "skillObject.json",
                //@ts-expect-error Blob could always accept a string so ill not construct it into a Buffer
                contents: (JSON.stringify(json, undefined, 2))
            }]
        })
    });