// const Command = require("../../structures/Command");
// const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴"];
// const letters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];

import { ComponentTypes } from "oceanic.js";
import MissionSBox from "../../game/box/MissionBox.js";
import Command, { CommandType } from "../../util/Command.js";
import { emojis, filter, letters, map, numbers } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";
import { AnyItemRecordsExceptSelf } from "../../game/box/ItemBox.js";
import AchievementRecord from "../../game/record/AchievementRecord.js";
import MissionRecord from "../../game/record/mission/SelfRecord.js";
import { MissionTypes } from "../../game/Constants.js";

type Reward = { xp: number, creds: number, items: AnyItemRecordsExceptSelf[], cheevos: AchievementRecord[], home: number };

export function rewardify(missions: MissionRecord[], parseText?: false) : Reward
export function rewardify(missions: MissionRecord[], parseText: true) : string
export function rewardify(missions: MissionRecord[], parseText?: boolean) {
    /**
     * 1 - Achievement
     * 2 - Credits
     * 3 - Home Item (lmao)
     * 4 - Item
     * 5 - XP
     */
    const result:Reward = {
        xp: 0, creds: 0, items: [], cheevos: [], home: 0
    }

    for (let i = 0, len = missions.length; i < len; i++) {
        let missionRwds = missions[i].rewardFull();

        for (let j = 0, jen = missionRwds.length; j < jen; j++) {
            const rwd = missionRwds[j];

            // // i CAN'T USE SWITCH N BREAK CRIII

            // if (rwd.t === 1 && rwd.v) result["cheevos"].push(rwd.v);
            // if (rwd.t === 2) result["creds"] += (rwd.v);
            // if (rwd.t === 3) result["home"] += (rwd.v);
            // if (rwd.t === 4 && rwd.v) result["items"].push(rwd.v);
            // if (rwd.t === 5) result["xp"] += (rwd.v);

            switch (rwd.t) {
                case 1: if (rwd.v) result["cheevos"].push(rwd.v); break;
                case 2: result.creds += rwd.v; break;
                case 3: result.home += 1; break;
                case 4: if (rwd.v) result.items.push(rwd.v); break;
                case 5: result.xp += rwd.v; break;
            }
        }
    }

    if (parseText) {
        return `${result.creds ? result.creds + " <:Credits:1095129742505689239>\n" : ""}${result.xp ? result.xp + " <:xp:1143945516229591100>\n" : ""}${result.items.length ? result.items.map(v => v.itemName + " (ID: " + v.itemId + ")").join("\n") : ""}${result.cheevos.length ? result.cheevos.map(ach => ach.achName + " (ID: " + ach.achId + ")").join("\n") : ""}${result.home ? result.home + " Home Item(s)" : ""}`
    }

    return result;
}

export function missionType(type: MissionTypes, quantity: number) {
    const pluralify = (quan: number) => { return (quan > 1) ? "s" : ""; };

    switch (type) {
        case MissionTypes.TYPE_KILL_NPC: return quantity + " Kill" + pluralify(quantity) + " (NPC)";
        case MissionTypes.TYPE_KILL_CHALLENGE: return quantity + " Challenge Win" + pluralify(quantity);
        case MissionTypes.TYPE_ITEMS_TURN_IN: return "Turn in " + quantity + " item" + pluralify(quantity);
        case MissionTypes.TYPE_1V1_WINS: return quantity + " 1v1 Win" + pluralify(quantity);
        case MissionTypes.TYPE_2V2_WINS: return quantity + " 2v2 Win" + pluralify(quantity);
        case MissionTypes.TYPE_PVP_WINS: return quantity + " PvP Win" + pluralify(quantity);
        case MissionTypes.TYPE_WAR_WINS: return quantity + " War Win" + pluralify(quantity);
        case MissionTypes.TYPE_ITEMS_REQUIRED: return "Obtain " + quantity + " item" + pluralify(quantity);
        case MissionTypes.TYPE_PVP_BATTLES: return quantity + " PvP Battle" + pluralify(quantity);
    }
}

export function objectify(mission: MissionRecord | Array<MissionRecord>) {
    let result = "";

    if (Array.isArray(mission)) {
        let resultBeforeParsed = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i = 0; i < mission.length; i++) {
            let miss = mission[i];

            let quans = miss.missionQty.split(",");

            for (let y = 0; y < quans.length; y++)
                resultBeforeParsed[miss.missionType-1] += parseInt(quans[y]);
        }

        for (let i = 0; i < resultBeforeParsed.length; i++) {
            if (resultBeforeParsed[i] === 0) continue;

            result += "\n" + missionType(i + 1, resultBeforeParsed[i]);
        }
    } else {
        const quantities = mission.missionQty.split(",");

        // TODO: for items, show the items needed to turn in.
        for (let i = 0; i < quantities.length; i++) {
            result += "\n" + missionType(mission.missionType, parseInt(quantities[i]));
        }
    }

    return result.trim();
}

export default new Command(CommandType.Application, { cmd: ["mission", "recent"], cooldown: 3000 })
    .attach('run', async ({ client, interaction }) => {
        if (MissionSBox.objMap.self.size === 0) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const groups = filter(MissionSBox.objMap.group.toArray(), v => v.categoryId !== 1 && v.isActive).reverse().slice(0, 25);

        const missions = MissionSBox.objMap.self.toArray();

        return interaction.reply({
            embeds: [{
                title: `Recent ${groups.length} Mission Chains`,
                description: `These are the newest mission chains (excluding daily) based on their ID.\n\n`
                + map(groups, (v, i) => numbers[i] + ` - **${v.groupName}**`).join("\n"),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, customID: "mission_recent_menu_" + interaction.user.id, options: map(groups, (v, i) => {
                        const groupies = MissionSBox.getMissionsByGroupId(v.groupId, missions);
                        const reward = rewardify(groupies, false);

                        return {
                            label: v.groupName,
                            emoji: emojis.numbers[i],
                            value: String(v.groupId),
                            description: `${groupies.length} missions, ${reward.creds} credits, ${reward.xp} xp, ${reward.items.length} items, ${reward.cheevos.length} achievements, ${reward.home} home items.`
                        }
                    }), minValues: 1, maxValues: 1, placeholder: "Select a mission chain"
                }]
            }]
        })
    });