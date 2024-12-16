import { ButtonStyles, ComponentTypes, Embed, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js"
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import MerchantSBox from "../../../game/box/MerchantBox.js";
import DatabaseManager from "../../../manager/database.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "../../../game/box/ItemBox.js";
import { discordDate, find, lazyTrimStringList, map } from "../../../util/Misc.js";
import { Entity, IEntityStat, IStat } from "../../../Models/EntityStat.js";
import { IEntitySkill } from "../../../Models/EntitySkill.js";
import ClassBox from "../../../game/box/ClassBox.js";
import SkillsSMBox from "../../../game/box/SkillsBox.js";
import SwarmResources from "../../../util/game/SwarmResources.js";

/**
 * @param {{ str: number, dex: number, tech: number, supp: number }} statical
 */
let lazyStat = (statical: IStat) => {
    return `Str: ${statical.str || 0}\nDex: ${statical.dex || 0}\nTech: ${statical.tech || 0}\nSupp: ${statical.supp || 0}`;
}

/*

type is 0 or 1 (npc or leg npc respectively)
~~arg is only used for type 0 and 1, for merchId.~~

*/
export default new Command(CommandType.Component, { custom_id: "stat_<type>_<entityId>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        if (MerchantSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const entityId = parseInt(variables.entityId);
        const type = parseInt(variables.type);
        const { userId } = variables;

        let bypass = false;

        if (userId === "000") bypass = true;
        else if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());//({content: "You are not the original person who've used the command!", flags: 64});
        
        const merchant = MerchantSBox.objMap.get(entityId);

        if (!merchant) return interaction.reply({ flags: 64, content: "There are no merchants with the ID given." });

        // const merc = await DatabaseManager.helper.getMerchant(merchId);

        let npcId = type === 0 ? merchant.npcId : find(merchant.opts, v => v.id === 9 && v.args[0] >= 100 && v.args[0] < 200)?.args[1];

        if (!npcId) return interaction.reply({ content: "ERROR, it may be a code issue as the bot is unable to get the npc ID", flags: 64 });

        if (!interaction.acknowledged) await interaction.defer();

        console.log(npcId);

        const [entityStat] = await DatabaseManager.cli.query<IEntityStat>(`SELECT * FROM entity_stat WHERE id = $1 AND type <> 0 limit 1`, [npcId]).then(v => v.rows);
        const [entitySkill] = await DatabaseManager.cli.query<IEntitySkill>(`SELECT * FROM entity_skill WHERE id = $1 AND type <> 0 limit 1`, [npcId]).then(v => v.rows);

        if (!entityStat || !entitySkill || entityStat.classid == null) return interaction.editOriginal({ content: "TBD, the command works for most NPCs but not all, either that or I somehow did not fetch this NPC properly.", flags: 64 });//({ content: "TBD, it's currently supported for some npcs (one is mysterious man) atm." });

        const entity = new Entity(entityStat);

        const { armor, wpn, gun, aux, bot } = entity;

        const skills = entitySkill.skills.split("#").map(v => map(v.split("|"), Number)) as [number, number][];

        let gEmojis = client.emojiObjs;

        let itemify = (id: number) => { let item = ItemSBox.objMap.get(id); return item ? ("[" + item.itemName + "](https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(item.itemName) + ")") : "N/A"; }

        return interaction.createFollowup({
            embeds: [{
                title: merchant.mercName + "'s Stats",
                description: `${entity.hp} HP\n${entity.mp} MP\n\n${lazyStat(entity.stat)}\nClass: ${ClassBox.CLASS_NAME_BY_ID[entity.classy.id]}\n\nLast fetched: ${discordDate(entity.last_fetched)}`,

                fields: [{
                    name: "Armor",
                    value: armor.id == -1 || armor.id == null ? "None equipped." : `Equipped: ${itemify(armor.id)} (ID: ${armor.id})\nDef: ${armor.bonus.def || 0}\nRes: ${armor.bonus.res || 0}\n${lazyStat(armor.stat)}`,
                    inline: true
                }, {
                    name: "Primary",
                    value: wpn.id == -1 || wpn.id == null ? "None equipped." : `Equipped: ${itemify(wpn.id)} (ID: ${wpn.id})\nDamage: ${wpn.dmg || 0}\n${lazyStat(wpn.stat)}\n`,
                    inline: true
                }, {
                    name: "Sidearm",
                    value: gun.id == -1 || gun.id == null ? "None equipped." : `Equipped: ${itemify(gun.id)} (ID: ${gun.id})\nDamage: ${gun.dmg || 0}\n${lazyStat(gun.stat)}\n`,
                    inline: true
                }, {
                    name: "Auxiliary",
                    value: aux.id == -1 || aux.id == null ? "None equipped." : `Equipped: ${itemify(aux.id)} (ID: ${aux.id})\nDamage: ${aux.dmg || 0}\n${lazyStat(aux.stat)}\n`,
                    inline: true
                }, {
                    name: "Robot",
                    value: bot.id == -1 || bot.id == null ? "None equipped." : `Equipped: ${itemify(bot.id)} (ID: ${bot.id})`,//"ID: " + bot.id,
                    inline: true
                }]
            }, {
                title: "Skills",
                fields: map(skills, skill => {
                    let [id, lvl] = skill;//skills.find(v => v[0] === skill.skillId) || [skill.skillId, 1, true];

                    let skillInfo = SkillsSMBox.getSkillInfoById(id);

                    if (!skillInfo) return {
                        name: "unknown skill",
                        value: "unknown skill, id: " + id
                    }

                    let sName = SwarmResources.langCheck(skillInfo.skill.skillName);
                    let eName = sName.replace(/( |-)/g, "");

                    if (gEmojis[eName] == undefined && gEmojis[skillInfo.skill.skillLink]) eName = skillInfo.skill.skillLink;

                    let energyCost = skillInfo.cr.reqEnergy + (skillInfo.cr.reqEnergyStep ? skillInfo.cr.reqEnergyStep * lvl : 0);
                    let unit = skillInfo.isTree() ? skillInfo.tree.getLevelValue(lvl) + " " + SwarmResources.langCheck(skillInfo.skill.skillUnit) + "\n" : ""

                    return {
                        name: sName,
                        value: `<:${eName}:${gEmojis[eName]}> Lvl: ${lvl}\nEnergy Cost: ${energyCost} ${skillInfo.skill.skillPassive ? "(Passive)" : ""}\n${unit}\n${SwarmResources.langCheck(skillInfo.skill.skillDesc)}`,
                        inline: true
                    }
                }),
                footer: {text: "Last fetched"},
                timestamp: entitySkill.last_fetched.toISOString()
            }]
        });
    })