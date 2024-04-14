import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager from "../../manager/database.js";
import Character, { ICharacter } from "../../Models/Character.js";
import { ICharacterName } from "../../Models/CharacterName.js";
import { discordDate, getCharPage, getHighestTime } from "../../util/Misc.js";
import { IUserRecord } from "../../Models/UserRecord.js";
import ItemUtil from "../../util/Item.js";

export default new Command(CommandType.Application, { cmd: ["character", "search"], cooldown: 3000 })
    .attach("run", async ({ client, interaction }) => {
        if (interaction.type !== 2) return;

        if (!interaction.acknowledged) await interaction.defer();

        const time = process.hrtime.bigint();

        const charName = interaction.data.options.getString("name", false) ?? "";//focused.options.find(v => v.name === "name")?.value;

        if (!/^([A-Za-z0-9]| |\.)+$/.test(charName) || charName.length > 50) {
            return interaction.createFollowup({
                content: charName.length > 50 ? "The username is too big." : "Username must consist of letters, numbers or underscores.",
                flags: 64
            });
        }

        const results = await DatabaseManager.cli.query<ICharacter & { old_name: string, similarity: number } & { link_flags: number } & ({ fact_name: string, fact_id: number, fact_alignment: 1 | 2 | null } | { fact_name: null, fact_id: null, fact_alignment: null })>(`select distinct character.*, link.flags as link_flags, character_name.name as old_name, similarity(character_name.name, $1), faction.id as fact_Id, faction.name as fact_Name, faction.alignment as fact_Alignment from character_name join character on character.id = character_name.id left join faction on faction.id = character.faction_id left join characterlink as link on link.id = character.id where character_name.name ilike $2 order by similarity desc limit 10`, [charName, "%" + charName + "%"]).then(v => v.rows);

        if (results.length === 1 && results[0].name.toLowerCase() === charName.toLowerCase()) {
            const names = await DatabaseManager.cli.query<ICharacterName>("SELECT * FROM character_name WHERE id = $1", [results[0].id]).then(v => v.rows);
            // const fact = 

            const charPg = await getCharPage(charName);

            const [recard] = await DatabaseManager.cli.query<IUserRecord>("SELECT * FROM user_record where char_id = $1", [results[0].id]).then(v => v.rows);

            const response = await (Character.respondify(results[0], names, { id: results[0].fact_id ?? undefined, name: results[0].fact_name ?? undefined, alignment: results[0].fact_alignment ?? undefined }, charPg.success ? charPg.result : null));

            if (response.embeds && response.embeds[0].title !== "Hidden Character") {
                if (charPg.success) {
                    response.embeds[0].fields?.push({
                        name: "Item(s)",
                        value: `Armor: ${ItemUtil.getLinkage(parseInt(charPg.result.charArm))}\nPrimary: ${ItemUtil.getLinkage(charPg.result.wpnLink)}\nSidearm: ${ItemUtil.getLinkage(charPg.result.gunLink)}\nAuxiliary: ${ItemUtil.getLinkage(charPg.result.auxLink)}`
                    });
                }

                if (recard) {
                    let percent = <T extends 1 | 2 | "j" = 1 | 2 | "j">(prefix: T) => { let wins = recard["w" + prefix as `w${T}`]; let losses = recard["l" + prefix as `l${T}`]; return Math.round(wins/(wins + losses)*10000)/100 + "%"; }

                    response.embeds[0].fields?.push({
                        name: "Records (Database)",
                        value: `1v1 Wins: ${recard.w1}, Losses: ${recard.l1}, ${percent(1)}\n2v2 Wins: ${recard.w2}, Losses: ${recard.l2}, ${percent(2)}\n2v1 Wins: ${recard.wj}, Losses: ${recard.lj}, ${percent("j")}\nNPC Wins: ${recard.npc}\nRetrieved at ${discordDate(recard.last_fetched)}`,//`Retrieved at ${lazyFormatTime(userRec.last_fetched)``
                        inline: true,
                    })
                }

                if (charPg.success) {
                    response.embeds[0].fields?.push({
                        name: "Records (Char Page)",
                        value: `1v1 Wins: ${charPg.result.charWins1}\n2v2 Wins: ${charPg.result.charWins2}\n2v1 Wins: ${charPg.result.charJug}`,//`Retrieved at ${lazyFormatTime(userRec.last_fetched)``
                        inline: true,
                    })
                }

                response.embeds[0]["footer"] = {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}, populated at`
                };
                response.embeds[0].timestamp = new Date().toISOString();
            }

            return interaction.reply(response);
        }

        if (results.length === 0) return interaction.createFollowup({
            embeds: [{
                description: `There's no character with similar name in the bot's database.\nYou can ask it to fetch from the character page if it exists.\n\nCharacter searched: \`${charName}\``
            }],
            components: [{
                type: 1, components: [{
                    type: 2, customID: "char_fetch_0_" + interaction.user.id + "_" + charName, style: 1, label: "Fetch"
                }]
            }],
        });

        return interaction.createFollowup(Character.listify(interaction.user, charName, results, time))
    });