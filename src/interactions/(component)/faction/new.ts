import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import Swarm from "../../../manager/epicduel.js";
import { SwarmError } from "../../../util/errors/index.js";
import FactionManager from "../../../game/module/FactionManager.js";
import ImageManager from "../../../manager/image.js";

export default new Command(CommandType.Component, { custom_id: "faction_open_<factId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const factId = parseInt(variables.factId);

        if (factId === 102030405 || factId === 0) {
            return interaction.reply({ content: "You need to provide a faction ID, or as for name, that must have existed in bot database.", flags: 64 });
        }

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient(true));

        await interaction.deferUpdate();

        const result = await ed.modules.FactionManager.getFaction(factId);

        if (!result.success) return interaction.createFollowup({ flags: 64, content: "There's been a problem trying to fetch a faction details, it may be that the server timed out?" });

        const faction = result.value;

        return interaction.createFollowup({
            embeds: [{
                title: faction.name/*/"Faction Info", // " + faction.name*/ + " (" + faction.id + ")",
                fields: [{
                    name: "Alignment",
                    value: FactionManager.alignmentName(faction.alignment) + (faction.alignment == 2 ? " <:legion:1038560944067969024>" : " <:exile:1038560941836607658>"),
                    inline: true
                }, {
                    name: "Rank",
                    value: faction.rank.rank + " (Lvl " + faction.rank.lvl + ")",
                    inline: true
                }, {
                    name: "Influence",
                    value: "Daily: " + faction.influence.daily + "\nTotal: " + faction.influence.total,
                }, {
                    name: "Lead",
                    value: "1v1: " + faction.lead.one + "\n2v2: " + faction.lead.two + "\nJugg: " + faction.lead.jugg,
                    inline: true
                }, {
                    name: "Wins",
                    value: "1v1: " + faction.wins.one + "\n2v2: " + faction.wins.two + "\nJugg: " + faction.wins.jugg,
                    inline: true
                }, {
                    name: "Misc",
                    value: "Members: " + faction.members.length + "\nWar Upgrade: " + faction.warUpgrade + "\nAlignment Wins: " + faction.alignWins + "\nDominations: " + faction.domination,
                }], author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }, thumbnail: {
                    url: "attachment://logo.png"
                }
            }], components: [{
                type: 1,
                components: [{
                    type: 3, customID: "faction_menu_" + faction.id + "_" + interaction.user.id, options: [{
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
            }], files: [{
                name: "logo.png",
                contents: await ImageManager.SVG.generator.fact({ ...faction.flag, alignment: faction.alignment as 1 | 2 })
            }]
        })
    });