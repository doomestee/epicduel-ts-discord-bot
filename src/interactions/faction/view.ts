import FactionManager from "../../game/module/FactionManager.js";
import Swarm from "../../manager/epicduel.js";
import ImageManager from "../../manager/image.js";
import Command, { CommandType } from "../../util/Command.js";
import { getHighestTime } from "../../util/Misc.js";
import type { File } from "oceanic.js";

export default new Command(CommandType.Application, { cmd: ["faction", "view"], waitFor: ["EPICDUEL"], cooldown: 3000, usableEdRestricted: false, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        const time = process.hrtime.bigint();

        const factId = interaction.data.options.getInteger("name") ?? 102030405;

        if (factId === 102030405) return interaction.reply({ content: "You need to provide a faction ID, if you're using autocomplete part for name, use what it's giving you.", flags: 64 });

        const ed = Swarm.getClientById(true);

        if (!ed) return interaction.reply({ content: "The bot does not have at least one client it could use to fetch the faction from." })

        if (!interaction.acknowledged) await interaction.defer();

        const result = await ed.modules.FactionManager.getFaction(factId);

        if (!result.success) return interaction.createFollowup({ content: "The faction ID provided is invalid, or the server doesn't want to share, probably the former.", flags: 64 });

        const fact = result.value;

        const files:File[] = [{
            name: "flag.png",
            contents: await ImageManager.SVG.generator.fact({
                alignment: fact.alignment as 1 | 2,
                ...fact.flag
            })
        }]

        return interaction.createFollowup({
            embeds: [{
                title: fact.name/*/"Faction Info", // " + fact.name*/ + " (" + fact.id + ")",
                fields: [{
                    name: "Alignment",
                    value: FactionManager.alignmentName(fact.alignment) + (fact.alignment === 2 ? " <:legion:1038560944067969024>" : " <:exile:1038560941836607658>"),
                    inline: true
                }, {
                    name: "Rank",
                    value: fact.rank.rank + " (Lvl " + fact.rank.lvl + ")",
                    inline: true
                }, {
                    name: "Influence",
                    value: "Daily: " + fact.influence.daily + "\nTotal: " + fact.influence.total,
                }, {
                    name: "Lead",
                    value: "1v1: " + fact.lead.one + "\n2v2: " + fact.lead.two + "\nJugg: " + fact.lead.jugg,
                    inline: true
                }, {
                    name: "Wins",
                    value: "1v1: " + fact.wins.one + "\n2v2: " + fact.wins.two + "\nJugg: " + fact.wins.jugg,
                    inline: true
                }, {
                    name: "Misc",
                    value: "Members: " + fact.members.length + "\nWar Upgrade: " + fact.warUpgrade + "\nAlignment Wins: " + fact.alignWins + "\nDominations: " + fact.domination,
                }], author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }, footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }, thumbnail: {
                    url: "attachment://flag.png"
                }
            }], components: [{
                type: 1,
                components: [{
                    type: 3, customID: "faction_menu_" + fact.id + "_" + interaction.user.id, options: [{
                        label: "General Info",
                        value: "general",
                        description: "General information about the faction.",
                        emoji: { name: "📜" },
                        default: true
                    }, {
                        label: "Members",
                        value: "members",
                        description: "List of members in the faction.",
                        emoji: { name: "👥" }
                    }]
                }]
            }], files
            // }], files: [{
            //     name: "logo.png",
            //     contents: await svg.generateFact({ ...fact.flag, alignment: fact.alignment })
            // }]
        })
    })