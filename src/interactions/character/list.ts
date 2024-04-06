import { ApplicationCommandTypes } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager from "../../manager/database.js";
import { CharLinkFact } from "../../util/DBHelper.js";
import Character from "../../Models/Character.js";
import { ICharacterName } from "../../Models/CharacterName.js";
import { discordDate, getCharPage, getHighestTime } from "../../util/Misc.js";
import { IUserRecord } from "../../Models/UserRecord.js";
import ItemUtil from "../../util/Item.js";

export default new Command(CommandType.Application, { cmd: ["character", "list"], aliases: ["Linked Character(s)"], cooldown: 5000 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        const time = process.hrtime.bigint();

        let discordId: string = "";

        if (interaction.data.type === ApplicationCommandTypes.CHAT_INPUT) discordId = interaction.data.options.getUser("user")?.id ?? interaction.user.id;
        else discordId = interaction.data.targetID ?? "";

        if (discordId === "") return interaction.reply({ content: "The bot didn't get the ID of the user you tried to look on", flags: 64 });

        await interaction.defer();

        const chars = await DatabaseManager.helper.getCharacterFactLinks(discordId);

        if (chars.length === 0) return interaction.reply({ content: "This user does not have a linked character.", flags: 64 });

        let dom: CharLinkFact | undefined;

        for (let i = 0; i < chars.length; i++) {
            if (chars[i].exp > (dom?.exp || 0) && !(chars[i].flags & 1 << 4)) {
                dom = chars[i];
            }
        }

        const names = !dom ? [] : await DatabaseManager.cli.query<ICharacterName>("SELECT * FROM character_name WHERE id = $1", [dom.id]).then(v => v.rows);
        const charPg = !dom ? null : await getCharPage(dom.name);

        // /**
        //  * @type {string}
        //  */
        // let urlo = (interaction.data.type === ApplicationCommandTypes.CHAT_INPUT) ? ((discordID === interaction.member.id) ? interaction.member.avatarURL("png") : interaction.data.resolved.users.get(discordID).avatarURL("png")) : interaction.data.target.avatarURL("png");

        // ((result) ? result.result.embeds[0] : embeds[0]).thumbnail = {
        //     url: client.endpoints.avatar(urlo)//"attachment://image.png"
        // };

        const result = await Character.linskify(discordId, interaction.user.id, dom, chars, names, charPg?.success ? charPg.result : null);

        if (result.embeds && dom) {
            const [recard] = await DatabaseManager.cli.query<IUserRecord>("SELECT * FROM user_record where char_id = $1", [dom.id]).then(v => v.rows);

            if (charPg?.success) {
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

            if (charPg?.success) {
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
    });