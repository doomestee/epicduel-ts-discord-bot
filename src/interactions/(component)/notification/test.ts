import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError } from "../../../util/errors/index.js";
import DatabaseManager from "../../../manager/database.js";
import Notification, { INotification } from "../../../Models/Notification.js";
import Swarm from "../../../manager/epicduel.js";
import { WarPointResult } from "../../../game/module/WarManager.js";
import MissionSBox from "../../../game/box/MissionBox.js";
import Logger from "../../../manager/logger.js";
import { find, map } from "../../../util/Misc.js";
import Missions from "../../../missions.json" with { type: "json" };
import { rewardify } from "../../mission/recent.js";
import { roleTypes, tierEmojis } from "../../../events/epicduel/missionsUpdate.js";
import { Embed } from "oceanic.js";

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

        if (!interaction.acknowledged) await interaction.defer();

        let [notify] = await DatabaseManager.cli.query<INotification>(`SELECT * FROM notification WHERE id = $1`, [parseInt(notificationId)])
            .then(v => v.rows);//.catch(err => { return { error: err }});

        // if (notify.error) return interaction.createFollowup({ content: "The bot couldn't retrieve the notification from the database."});
        if (!notify) return interaction.createFollowup({ content: "The notification doesn't exist anymore." });

        let message = notify.message ?? "";
        let embeds:Embed[] = [];
        
        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (notify.type === Notification.TYPE_RALLY_EXILE || notify.type === Notification.TYPE_RALLY_LEGION) {
            let currObjs = [{objectiveId: 1, points: 600, maxPoints: 1000, alignmentId: 1}, {objectiveId: 2, points: 300, maxPoints: 1000, alignmentId: 2}]
            let points:WarPointResult<string> = {
                current: ["600", "300"],
                max: ["1000", "1000"],
                remaining: ["0", "0"],
                currentPercent: ["0", "0"],
                gap: "69",
                gapPt: "13.37%"
            }

            if (ed) {
                currObjs = ed.modules.WarManager.currentObjectives();
                points = ed.modules.WarManager.warPoints(true);
            }

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
        } else if (notify.type === Notification.TYPE_MISSION_DAILY) {
            // role 0 - arcade
            // role 1 - bounty
            const roles = notify.message?.split("-") ?? [];

            const dailies = MissionSBox.objMap.group.filter(v => v.categoryId === 1);
            const missions = MissionSBox.objMap.self.toArray();

            if (!dailies.length) Logger.getLogger("Mission").error("Wtf, no daily missions?");

            const withTiers = map(dailies, v => ({ ...v, ext: find(Missions, a => a.groupId === v.groupId) ?? null }));
            const texts:string[] = [];

            let untiered = false;

            let pingText = "";
            const done = { "BOUNTY": false, "ARCADE": false } as Record<string, boolean>;

            for (let i = 0, len = withTiers.length; i < len; i++) {
                const mis = withTiers[i];

                const groupies = MissionSBox.getMissionsByGroupId(mis.groupId, missions);
                const reward = rewardify(groupies, false);

                // if (mis.tier) {
                    texts[i] = `${mis.ext !== null ? tierEmojis[mis.ext.tier] : "<:U_:1277408264904249385>"} **${mis.groupName}** - ${reward.creds} <:Credits:1095129742505689239>${reward.xp ? ` ${reward.xp} <:xp:1143945516229591100>` : ""}`;
                // }

                if (mis.ext === null) untiered = true;

                const notifs = mis.ext?.notif;

                if (notifs) {
                    for (let n = 0, nen = notifs.length; n < nen; n++) {
                        if (done[notifs[n]]) continue;

                        const role = roles[roleTypes[notifs[n] as "BOUNTY"]];

                        if (role !== undefined && role !== "U") pingText += `<@&${role}>`;
                        done[notifs[n]] = true;
                    }
                }
            }

            if (pingText.length === 0) pingText = "No ping since there aren't any good daily missions.";

            embeds = [{
                description: `Daily missions have just reset, and they will *usually* last up until the next reset.`,
                fields: [{
                    name: "Missions",
                    value: texts.join("\n")
                }],
                footer: {
                    text: "This is manually triggered, no pings are triggered."
                }
            }];

            message = pingText;
        }

        if (embeds.length) {
            embeds.push({
                description: "**NOTE**: this is a test run initiated by " + interaction.member.displayName
            });
        } else message += "\n\n\n**NOTE**: this is a test run initiated by " + interaction.member.displayName

        await client.rest.channels.createMessage(notify.channel_id, {
            content: message,
            embeds, allowedMentions: { roles: false, everyone: false }
        }).catch((err) => {
            // rip then,
        });
    })