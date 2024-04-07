// // Yeah I don't know the point of this command, it really should've been dynamic and actually use the command's description in their module.export or smth.

import { ButtonStyles } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";

export default new Command(CommandType.Application, { cmd: ["help"] })
    .attach("run", ({ client, interaction }) => {
        return interaction.reply({
            embeds: [{
                title: "General Info",
                description: "This bot can be used to notify your servers of any new design notes, or war rallies, to fetch and send you leaderboards, or to link characters and be used to verify those that meets requirements, or see new item/core details etc.\n\nIf you need any support, you can reach out to the developer (if you know who) or go to [support server](https://discord.gg/KbjwbN3fpK) and ask away!",
            }],
            components: [{
                type: 1, components: [{
                    type: 3, customID: "help_0_" + interaction.user.id, maxValues: 1, minValues: 1,
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
                        description: "Extra information regarding to the bot behind the scene.",
                        emoji: {id: null, name: '🤖'}
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, style: ButtonStyles.DANGER, customID: "remove_message_" + interaction.user.id,
                    label: "Remove Message"
                }, {
                    type: 2, style: ButtonStyles.SECONDARY, customID: "feedback_1_0_" + "000",
                    label: "Send Feedback",
                }, {
                    type: 2, style: ButtonStyles.LINK, url: "https://ko-fi.com/doomester",
                    emoji: { name: '☕' }, label: "Donate", disabled: !!client.messages[0].value.noDonate
                }]
            }]
        })
    })