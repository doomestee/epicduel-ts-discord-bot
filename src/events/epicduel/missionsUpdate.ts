import { Embed } from "oceanic.js";
import Missions from "../../missions.json" with { type: "json" };
import EDEvent from "../../util/events/EDEvent.js";
import Logger from "../../manager/logger.js";
import Config from "../../config/index.js";
import { find, map } from "../../util/Misc.js";
import { rewardify } from "../../interactions/mission/recent.js";
import DatabaseManager from "../../manager/database.js";
import Notification, { INotification } from "../../Models/Notification.js";

export const roleTypes = {
    "ARCADE": 0,
    "BOUNTY": 1
} as const;

let last = {
    clientId: -1,
    day: -1,
}

// export const missionRoles = {
//     ARCADE: "1277348948658491412",
//     BOUNTY: "1279301115329904693"
// }

/**
 * Tiers go as follow:
 * - 0: F-
 * - 1: F
 * - 2: F+
 * - 3: E
 * - 4: D
 * - 5: C
 * - 6: B
 * - 7: B+
 * - 8: A
 * - 9: A+
 * - 10: S
 * - 11: S+
 */
const tiers = ["F-", "F", "F+", "E", "D", "C", "B", "B+", "A", "A+", "S", "S+"];
/**
 * Due to limited number of emojis, (I cba making more to fit the pluses etc)
 * some tiers will be assimilated.
 * 
 * Indexed with the tier.
 */
export const tierEmojis = ["<:F_:1277405162461204605>", "<:F_:1277405162461204605>", "<:F_:1277405162461204605>", "<:E_:1277405021323005983>", "<:D_:1277403871047712871>", "<:C_:1277403857865150555>", "<:B_:1277403841892974603>", "<:B_:1277403841892974603>", "<:A_:1277403812528787486>", "<:A_:1277403812528787486>", "<:S_:1277403803083079820>", "<:S_:1277403803083079820>"];

export default new EDEvent("onDailyMissions", async function (hydra, { status, ping }) {
    // if (Config.isDocker === false) return;

    const date = new Date();

    Logger.getLogger("Mission").debug(`Received new missions, status: ${status[0]}, ${status[1]}`);

    if (last.day === date.getUTCDate()) {
        this.boxes.mission.reset = false;
        return;
    }
    if (status[0] === 0 || status[1] === 0) return;
    last.day = date.getUTCDate();
    last.clientId = this.settings.id;

    const dailies = this.boxes.mission.objMap.group.filter(v => v.categoryId === 1);
    const missions = this.boxes.mission.objMap.self.toArray();

    if (!dailies.length) Logger.getLogger("Mission").error("Wtf, no daily missions?");

    const withTiers = map(dailies, v => ({ ...v, ext: find(Missions, a => a.groupId === v.groupId) ?? null }));
    const texts:string[] = [];

    let untiered = false;

    const notifications = await DatabaseManager.cli.query<INotification>("SELECT * from notification WHERE type = $1" + (Config.isDevelopment ? " AND channel_id = $2" : ""), Config.isDevelopment ? [Notification.TYPE_MISSION_DAILY, "988216659665903647"] : [Notification.TYPE_MISSION_DAILY]).then(v => v.rows);

    const deletes:INotification[] = [];

    // TODO: optimise as it currently loop through dailies for each notification.
    for (let j = 0, jen = notifications.length; j < jen; j++) {
        const notify = notifications[j];

        const roles = notify.message?.split("-") ?? [];

        let pingText = "";
        const done = { "BOUNTY": false, "ARCADE": false } as Record<string, boolean>;
        const roleMentions = [];
        let onceDone = false;

        for (let i = 0, len = withTiers.length; i < len; i++) {
            const mis = withTiers[i];

            const groupies = this.boxes.mission.getMissionsByGroupId(mis.groupId, missions);
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

                    if (role !== undefined && role !== "U") {
                        pingText += `<@&${role}>`;
                        roleMentions.push(role);
                    }
                    done[notifs[n]] = true;
                    onceDone = true;
                }
            }
        }

        if (pingText.length === 0 && onceDone === false) pingText = "No ping since there aren't any good daily missions.";
        else if (pingText.length === 0 && onceDone === true) pingText = "";

        const embeds:Embed[] = [{
            description: `Daily missions have just reset, and they will *usually* last up until the next reset.`,
            fields: [{
                name: "Missions",
                value: texts.join("\n")
            }],
            footer: {
                text: ping === false ? "This is manually triggered, no pings are triggered." : (untiered ? `Some of the missions may be untiered, they weren't active at the time of ranking.` : "")
            }
        }];

        hydra.rest.channels.createMessage(notify.channel_id, {
            embeds,
            content: pingText,
            allowedMentions: {
                everyone: false,
                repliedUser: false,
                roles: ping === false ? false : roleMentions,
            }
        }).catch(err => {
            if (err) {
                Logger.getLogger("Notification").error(err);
                // 10003 is unknown channel, meaning it no longer exists.
                if (err.code === 10003) {
                    deletes.push(notify);
                // 50001 is missing access, meaning bot can't send there anymore
                } else if (err.code === 50001) {
                    deletes.push(notify);
                    return hydra.rest.channels.createDM(notify.creator_id)
                        .then((chnl) => chnl.createMessage({ content: `WARNING!\n\nThe bot can't send daily mission notifications (ID: ${notify.id}) to the channel <#${notify.channel_id}> due to **missing permissions**.\nPlease fix this, the notification will be deleted.` }))
                        .catch((err) => {
                            console.log(err);
                            // deletes.push(notify);
                        })
                } else console.log(err);
            }
        });
    }

    if (deletes.length) {
        DatabaseManager.cli.query(`DELETE FROM notification WHERE id IN (${deletes.map((v, i) => "$" + (i + 1))})`, deletes.map(v => v.id))
            .catch((err) => Logger.getLogger("Notification").error(err));
    }
});