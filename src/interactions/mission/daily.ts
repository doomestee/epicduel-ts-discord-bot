import { ComponentTypes } from "oceanic.js";
import MissionSBox from "../../game/box/MissionBox.js";
import Command, { CommandType } from "../../util/Command.js";
import { emojis, filter, letters, map, numbers } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";
import { rewardify } from "./recent.js";

export default new Command(CommandType.Application, { cmd: ["mission", "daily"], cooldown: 3000 })
    .attach('run', async ({ client, interaction }) => {
        if (MissionSBox.objMap.self.size === 0) return interaction.reply(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const groups = filter(MissionSBox.objMap.group.toArray(), v => v.categoryId === 1 && v.isActive).slice(0, 25);//;.reverse().slice(0, 25);

        if (!groups.length) return interaction.reply({ content: "There are no active daily missions at the moment, or at least the bot doesn't have them yet, please try again later.", flags: 64 });

        const missions = MissionSBox.objMap.self.toArray();

        return interaction.reply({
            embeds: [{
                title: `${groups.length} Daily Mission Chains`,
                description: `Daily missions are available for a limited time, they are reset every day at <t:1000180800:t>.\n\n`
                + map(groups, (v, i) => numbers[i] + ` - **${v.groupName}**`).join("\n"),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, customID: "mission_daily_menu_" + interaction.user.id, options: map(groups, (v, i) => {
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