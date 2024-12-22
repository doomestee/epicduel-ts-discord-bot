import DatabaseManager from "../../manager/database.js";
import Notification from "../../Models/Notification.js";
import Command, { CommandType } from "../../util/Command.js";
import { filter, find } from "../../util/Misc.js";

const ntfTypeToVal = ["N/A", "Exile Rally", "Legion Rally", "Game Update", "Server Restock", "Daily Mission"];

export default new Command(CommandType.Application, { cmd: ["notification", "delete"], permissionsMember: ["MANAGE_GUILD"], exceptionPermissionsCheck: [[-1, ""]], description: "Deletes a notification.", cooldown: 3000 })
    .attach('run', async ({ client, interaction }) => {
        if (!interaction.inCachedGuildChannel()) return interaction.reply({ content: `This command can only be used in guilds.`, flags: 64 });

        const id = interaction.data.options.getInteger("id", true);

        if (id === 102030405) return interaction.reply({ content: "This server has no notification for you to delete!", flags: 64 });

        // if (interaction.data.options.getChannel("channel")?.appPermissions.has("SEND_MESSAGES"))

        // if (!chnlPerms.has("SEND_MESSAGES")) return interaction.reply({ content: `The bot do not have the permission to send a message`, flags: 64 });

        if (!interaction.acknowledged) await interaction.defer();

        const notifs = await DatabaseManager.helper.getNotification(interaction.guildID);

        if (notifs.length === 0) return interaction.reply({ content: "This server has no notification for you to delete!", flags: 64 });

        const notification = find(notifs, v => v.id === id);

        if (notification === undefined) return interaction.reply({ content: `The notification with the ID ${id} does not exist (or is not for this server.)`, flags: 64});

        const deletion = await DatabaseManager.cli.query(`DELETE FROM notification WHERE id = $1`, [id])
            .then(v => v.rowCount, err => -1);
        
        if (deletion === -1 || deletion === null) return interaction.reply({ content: `Error, a problem has occurred when trying to delete the notification record off the database.`, flags: 64});
        if (deletion === 0) return interaction.reply({ content: `The notification with the ID ${id} does not exist (or is not for this server.)`, flags: 64});

        // For type 5 (daily mission);
        const roles = notification.message?.split("-") ?? [];

        return interaction.reply({
            embeds: [{
                title: "Notification Deleted",
                description:
                    notification.type === Notification.TYPE_MISSION_DAILY
                        ? `Arcade Role: <@&${roles[0] === "U" ? "N/A" : roles[0]}>.\nBounty Role: <@&${roles[1] === "U" ? "N/A" : roles[1]}.`
                        : "Raw message: ```\n" + notification.message + "```",
                fields: [{
                    name: "Type",
                    value: ntfTypeToVal[notification.type],
                    inline: true
                }, {
                    name: "Channel",
                    value: "<#" + notification.channel_id + ">", inline: true
                }],
                footer: {
                    text: "Former ID: " + id
                }
            }]
        })
    })