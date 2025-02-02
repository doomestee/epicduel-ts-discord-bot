import { ButtonStyles, ComponentTypes, CreateMessageOptions, Embed, EmbedField, File, MessageActionRow, User } from "oceanic.js";
import SkillsSMBox from "../game/box/SkillsBox.js";
import ImageManager from "../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../config/index.js";
import ItemSBox from "../game/box/ItemBox.js";
import SwarmResources from "../util/game/SwarmResources.js";

export interface IEntitySkill {
    id: number;
    type: number;
    skills: string;
    last_fetched: Date;
}

export default class EntitySkill implements IEntitySkill {
    id: number;
    type: number;
    skills: string;
    last_fetched: Date;

    constructor(data: IEntitySkill) {
        this.id = data.id;
        this.type = data.type;
        this.skills = data.skills;
        this.last_fetched = data.last_fetched;
    }

    /**
     * This actually returns a create message options object
     */
    static async getSkillInfo(skillId: number, user?: User) : Promise<CreateMessageOptions> {
        const info = SkillsSMBox.getSkillInfoById(skillId);

        if (info === null) return { content: "The skill object is inaccessible for the bot." };
        
        const obj = {} as CreateMessageOptions;

        const components:MessageActionRow[] = obj["components"] = [{
            type: ComponentTypes.ACTION_ROW,
            components: [{
                type: ComponentTypes.BUTTON,
                style: ButtonStyles.PRIMARY, customID: "core_0_" + skillId + "_000",
                label: "Skill Info (JSON)",
            }, {
                type: ComponentTypes.BUTTON,
                style: ButtonStyles.LINK,
                label: "Wiki Page", url: "https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(info.skill.skillName),
            }]
        }];

        const files:File[] = obj["files"] = [];

        if (ImageManager.has("cores", info.skill.skillLink + ".png")) {
            files.push({ contents: await readFile(Config.dataDir + "/assets/cores/" + info.skill.skillLink + ".png"), name: info.skill.skillLink + ".png" });
        }

        const fields:EmbedField[] = [];

        if (info.cr) {
            let txt = "Energy: " + info.cr.reqEnergy;

            if (info.cr.reqHealth) txt += "\nHealth: " + info.cr.reqHealth;
            if (info.isCore() && info.core.coreItemCat) txt = "Slot: " + ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[info.core.coreItemCat] + "\n" + txt;

            if (txt) fields.push({ name: "Core", value: txt.trim() });
        } else if (info.isCore() && info.core.coreItemCat) fields.push({ name: "Core", value: "Slot: " + ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[info.core.coreItemCat]});

        if (info.activeSkill) {
            let txt = "";

            if (info.activeSkill.coolDown) txt += "Cooldown: " + info.activeSkill.coolDown + (info.activeSkill.useLimit === 1 ? " (ONE-TIME USE)" : (info.activeSkill.useLimit === 0 ? " (UNLIMITED USE)" : "(" + info.activeSkill.useLimit + " uses)"));
            txt += "\nWarm Up: " + info.activeSkill.warmUp;

            txt += "\nDamage Percent: "+ info.activeSkill.damagePercent + "%";

            if (info.activeSkill.maxTargets > 1) txt += "\nMax Targets: " + info.activeSkill.maxTargets + " (" + info.activeTargetRules?.reqTargets + " required)";
            else txt += "\nMax Target: 1 (" + info.activeTargetRules?.reqTargets + " required)";
            
            if (txt) fields.push({ name: "Active", value: txt.trim() })
        }

        if (info.activeSkill?.createPassive || info.passiveSkill) {
            // Assume that there's no passive object or anything, so will fetch from the boxes directly.

            const passiveRec = SkillsSMBox.recordBySkillId("passive", skillId);

            if (passiveRec) {
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
        }

        obj["embeds"] = [{
            title: SwarmResources.langCheck(info.skill.skillName) + ` ${info.skill.skillId}`,
            description: SwarmResources.langCheck(info.skill.skillDesc).replace(/\#DMGPERCENT/, String(info.activeSkill?.damagePercent ? info.activeSkill.damagePercent + "%" : "N/A")),
            thumbnail: {
                url: (files.length) ? "attachment://" + info.skill.skillLink + ".png" : "",
            },
            fields,
            author: user ? {
                name: user.username,
                iconURL: user.avatarURL()
            } : undefined
        }];

        return obj;
    }
}