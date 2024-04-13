import { ButtonStyles } from "oceanic.js";
import { spitOptions } from "../../../events/discord/interactionCreate.js";
import DatabaseManager from "../../../manager/database.js";
import Command, { CommandType } from "../../../util/Command.js";
import { filter } from "../../../util/Misc.js";

function process(str: string) {
    return str.replace(/\\n/g, "\n");
}

export default new Command(CommandType.Application, { cmd: ["notification", "rally", "create"], permissionsMember: ["MANAGE_GUILD"], exceptionPermissionsCheck: [[-1, ""]], description: "Creates a rally notification.", cooldown: 3000 })
    .attach('run', async ({ client, interaction }) => {
        if (!interaction.inCachedGuildChannel()) return interaction.reply({ content: `This command can only be used in guilds.`, flags: 64 });

        const [type, message] = ["type", "message"].map(v => process(interaction.data.options.getString(v, true))) as ["warRallyExile"|"warRallyLegion", string];
        const chnlPerms = interaction.data.options.getChannel("channel")?.appPermissions ?? interaction.channel.permissionsOf(client.user.id);
        const chnlId = interaction.data.options.getChannel("channel")?.id ?? interaction.channelID;

        // if (interaction.data.options.getChannel("channel")?.appPermissions.has("SEND_MESSAGES"))

        // if (!chnlPerms.has("SEND_MESSAGES")) return interaction.reply({ content: `The bot do not have the permission to send a message`, flags: 64 });
        if (message.length > 500) return interaction.reply({ content: "Message is too long, please make it much shorter (limit is 500 characters).", flags: 64 });

        if (!interaction.acknowledged) await interaction.defer();

        const notifs = filter(await DatabaseManager.helper.getNotification(interaction.guildID), v => v.type === 1 || v.type === 2);

        if (notifs.length > 5) return interaction.reply({ content: `You've reached the maximum amount of rally notifications the server can have.`, flags: 64 });

        if ((type === "warRallyExile" && filter(notifs, v => v.type === 1).length >= 3) || (type === "warRallyLegion" && filter(notifs, v => v.type === 2).length >= 3))
            return interaction.reply({ flags: 64, content: "This server can only have 3 notifications for that one type of rally at any time." });

        const insert = await DatabaseManager.insert("notification", {
            type: type === "warRallyExile" ? 1 : 2,
            guild_id: interaction.guildID,
            channel_id: chnlId,
            thread_id: null, // i cba after finding out sending via thread id works
            message: message,
            creator_id: interaction.user.id
        }, "id").catch(err => ({ error: err }));

        if (typeof insert === "object") return interaction.reply({
            content: "Error. There's been a problem trying to add a new notification record into the database, please try again later.\n\n(Note: you can copy command by clicking on the blue /notification hyperlink at the top of the message).",
            flags: 64
        });

        return interaction.reply({
            embeds: [{
                title: "Notification Created",
                author: {
                    name: interaction.member.username,
                    iconURL: interaction.member.avatarURL()
                },
                description: `Successfully created a notification for ${type === "warRallyExile" ? "Exile" : "Legion"} rallies.\nID of notification: ${insert}\n\n**You must make sure that the bot can send a message there, use the test button if you want, all mentions are disabled so nobody will be pinged.**\n\n**Channel:** <#${chnlId}>\n**Message:**\n${message}`,
                footer: {
                    text: (/\%\w{1,}\%/g.test(message)) ? "You can have a maximum of 6 notifications, and 3 for each type." : "Did you know you can have variables? Check /help then click on notification to find out."
                }
            }],
            components: [{
                type: 1, components: [{
                    customID: "test_send_" + insert + "_" + interaction.member.id,
                    type: 2, label: "Test", style: ButtonStyles.SECONDARY
                }]
            }]
        })
    })