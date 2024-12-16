import { ButtonStyles, ComponentTypes, MessageActionRow, File, EmbedField } from "oceanic.js";
import SkillsSMBox from "../../game/box/SkillsBox.js";
import Command, { CommandType } from "../../util/Command.js";
import ImageManager from "../../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../../config/index.js";
import ItemSBox from "../../game/box/ItemBox.js";
import { SwarmError } from "../../util/errors/index.js";
import { getHighestTime } from "../../util/Misc.js";
import SwarmResources from "../../util/game/SwarmResources.js";

export default new Command(CommandType.Application, { cmd: ["core", "search"], cooldown: 5000, usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        if (ItemSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const time = process.hrtime.bigint();

        const skillId = interaction.data.options.getInteger("name") ?? -1;

        if (skillId < 0) return interaction.reply({ content: "unknown core id", flags: 64 });

        let core = SkillsSMBox.getSkillInfoById(skillId);//epicduel.getSkillInfoById(parseInt(skillId));

        if (core === null) return interaction.createFollowup({ content: "The core records returned null? Try again later please."});

        let components:MessageActionRow[] = [{
            type: ComponentTypes.ACTION_ROW,
            components: [{
                type: ComponentTypes.BUTTON,
                style: ButtonStyles.PRIMARY, customID: "core_0_" + skillId + "_000",
                label: "Skill Info (JSON)",
            }, {
                type: ComponentTypes.BUTTON,
                style: ButtonStyles.LINK,
                label: "Wiki Page", url: "https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(core.skill.skillName),
            }]
        }]

        let files:File[] = [];

        if (ImageManager.has("cores", core.skill.skillLink + ".png")) {
            files.push({ contents: await readFile(Config.dataDir + "/assets/cores/" + core.skill.skillLink + ".png"), name: "core.png" });
        }

        let fields:EmbedField[] = [];

        if (core.cr) {
            let txt2 = ``;

            txt2 += "Energy: " + core.cr.reqEnergy;
            if (core.cr.reqHealth) txt2 += "\nHealth: " + core.cr.reqHealth;
            if (core.isCore() && core.core?.coreItemCat) txt2 = "Slot: " + ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[core.core.coreItemCat] + "\n" + txt2;

            if (txt2) fields.push({ name: "Core", value: txt2.trim() });
        } else {
            if (core.isCore() && core.core?.coreItemCat) fields.push({ name: "Core", value: "Slot: " + ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[core.core.coreItemCat]})
        }

        let passive = (id=skillId) => {
            // Assume that there's no passive object or anything, so will fetch from the boxes directly.

            const passiveRec = SkillsSMBox.recordBySkillId("passive", skillId);//.passive.find(v => v.skillId === skillId);

            if (!passiveRec) return;

            const passiveMiscRules = SkillsSMBox.objMap.passiveMiscRules.get(passiveRec.miscRulesId);
            const passiveStatRules = SkillsSMBox.objMap.passiveStatRules.get(passiveRec.statRulesId);

            let txt = `Duration: ${passiveRec.duration == 0 ? "Unlimited" : passiveRec.duration + " rounds"}.\nIs Debuff: ${passiveRec.isDebuff}.\nGroup ID: ${passiveRec.passiveRestrictGroupId}`;

            fields.push({ name: "Passive", value: txt});

            components[0].components = [components[0].components[0], {
                type: ComponentTypes.BUTTON,
                style: ButtonStyles.PRIMARY, customID: "core_1_" + skillId + "_000",
                label: "Passive Info (JSON)",
            }, components[0].components[1]];
        }

        if (core.activeSkill) {
            let txt = ``;

            if (core.activeSkill.coolDown) txt += "Cooldown: " + core.activeSkill.coolDown + ((core.activeSkill.useLimit) === 1 ? " (ONE-TIME USE)" : (core.activeSkill.useLimit === 0) ? " (UNLIMITED USE)" : " (" + core.activeSkill.useLimit + " uses)");
            /*if (core.activeSkill.warmUp)*/ txt += "\nWarm Up: " + core.activeSkill.warmUp;

            txt += "\nDamage Percent: "+ core.activeSkill.damagePercent + "%";

            if (core.activeSkill.maxTargets > 1) txt += "\nMax Targets: " + core.activeSkill.maxTargets + " (" + core.activeTargetRules?.reqTargets + " required)";
            else txt += "\nMax Target: 1 (" + core.activeTargetRules?.reqTargets + " required)";
            
            if (txt) fields.push({ name: "Active", value: txt.trim() })

            if (core.activeSkill.createPassive) passive();
        } else if (core.passiveSkill) passive();

        let parse = (con: string) => { if (SwarmResources.languages[con]) return SwarmResources.languages[con]; else return con; }

        return interaction.createFollowup({
            embeds: [{
                title: parse(core.skill.skillName) + " (" + core.skill.skillId + ")",
                description: parse(core.skill.skillDesc).replace(/\#DMGPERCENT/, String(core.activeSkill?.damagePercent ? core.activeSkill.damagePercent + "%" : "N/A")),
                thumbnail: {
                    url: (files.length) ? "attachment://core.png" : ""
                }, author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }, fields,
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }
            }], files, components//[{ name: "core.png", contents: await readFile("/data/cores/" + core.skill.skillLink + ".png")}],
        })
    });

// const { readFile } = require("fs/promises");
// const { ComponentTypes, ButtonStyles, ApplicationCommandTypes } = require("oceanic.js");
// const Command = require("../../structures/Command");
// const { ITEM_CATEGORY_MAPPED_BY_ID } = require("../../server/structures/box/ItemBox");