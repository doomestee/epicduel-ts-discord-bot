import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager from "../../manager/database.js";
import { getCharPage, getHighestTime } from "../../util/Misc.js";

export default new Command(CommandType.Application, { cmd: ["gifting", "stat"], waitFor: ["EPICDUEL", "LOBBY"], cooldown: 3000, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;
        
        const time = process.hrtime.bigint();

        const cli = Swarm.getClient(v => v.connected && v.lobbyInit, true, true);

        if (!cli || !cli.lobbyInit) return interaction.reply({ content: `this message should not be possible to receive, contact developer.`, flags: 64 });

        await interaction.defer();

        let name = interaction.data.options.getString("user_name", true);

        let charId = -1;
        
        // Various methods to acquire the char ID.
        // 1: db
        const char = await DatabaseManager.helper.getCharIdByName(name);

        if (char !== undefined) {
            charId = char.id;
            name = char.name;
        } else {
            // 2: check char page anyway.
            const page = await getCharPage(name);

            if (page.success && typeof page.result.charId === "string") {
                charId = Number(page.result.charId);
                name = page.result.charName;
            }
        }

        if (charId === -1) return interaction.createFollowup({ content: "There are no characters with that name. Make sure you have the letters and numbers correct. Capitalisation doesn't matter.", flags: 64 });

        const cheevos = await cli.modules.Achievements.getAchievements(charId);

        if (!cheevos.success) return interaction.reply({ content: "The bot is unable to fetch the achievements, please try again.", flags: 64 })

        const stat = {
            "2024": {
                // ach group: 238, 3054, 'Purchased the 50k, 18k, or 15k Varium pack during the Gifting Season.'
                "supporter": 0,

                // ach group: 237, 3025, 'Awarded for giving the most gifts in one day!'
                "champ": 0,

                // ach group: 236, 3022, 'Maintained a streak of...'
                "streak": 0,

                // ach group: 235, 3015, total no. of gifts given
                "total": 0,

                // ach group: 234, 3001, duh
                "daily": 0,

                // ach group: 240, 3090, 'Purchased a 4k Varium pack or higher during the Gifting Season.'
                "gift_supporter": 0,
            }
        }
        
        for (let i = 0, len = cheevos.value.length; i < len; i++) {
            const cheevo = cheevos.value[i];

            switch (cheevo.achGroup) {
                case 234: stat["2024"]["daily"] += cheevo.count; break;
                case 235: stat["2024"]["total"] += cheevo.count; break;
                case 236: stat["2024"]["streak"] += cheevo.count; break;
                case 237: stat["2024"]["champ"] += cheevo.count; break;
                case 238: stat["2024"]["supporter"] += cheevo.count; break;
                case 240: stat["2024"]["gift_supporter"] += cheevo.count; break;
            }
        }

        return interaction.reply({
            embeds: [{
                title: name + "'s 2024 Gifting Stat",
                description: 
                    "**Daily Gifts Claimed**: " + stat["2024"]["daily"]
                    + "\n**Total Score**: " + stat["2024"]["total"]
                    + "\n**Highest Streak**: " + stat["2024"]["streak"]
                    + "\n**No. of Top 1 Gift Lead**: " + stat["2024"]["champ"]
                    + "\n**No. of 15k/18k/50k Varium Pack bought**: " + stat["2024"]["supporter"]
                    + "\n**No. of 4k Varium Pack or higher bought**: " + stat["2024"]["gift_supporter"],
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }
            }]
        })
    })