import { ComponentTypes, EmbedOptions, MessageActionRow, SelectMenuComponent, StringSelectMenu } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import Swarm from "../../../manager/epicduel.js";
import { SwarmError } from "../../../util/errors/index.js";
import FactionManager from "../../../game/module/FactionManager.js";

export default new Command(CommandType.Component, { custom_id: 'faction_menu_<factId>_<userId>', gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { factId: strFactId, userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        let bypass = false;

        if (userId === "000") bypass = true;
        if (interaction.user.id === userId) bypass = true;
        // if (!bypass && interaction.member.permissions.has("MANAGE_MESSAGES")) bypass = true;

        if (!bypass) return interaction.createMessage({content: "You are not the person who've used the command, or lacks sufficient permission!", flags: 64});

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient(true));

        await interaction.deferUpdate();

        const result = await ed.modules.FactionManager.getFaction(parseInt(strFactId));

        if (!result.success) return interaction.createFollowup({ flags: 64, content: "There's been a problem trying to fetch a faction details, it may be that the server timed out?" });

        const faction = result.value;

        /**
         * @type {{[id: string]: import("oceanic.js").EmbedOptions[]}}
         */
        const embeds:Record<"general"|"members", EmbedOptions[]> = {
            "general": [{
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
                    iconURL: interaction.user.avatarURL("png")
                }, thumbnail: {
                    url: "attachment://logo.png"
                }
            }],
            "members": [{
                title: faction.name + " (" + faction.id + ")",
                description: "There are " + faction.members.length + " members in this faction (" + faction.members.filter(m => m.rank === 3).length + " Founder(s), " + faction.members.filter(m => m.rank === 2).length + ", Officer(s)).",
                fields: [{
                    name: "Founder(s)",
                    value: "```xl\n" + ((faction.members.filter(m => m.rank === 3).length) ? faction.members.filter(m => m.rank === 3).map(m => `${m.name} - ${m.title} - ${m.lastActive} days ago - ${m.influence}`).join("\n").slice(0, 1024) : 'None...') + "```",
                }, {
                    name: "Officer(s)",
                    value: "```xl\n" + ((faction.members.filter(m => m.rank === 2).length) ? faction.members.filter(m => m.rank === 2).sort((a, b) => b.influence - a.influence).map(m => `${m.name} - ${m.title} - ${m.lastActive} days ago - ${m.influence}`).join("\n").slice(0, 1024) : 'None...') + "```",
                }, {
                    name: "Member(s)",
                    value: "```xl\n" + ((faction.members.filter(m => m.rank === 1).length) ? faction.members.filter(m => m.rank === 1).sort((a, b) => b.influence - a.influence).map(m => `${m.name} - ${m.title} - ${m.lastActive} days ago - ${m.influence}`).join("\n").slice(0, 1024) : 'None...') + "```",
                }], thumbnail: {
                    url: "attachment://logo.png"
                }
            }]
        };

        const components:[StringSelectMenu] = [{
            type: 3, customID: "faction_menu_" + strFactId + "_" + (userId === "000" ? interaction.user.id : userId), maxValues: 1, minValues: 1,
            options: [{
                label: "General Info",
                value: "general",
                description: "General information about the faction.",
                emoji: { name: "📜" }
            }, {
                label: "Members",
                value: "members",
                description: "List of members in the faction.",
                emoji: { name: "👥" }
            }]
        }];

        if      (interaction.data.values.raw[0] === "general")    components[0]['options'][0]['default'] = true;
        else if (interaction.data.values.raw[0] === "members")    components[0]['options'][1]['default'] = true;
        else return interaction.editOriginal({embeds: [{ title: "Unknown Option", description: "The value you've put is unknown to us." }], flags: 64});

        return interaction.editOriginal({
            embeds: embeds[interaction.data.values.raw[0]],
            components: [{
                type: 1, components,
            }]
        });
    })