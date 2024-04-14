import { ActionRowBase, ButtonComponent, ButtonStyles, ComponentTypes, EmbedOptions, StringSelectMenu } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { findIndex, getTime } from "../../../util/Misc.js";
import Swarm from "../../../manager/epicduel.js";
import DesignNoteManager from "../../../manager/designnote.js";

export default new Command(CommandType.Component, { custom_id: "help_<type>_<userId>" })
    .attach('run', ({ client, interaction, variables: { userId, type } }) => {
        let bypass = false;

        // "help_1_" + char.flags

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;
        //if (!bypass && interaction.member.permissions.has("MANAGE_MESSAGES")) bypass = true;

        if (!bypass) return interaction.reply({content: "You are not the original person who have used the command!", flags: 64});

        const ed = Swarm.getClient(v => v.connected, true);

        if (type !== "0") {
            console.log([type, userId]);
            switch (type) {
                case "1":
                    let flagella:[number, string, string][] = [[1 << 0, "1 << 0", "Legendary Char (level 40)"], [1 << 1, "1 << 1", "Staff"], [1 << 3, "1 << 3", "Forcibly Linked (can't unlink)"], [1 << 4, "1 << 4", "Hidden Character"], [1 << 5, "1 << 5", "Being tracked in game"]];
                    let parseFlag = "";

                    let flags = parseInt(userId);

                    for (let i of flagella) {
                        parseFlag += (flags & (i[0]) ? "✅ " : "❎ ") + i[1] + " - " + i[2] + "\n"
                    }

                    return interaction.reply({
                        embeds: [{
                            title: "What is a flag?",
                            description: "A collection of [bit fields](https://en.wikipedia.org/wiki/Bit_field).\nThink of a list of switches, each can be switched on or off, so it's a bit similar here for how flags are being used for the bot, except it's stored as numeric value.\n\n" + parseFlag.trim(),//"Each character in the database has a property called flags, which makes it easier for us to predefine without having to modify the database or add new a column (if you're aware of how SQL works).\nSimilarly to discord's user flags, it's represented as bit set.\nFor instance, a user's flag may be 1, which means it's a legendary character.\n\n" + parseFlag.trim(),
                        }], flags: 64
                    })
            }
        }

        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        const extraInfo = interaction.guildID === '565155762335383581' || client.isMaintainer(interaction.user.id);

        let embeds:Record<"char"|"tourney"|"leader"|"notif"|"bts", EmbedOptions[]> = {
            char: [{
                title: "Character",
                description: "Character based commands, note that due to the lack of API, we can only see any changes to your character each time you bump into the bot.",
                fields: [{
                    name: "Link [/, C]", 
                    value: "Links a character, allows usage of certain commands and can be used for verification.",
                    inline: true
                }, {
                    name: "List [/]",
                    value: "Lists all of the characters LINKED under your name."
                }], footer: {
                    text: "Inside brackets; / for application commands, C for components."
                }
            }],
            tourney: [{
                title: "Tournament",
                description: "Allows you to see stuff about the tournament, for instance the top 50 members, the details of it right now etc.",
                fields: [{
                    name: "Fetch [/]",
                    value: "Fetches the tournament board currently up to date in real time."
                }], footer: {
                    text: "Inside brackets; / for application commands, C for components."
                }
            }], 
            leader: [{
                title: "Leaderboard",
                description: "Allows you to see current leaderboard, from any types.\n\n**⚠️ NOTE ⚠️**\nThis command will soon be locked so only linked characters that meets the requirements can use it.",
                fields: [{
                    name: "Fetch [/]",
                    value: "Fetches the leaders from given type."
                }], footer: {
                    text: "Inside brackets; / for application commands, C for components."
                }
            }], 
            notif: [{
                title: "Notification",
                description: "Allows you to configure notifications for your server, whether be it design notes or war rallies.\nThe attached reference will lead you to a web page that shows all of the possible variables you can have in your customised notification message.",
                fields: [{
                    name: "Rally [/] (WIP)",
                    value: "Modifies the setting for war rallies notification, there can only be two rally notifications for each alignment."
                }, {
                    name: "Design Note [/]",
                    value: "Creates a webhook for the specified channel so it will begin receiving new design notes."
                }], footer: {
                    text: "Inside brackets; / for application commands, C for components."
                }
            }],
            bts: [{
                title: "Logistics",
                fields: [{
                    name: "Uptime", value: `${getTime(process.uptime()*1000, false, '', true)} (Process)\n${getTime(client.uptime, false, '', true)} (Discord)\n${getTime(ed?.connectedSince ?? 0, false, '', true)} (Epicduel API)`, inline: true
                }, {
                    name: "Scraper", value: (DesignNoteManager.isRunning) ? 'Currently running.' : 'has stopped.', inline: true
                }, {
                    name: "RAM Usage", value: "{execFunc01}", inline: true
                }, {
                    name: "Headless API",

                    // TODO: clean this bloody mess
                    value: `Connected (Main): ${ed?.connected ?? false}, (API): ${(ed && ed.smartFox && ed.smartFox.connected) ?? false}\nInitialised: redundant\nReconnectable: ${ed?.settings.reconnectable ?? "N/A"}` + ((ed?.connected && extraInfo) ? `\nPlayers at Room: ${ed.smartFox?.getActiveRoom() ? (((ed.smartFox.getActiveRoom()?.userList.size ?? 1) - 1)) +  ' (' + ed.smartFox.getActiveRoom()?.name + ')' : 'N/A (Not connected)'}\n` : '')
                }]
            }]
        };

        /**
         * @type {import("oceanic.js").ActionRowBase<import("oceanic.js").MessageComponent>[]}
         */
        const components = [{
            type: 1, components: [{
                type: 3, customID: "help_0_" + userId, maxValues: 1, minValues: 1,
                options: [{
                    label: "Character",
                    value: "char",
                    description: "Character based commands.",
                    emoji: {id: null, name: '🥸'},
                }, {
                    label: "Tournament",
                    value: "tourney",
                    description: "I don't know why would you need to use /help for this",
                    emoji: {id: null, name: '⚔️'},
                }, {
                    label: "Leaderboard",
                    value: "leader",
                    description: "I don't know why would you need to use /help for this",
                    emoji: {id: null, name: '🏆'}
                }, {
                    label: "Notification",
                    value: "notif",
                    description: "Notification based commands",
                    emoji: {id: null, name: '🔔'}
                }/*, {
                    label: "Achievement",
                    value: "achiev",
                    description: "Stuff about achievements",
                    emoji: {id: null, name: '🎖'}
                }, {
                    label: "Core",
                    value: "core",
                    description: "See what commands the bot has to offer about cores in game.",
                    emoji: {id: null, name: '🤹'}
                }, {
                    label: "War",
                    value: "war",
                    description: "Information about war in game...",
                    emoji: {id: null, name: '⚔️'}
                }*/, {
                    label: "Behind The Scene",
                    value: "bts",
                    description: "Extra information with how the bot's doing with the API, the scraper.",
                    emoji: {id: null, name: '🤖'}
                }]
            }]
        }, {
            type: 1, components: [{
                type: 2, style: ButtonStyles.DANGER, customID: "remove_message_" + userId,
                label: "Remove Message"
            }]
        }] as [ActionRowBase<StringSelectMenu>, ActionRowBase<ButtonComponent>];

        if      (interaction.data.values.raw[0] === "char")    components[0]['components'][0]['options'][0]['default'] = true;
        else if (interaction.data.values.raw[0] === "tourney") components[0]['components'][0]['options'][1]['default'] = true;
        else if (interaction.data.values.raw[0] === "leader")  components[0]['components'][0]['options'][2]['default'] = true;
        else if (interaction.data.values.raw[0] === "notif") {
            components[0]['components'][0]['options'][3]['default'] = true;

            components[1]['components'].push({
                type: 2, style: ButtonStyles.LINK, url: "https://doomester.one/vendbot/docs", label: "Reference"
            });
            
        } else if (interaction.data.values.raw[0] === "bts") {
            const btsdex = findIndex(components[0]['components'][0]['options'], v => v.value === "bts");

            if (btsdex !== -1) components[0]['components'][0]['options'][btsdex]['default'] = true;
            if (extraInfo) {
                if (ed?.connected) {
                    components[1]['components'].push({
                        type: 2, style: ButtonStyles.SECONDARY, customID: "fetch_players_" + interaction.user.id, label: "Get Player List"
                    });
                }

                embeds['bts'][0]['fields']?.push({
                    name: "Diagnosis", value: `G: ${client.guilds.size}, U: ${client.users.size}, M: ${client.guilds.reduce((accum, guild) => guild.memberCount + accum, 0)} (${client.guilds.reduce((accum, guild) => guild.members.size + accum, 0)}), S: ${client.shards.size},\n`, inline: true
                })
            }

            let exec01 = findIndex(embeds['bts'][0]['fields'] ?? [], v => v.value === "{execFunc01}");

            // RAM Usage
            if (exec01 !== -1) {
                let mem = process.memoryUsage(); let parsed = [];
                for (const [key, value] of Object.entries(mem)) {
                    parsed.push("" + key + ": " + (value/1000000) + "MB")
                }

                //@ts-expect-error
                embeds['bts'][0]['fields'][exec01].value = parsed.join("\n");
            }

            /*if (interaction.member.user.id !== "339050872736579589") {
                embeds['bts'][0]['fields'].push({
                    name: "Support (deprecated)", value: `If you need any support, or would like to join a dead community and poke a dead corpse expecting it to be alive, feel free to join [the server](https://discord.gg/KbjwbN3fpK)!`, inline: true
                })
            }*/
        }
        else return interaction.editParent({
            embeds: [{
                title: "Unknown Option", description: "The value you've put is unknown to us."
            }], components: []
        })

        return interaction.editParent({
            embeds: embeds[interaction.data.values.raw[0]], components
        })
    })