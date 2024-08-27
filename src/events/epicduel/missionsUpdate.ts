import { Embed } from "oceanic.js";
import Missions from "../../missions.json" with { type: "json" };
import EDEvent from "../../util/events/EDEvent.js";
import Logger from "../../manager/logger.js";
import Config from "../../config/index.js";
import { find, map } from "../../util/Misc.js";
import { rewardify } from "../../interactions/mission/recent.js";

let last = {
    clientId: -1,
    day: -1,
}

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
const tierEmojis = ["<:F_:1277405162461204605>", "<:F_:1277405162461204605>", "<:F_:1277405162461204605>", "<:E_:1277405021323005983>", "<:D_:1277403871047712871>", "<:C_:1277403857865150555>", "<:B_:1277403841892974603>", "<:B_:1277403841892974603>", "<:A_:1277403812528787486>", "<:A_:1277403812528787486>", "<:S_:1277403803083079820>", "<:S_:1277403803083079820>"];

export default new EDEvent("onDailyMissions", async function (hydra, { status }) {
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

    const withTiers = map(dailies, v => ({ ...v, tier: find(Missions, a => a.groupId === v.groupId)?.tier ?? null }));
    const texts:string[] = [];

    let untiered = false;
    let atLeastOneGoodMission = false;

    for (let i = 0, len = withTiers.length; i < len; i++) {
        const mis = withTiers[i];

        const groupies = this.boxes.mission.getMissionsByGroupId(mis.groupId, missions);
        const reward = rewardify(groupies, false);

        // if (mis.tier) {
            texts[i] = `${mis.tier !== null ? tierEmojis[mis.tier] : "<:U_:1277408264904249385>"} **${mis.groupName}** (${reward.creds} <:Credits:1095129742505689239>)`;
        // }

        if (mis.tier === null) untiered = true;
        else if (mis.tier > 7) atLeastOneGoodMission = true;
    }

    const embeds:Embed[] = [{
        description: `Daily missions have just reset, and they will *usually* last up until the next reset`,
        fields: [{
            name: "Missions",
            value: texts.join("\n")
        }],
        footer: {
            text: untiered ? `Some of the missions may be untiered, they weren't active at the time of ranking.` : ""
        }
    }];

    hydra.rest.channels.createMessage("1091045429367558154", {
        embeds,
        content: atLeastOneGoodMission ? `<@&1277348948658491412>` : `No ping since there aren't any good daily missions.`
    });
});