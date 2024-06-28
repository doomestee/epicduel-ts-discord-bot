import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { CharPageResult, discordDate, getCharPage, getHighestTime } from "../../../util/Misc.js";
import DatabaseManager from "../../../manager/database.js";
import { IUserRecord } from "../../../Models/UserRecord.js";
import ItemUtil from "../../../util/Item.js";
import Character, { ICharacter } from "../../../Models/Character.js";
import { ICharacterName } from "../../../Models/CharacterName.js";

export default new Command(CommandType.Component, { custom_id: "char_menu_<userId>_<arg>" })
    .attach("run", async ({ client, interaction, variables: { userId, arg } }) => {
        if (interaction.type !== 3) return;
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        //let variables = {};// as Record<ParamsKey<"sussy_<baka>_<wanker>">, string>;

        let bypass = true; // For now, anybody can populate wins ofc, but just in case ig.

        if (userId === "000") bypass = true;
        else if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.createMessage({content: "You are not the person who've used the command, or you don't have the permission!", flags: 64});

        // if (!["0", "1", "2"].some(v => type === v)) return interaction.createMessage({content: "For now, this bot can only populate details for characters.", flags: 64});

        // if (variables.type === "2") {
        //     await interaction.defer(); // new message

        //     let name = interaction.message.embeds[0].title;

        //     /**
        //      * @type {CharacterSkills}
        //      */
        //     let userStat = await database.cli.query(`SELECT * from entity_stat WHERE id = $1 AND type = 0`, [variables.charid]).then(v => v.rows);
        //     let userSkill = await database.cli.query(`SELECT * from entity_skill WHERE id = $1 AND type = 0`, [variables.charid]).then(v => v.rows);

        //     if (userStat.length === 0 || userSkill.length === 0 || userStat[0].classid == null) return interaction.editOriginal({ content: "The character hasn't bumped into the bot, so its stats/skills hasn't been tracked." });

        //     let { hp, mp, armor, aux, gun, last_fetched, legendary, wpn, bot, stat, classy: {id: classid} } = new CharacterSkills(userStat[0]);

        //     /**
        //      * @param {{ str: number, dex: number, tech: number, supp: number }} statical
        //      */
        //     let lazyStat = (statical) => {
        //         return `Str: ${statical.str || 0}\nDex: ${statical.dex || 0}\nTech: ${statical.tech || 0}\nSupp: ${statical.supp || 0}`;
        //     }

        //     // Skills

        //     /**
        //      * @type {[number, number][]}
        //      */
        //     let skills = userSkill[0].skills.split("#").map(v => v.split("|").map(s => parseInt(s)));

        //     let gEmojis = client.emojiObjs;

        //     let lang = (v="") => { return epicduel.languages[v] || v;};

        //     let classCores = epicduel.client.boxes.skills.objMap.tree.filter(v => v.classId === classid)
        //         .sort((a, b) => { if (a.treeRow !== b.treeRow) return a.treeRow - b.treeRow; return a.treeColumn - b.treeColumn; });

        //     let itemify = (id) => { let item = epicduel.client.boxes.item.objMap.get(id); return item ? ("[" + item.itemName + "](https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(item.itemName) + ")") : "N/A"; }

        //     return interaction.editOriginal({
        //         embeds: [{
        //             title: name,
        //             description: `${hp} HP\n${mp} MP\n\nClass: ${ClassBox.CLASS_NAME_BY_ID[classid]}\n${lazyStat(stat)}\n\nLast fetched: ${lazyFormatTime(last_fetched)}`,

        //             fields: [{
        //                 name: "Armor",
        //                 value: armor.id == -1 || armor.id == null ? "None equipped." : `Equipped: ${itemify(armor.id)} (ID: ${armor.id})\nDef: ${armor.bonus.def || 0}\nRes: ${armor.bonus.res || 0}\n${lazyStat(armor.stat)}`,
        //                 inline: true
        //             }, {
        //                 name: "Primary",
        //                 value: wpn.id == -1 || wpn.id == null ? "None equipped." : `Equipped: ${itemify(wpn.id)} (ID: ${wpn.id})\nDamage: ${wpn.dmg || 0}\n${lazyStat(wpn.stat)}\n`,
        //                 inline: true
        //             }, {
        //                 name: "Sidearm",
        //                 value: gun.id == -1 || gun.id == null ? "None equipped." : `Equipped: ${itemify(gun.id)} (ID: ${gun.id})\nDamage: ${gun.dmg || 0}\n${lazyStat(gun.stat)}\n`,
        //                 inline: true
        //             }, {
        //                 name: "Auxiliary",
        //                 value: aux.id == -1 || aux.id == null ? "None equipped." : `Equipped: ${itemify(aux.id)} (ID: ${aux.id})\nDamage: ${aux.dmg || 0}\n${lazyStat(aux.stat)}\n`,
        //                 inline: true
        //             }, {
        //                 name: "Robot",
        //                 value: bot.id == -1 || bot.id == null ? "None equipped." : `Equipped: ${itemify(bot.id)} (ID: ${bot.id})`,//"ID: " + bot.id,
        //                 inline: true
        //             }]
        //         }, {
        //             title: "Skills",
        //             fields: classCores.map(skill => {
        //                 let [id, lvl, hasOnnt] = skills.find(v => v[0] === skill.skillId) || [skill.skillId, 1, true];

        //                 let skillInfo = epicduel.getSkillInfoById(id);
        //                 let sName = lang(skillInfo.skill.skillName);
        //                 let eName = (hasOnnt ? "U" : "") + sName.replace(/( |-)/g, "");

        //                 let energyCost = skillInfo.cr.reqEnergy + (skillInfo.cr.reqEnergyStep ? skillInfo.cr.reqEnergyStep * lvl : 0);
        //                 let unit = skillInfo.tree ? skillInfo.tree.getLevelValue(lvl) + " " + lang(skillInfo.skill.skillUnit) + "\n" : ""

        //                 return {
        //                     name: sName,
        //                     value: `<:${eName}:${gEmojis[eName]}> Lvl: ${hasOnnt ? 0 : lvl}\nEnergy Cost: ${energyCost} ${skillInfo.skill.skillPassive ? "(Passive)" : ""}\n${unit}\n${lang(skillInfo.skill.skillDesc)}`,
        //                     inline: true
        //                 }
        //             }),
        //             footer: {text: "Last fetched"},
        //             timestamp: userSkill[0].last_fetched
        //         }]
        //     });

            
        // }

        await interaction.defer();

        let actualId = interaction.data.values.getStrings()[0];
        let actualPg:CharPageResult | undefined;

        // From leaderboard
        if (arg === "1") {
            actualPg = await getCharPage(actualId);

            if (actualPg.success) actualId = actualPg.result.charId;
            else return interaction.reply({ content: "The character must have changed their name, as the bot was unable to get the character page." });
        }

        // From character search menu
        if (arg === "0") {
            actualId = actualId.split("#")[0];
        }

        const time = process.hrtime.bigint();

        const charId = Number(actualId);
        const [charLinkFact] = await DatabaseManager.cli.query<ICharacter & { discord_id: string, link_flags: number, fact_name: string, fact_alignment: 1|2 }>(`select char.*, link.discord_id, link.flags as link_flags, faction.name as fact_name, faction.alignment as fact_alignment from character as char left join characterlink as link on link.user_id = char.user_id and link.id = char.id left join faction on faction.id = char.faction_id where char.id = $1`, [charId]).then(v => v.rows);

        let charPg = actualPg || await getCharPage(charLinkFact.name);

        // if (!charPg.success) return respond({ content: "There's been a problem trying to fetch the character page.", flags: 64 });//interaction.createFollowup({ content: "There's been a problem trying to fetch the character page.", flags: 64});

        // if (Object.keys(charPg.result).length < 2) return respond({ content: "The character doesn't exist" + (type === "1" ? ", may be using a different name now" : "") + ".\nCharacter searched: `" + charPgName + "`", components: []});

        // console.log(charPg.result);

        const [recard] = await DatabaseManager.cli.query<IUserRecord>("SELECT * FROM user_record where char_id = $1", [charId]).then(v => v.rows);
        const names = await DatabaseManager.cli.query<ICharacterName>("SELECT * FROM character_name WHERE id = $1", [charId]).then(v => v.rows);

        const result = await Character.respondify(charLinkFact, names, { id: charLinkFact?.faction_id ?? 0, alignment: charLinkFact?.fact_alignment ?? null, name: charLinkFact?.fact_name ?? null }, charPg.success ? charPg.result : null);

        if (result.embeds && result.embeds[0].title !== "Hidden Character") {
            if (charPg.success) {
                result.embeds[0].fields?.push({
                    name: "Item(s)",
                    value: `Armor: ${ItemUtil.getLinkage(parseInt(charPg.result.charArm))}\nPrimary: ${ItemUtil.getLinkage(charPg.result.wpnLink)}\nSidearm: ${ItemUtil.getLinkage(charPg.result.gunLink)}\nAuxiliary: ${ItemUtil.getLinkage(charPg.result.auxLink)}`
                });
            }

            if (recard) {
                let percent = <T extends 1 | 2 | "j" = 1 | 2 | "j">(prefix: T) => { let wins = recard["w" + prefix as `w${T}`]; let losses = recard["l" + prefix as `l${T}`]; return Math.round(wins/(wins + losses)*10000)/100 + "%"; }

                result.embeds[0].fields?.push({
                    name: "Records (Database)",
                    value: `1v1 Wins: ${recard.w1}, Losses: ${recard.l1}, ${percent(1)}\n2v2 Wins: ${recard.w2}, Losses: ${recard.l2}, ${percent(2)}\n2v1 Wins: ${recard.wj}, Losses: ${recard.lj}, ${percent("j")}\nNPC Wins: ${recard.npc}\nRetrieved at ${discordDate(recard.last_fetched)}`,//`Retrieved at ${lazyFormatTime(userRec.last_fetched)``
                    inline: true,
                })
            }

            if (charPg.success) {
                result.embeds[0].fields?.push({
                    name: "Records (Char Page)",
                    value: `1v1 Wins: ${charPg.result.charWins1}\n2v2 Wins: ${charPg.result.charWins2}\n2v1 Wins: ${charPg.result.charJug}`,//`Retrieved at ${lazyFormatTime(userRec.last_fetched)``
                    inline: true,
                })
            }

            result.embeds[result.embeds.length - 1]["timestamp"] = new Date().toISOString();

            result.embeds[result.embeds.length - 1]["footer"] = {
                text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}, populated records at`
            };
        }

        return interaction.reply(result);

        // let components = interaction.message.components;

        // /**
        //  * @type {import("oceanic.js").File[]}
        //  */
        // let files = [];

        // /**
        //  * Unfortunately I can't copy embeds like with components, cos undefined properties are copied anyways. Idk if it works but I won't test it
        //  * @type {import("oceanic.js").Embed[]}
        //  */
        // let embeds = [];

        // if (variables.type === "1") {
        //     let result = EDCharacter.resultify(charPg.result, client, interaction.member.id, false);

        //     if (!result.success) {
        //         await interaction.deleteOriginal();
        //         return interaction.createFollowup({ content: "That character is forbidden to search.", flags: 64 });
        //     }

        //     components = result.result.components.reverse();
        //     embeds = result.result.embeds;
        // } else {
        //     embeds = [{
        //         title: interaction.message.embeds[0].title,
        //         fields: interaction.message.embeds[0].fields,// {name: "Records", value: `1v1 Wins: ${charPg.result.charWins1}\n2v2 Wins: ${charPg.result.charWins2}\n2v1 Wins: ${charPg.result.charJug}`, inline: true}],
        //         description: interaction.message.embeds[0].description
        //     }];
        // }

        // await svg.generateChar(charPg.result).then((v) => {
        //     embeds[0].thumbnail = {
        //         url: "attachment://char.png"
        //     }; files = [{
        //         name: "char.png", contents: v
        //     }];
        // })

        // for (let i = 0; i < components.length; i++) {
        //     let ind = components[i].components.findIndex(v => v.type === ComponentTypes.BUTTON && v.customID && v.customID.includes("populate_0"));

        //     if (ind !== -1) {
        //         components[i].components[ind].disabled = true;
        //     }
        // }

        // let charArm = (id) => { let item = epicduel.client.boxes.item.objMap.get(typeof id === "string" ? parseInt(id) : id); return item ? ("[" + item.itemName + "](https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(item.itemName) + ")") : "N/A"; }
        // let weapon = (prefix='wpn') => {
        //     let thing = charPg.result[prefix + 'Link']; let isLinkage = true;

        //     if (!(thing && thing !== "")) { thing = charPg.result; isLinkage = false; }
        //     if (!(thing && thing !== "")) return "N/A"; // unequipped?

        //     /**
        //      * @type {import("../../server/structures/record/item/WeaponRecord")}
        //      */
        //     let item = epicduel.client.boxes.item.objMap.find(v => (isLinkage) ? v.itemLinkage === thing : v.itemId == thing);

        //     return item ? ("[" + item.itemName + "](https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(item.itemName) + ")") : "N/A";
        // };

        // if (epicduel.connected && epicduel.client?.boxes.item.objMap.size) {
        //     embeds[0].fields.push({
        //         name: "Item(s)", value: `Armor: ${charArm(charPg.result.charArm)}\nPrimary: ${weapon("wpn")}\nSidearm: ${weapon("gun")}\nAuxiliary: ${weapon("aux")}`,
        //         inline: false
        //     })
        // } else {
        //     embeds[0].fields.push({
        //         name: "Item(s)", value: "The bot isn't connected to EpicDuel so can't fetch the item details.",
        //         inline: false
        //     });
        // }

        // embeds[0].fields.find(v => v.name === "Misc").value = `Fame: **${charPg.result.charLikes}**\nRating Points: **${charPg.result.rating}** ${emojiStarCount(getStarCount(parseInt(charPg.result.rating)))}\nGender: ${charPg.result.charGender === "M" ? "Male" : "Female"}\nClass: ${ClassBox.CLASS_NAME_BY_ID[charPg.result.charClassId]}`

        // const userRecs = await database.cli.query(`SELECT * FROM user_record WHERE char_id = $1`, [charPg.result.charId])
        //     .then(v => v.rows)
        //     .catch(err => { return {error: err}; });

        // if (userRecs.error) database._logger.error(userRecs.error);

        // if (userRecs.length) {
        //     const userRec = userRecs[0];

        //     let percent = (prefix="1") => { let wins = userRec["w" + prefix]; let losses = userRec["l" + prefix]; return Math.round(wins/(wins + losses)*10000)/100 + "%"; }

        //     embeds[0].fields.push({
        //         name: "Records (Database)", inline: true,
        //         value: `1v1 Wins: ${userRec.w1}, Losses: ${userRec.l1}, ${percent("1")}\n2v2 Wins: ${userRec.w2}, Losses: ${userRec.l2}, ${percent("2")}\n2v1 Wins: ${userRec.wj}, Losses: ${userRec.lj}, ${percent("j")}\nNPC Wins: ${userRec.npc}\nRetrieved at ${lazyFormatTime(userRec.last_fetched)}`
        //     });
        // }

        // embeds[0].fields.push({
        //     name: "Records (Char Page)",
        //     value: `1v1 Wins: ${charPg.result.charWins1}\n2v2 Wins: ${charPg.result.charWins2}\n2v1 Wins: ${charPg.result.charJug}`, inline: true
        // }); embeds[0].footer = { text: "Populated records at" };
        // embeds[0].timestamp = new Date();

        // if (interaction.message.embeds[0]?.thumbnail && embeds[0].thumbnail === undefined) {
        //     embeds[0].thumbnail = { url: interaction.message.embeds[0].thumbnail.url };
        // }

        // if (!embeds[0].description.split("\n")[1].includes("Level: 40")) {
        //     embeds[0].description = embeds[0].description.split("\n")[0] + "\nLevel: " + charPg.result.charLvl + "\n" + embeds[0].description.split("\n").slice(2).join("\n")
        // }

        // return interaction.editOriginal({
        //     components, embeds, content: "", files
        // })


    });