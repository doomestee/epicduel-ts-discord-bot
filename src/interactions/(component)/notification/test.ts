import { ButtonStyles, InteractionContextTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError } from "../../../util/errors/index.js";
import DatabaseManager from "../../../manager/database.js";
import { INotification } from "../../../Models/Notification.js";
import Swarm from "../../../manager/epicduel.js";
import { WarPointResult } from "../../../game/module/WarManager.js";

export default new Command(CommandType.Component, { custom_id: "test_send_<notificationId>_<userId>" })
    .attach('run', async ({ client, interaction, variables: { notificationId, userId } }) => {
        if (!interaction.inCachedGuildChannel()) return;

        if (interaction.type !== 3) return;
        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && interaction.member.permissions.has("MANAGE_GUILD")) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;
        //if (!bypass && interaction.member.permissions.has("MANAGE_MESSAGES")) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());//client.safeSend(interaction, 1)({content: "You are not the original person who have used the command!", flags: 64});

        let embed = interaction.message.embeds[0];

        embed.footer = { text: "A test ping has been initiated by " + interaction.member.displayName };

        // await interaction.editParent({
        //     embeds: interaction.message.embeds,
        //     components: [{
        //         type: 1, components: [{
        //             customID: "test_send_" + notificationId[0] + "_" + userId,
        //             type: 2, label: "Test", style: ButtonStyles.SECONDARY, disabled: true
        //         }]
        //     }]
        // });

        /**
         * @type {{id: number, type: 1|2, guild_id: string, channel_id: string, thread_id: string?, message: string, creator_id: string}}
         */
        let [notify] = await DatabaseManager.cli.query<INotification>(`SELECT * FROM notification WHERE id = $1`, [parseInt(notificationId)])
            .then(v => v.rows);//.catch(err => { return { error: err }});

        // if (notify.error) return interaction.createFollowup({ content: "The bot couldn't retrieve the notification from the database."});
        if (!notify) return interaction.createFollowup({ content: "The notification doesn't exist anymore." });

        let currObjs = [{objectiveId: 1, points: 600, maxPoints: 1000, alignmentId: 1}, {objectiveId: 2, points: 300, maxPoints: 1000, alignmentId: 2}]
        let points:WarPointResult<string> = {
            current: ["600", "300"],
            max: ["1000", "1000"],
            remaining: ["0", "0"],
            currentPercent: ["0", "0"],
            gap: "69",
            gapPt: "13.37%"
        }

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (ed) {
            currObjs = ed.modules.WarManager.currentObjectives();
            points = ed.modules.WarManager.warPoints(true);
        }

        let message = notify.message;

        if (message?.includes("%")) {
            message = message
                .replace(/%currPtE%/g, points.current[1])
                .replace(/%currPtL%/g, points.current[0])
                .replace(/%maxPtE%/g, points.max[1])
                .replace(/%maxPtL%/g, points.max[0])
                .replace(/%remainPtE%/g, points.remaining[1])
                .replace(/%remainPtL%/g, points.remaining[0])
                .replace(/%currentPcE%/g, points.currentPercent[1])
                .replace(/%currentPcL%/g, points.currentPercent[0])
                .replace(/%gapAlign%/g, (points.remaining[0] >= points.remaining[1]) ? "Exile" : "Legion")
                .replace(/%gapPt%/g, points.gapPt);
        }

        await client.rest.channels.createMessage(notify.channel_id, {
            content: message + "\n\n\n**NOTE**: this is a test run initiated by " + interaction.member.displayName,
            allowedMentions: { roles: false, everyone: false }
        }).catch((err) => {
            // rip then,
        });
    })