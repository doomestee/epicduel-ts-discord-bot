import { ComponentTypes, File, SelectOption } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import MissionSBox from "../../../game/box/MissionBox.js";
import { emojis, filter, find, map, numbers } from "../../../util/Misc.js";
import { objectify, rewardify } from "../../mission/recent.js";
import MerchantSBox from "../../../game/box/MerchantBox.js";
import ImageManager from "../../../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../../../config/index.js";
import Swarm from "../../../manager/epicduel.js";
import MissionRecord from "../../../game/record/mission/SelfRecord.js";
import { replaceHTMLbits } from "../../../manager/designnote.js";
import he from "he";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };
let edClass = (id: number) => { return id == 0 ? "None" : id == 1 ? "Hunter" : id == 2 ? "Mercenary" : id == 3 ? "Mage" : "Unknown" };

function optionsify(missions: MissionRecord[], type: number, disabled?: number) {
    const options:SelectOption[] = [];

    for (let i = 0, len = missions.length; i < len; i++) {
        options.push({
            label: missions[i].missionName,
            emoji: emojis.numbers[i],
            value: String(missions[i].missionId),
            default: disabled === missions[i].missionId
        });
    }

    options.push({
        label: "Summary", value: "summary", emoji: { id: null, name: '📃'}, default: typeof disabled === "undefined"
    })

    if (type !== 2) {
        options.push({
            label: "Go back", value: "reverse", emoji: {id: null, name: '↩️'}
        })
    }

    return options;
}

export default new Command(CommandType.Component, { custom_id: 'mission_menu_<type>_<groupId>_<userId>' })
    .attach('run', async ({ client, interaction, variables: { type: strtype, groupId: strgroupid, userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        let bypass = userId === "000";

        if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());

        if (MissionSBox.objMap.group.size === 0) return interaction.reply(SwarmError.noClient());

        /**
         * 0 for recent, 1 for daily, 2 for search
         */
        const type = Number(strtype);

        const groupId = Number(strgroupid);
        const isDaily = type === 1;

        const allMissions = MissionSBox.objMap.self.toArray();
        const missions = MissionSBox.getMissionsByGroupId(groupId);//filter(MissionSBox.objMap.self, v => v.groupId === groupId);
        const groups = filter(MissionSBox.objMap.group, v => v.isActive && isDaily ? (v.categoryId === 1) : (v.categoryId !== -1));
        const group = find(groups, v => v.groupId === groupId);

        if (!group || interaction.data.values.raw[0] === "reverse") {
            if (!isDaily) groups.reverse();

            return interaction.editParent({
                embeds: [{
                    title: isDaily ? (groups.length + "x Daily Mission Chains") : ("Recent " + groups.length + " Mission Chains."),
                    description: ((isDaily) 
                    ? (((interaction.data.values.raw[0] === "reverse") ? "Daily missions are available for a limited time, they are reset every day at <t:1000180800:t>.\n\n" : "The daily mission chain is no longer available, these are the new missions:\n\n"))
                    : (((interaction.data.values.raw[0] === "reverse") ? "These are the newest mission chains (excluding daily) based on their ID.\n\n" : "The chain is somehow no longer available, these are the new missions:\n\n")))
                    + groups.slice(0, 25).map((v, i) => numbers[i] + ` - **${v.groupName}**`).join("\n"),
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    }
                }],
                components: [{
                    type: 1, components: [{
                        type: 3, customID: (isDaily) ? ("mission_daily_menu_" + userId) : ("mission_recent_menu_" + userId),
                        options: map(groups.slice(0, 25), ((val, index) => {
                            const groupies = MissionSBox.getMissionsByGroupId(val.groupId, allMissions);
                            const reward = rewardify(groupies, false);
                            
                            return {
                                label: val.groupName,
                                emoji: emojis.numbers[index],
                                value: String(val.groupId),
                                description: `${groupies.length} missions, ${reward.creds} credits, ${reward.xp} xp, ${reward.items.length} items, ${reward.cheevos.length} achievements, ${reward.home} home items.`
                            }
                        })), minValues: 1, maxValues: 1, placeholder: "Select a mission chain"
                    }]
                }],
                attachments: [],
                files: []
            })
        }

        if (interaction.data.values.raw[0] === "summary") {
            return interaction.editParent({
                embeds: [{
                    title: "Summary of " + group.groupName,
                    description: `Total no. of missions: ${missions.length}\n`,
                    fields: [{
                        name: "Total Rewards",
                        value: rewardify(missions, true)
                    }, {
                        name: "Total Objectives",
                        value: objectify(missions)
                    }],
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "N/A",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    }
                }],
                components: [{
                    type: 1, components: [{
                        customID: "mission_menu_" + strtype + "_" + strgroupid + '_' + userId,
                        options: optionsify(missions, type), type: 3, minValues: 1, maxValues: 1
                    }]
                }], attachments: []
            });
        }

        const missionId = parseInt(interaction.data.values.raw[0]);
        const mission = find(missions, v => v.missionId === missionId);

        if (!mission) {
            interaction.message.components[0].components[0].disabled = true;
            await interaction.editParent({
                components: interaction.message.components
            });

            return interaction.createFollowup({ content: "The bot don't recognise the mission? It may be the missions have since been removed?", flags: 64});
        }
        
        const merchant = MerchantSBox.objMap.get(mission.merchantId);
        const files:File[] = [];
        let recycleAvatar = false;

        if (merchant && ImageManager.has("avatars", merchant.mercLink + ".png")) {
            if (interaction.message.embeds[0].footer?.text.slice("NPC: ".length) === merchant.mercName) {
                recycleAvatar = true;
            } else {
                await interaction.deferUpdate()
                files[0] = {
                    contents: await readFile(Config.dataDir + "/assets/avatars/" + merchant.mercLink + ".png"),
                    name: "avatar.png"
                }
            }
        };

        const obj1 = (recycleAvatar) ? {} : { attachments: [] };

        return (interaction.acknowledged ? interaction.editOriginal.bind(interaction) : interaction.editParent.bind(interaction))({
            embeds: [{
                title: (isDaily ? ("Daily Mission Chain: ") : ("Recent Mission Chain: ")) + group.groupName,
                fields: [{
                    name: "Before",
                    value: he.decode(replaceHTMLbits(Swarm.languages["SQL_mission_chat_" + mission.missionId])),
                }, {
                    name: "After",
                    value: he.decode(replaceHTMLbits(Swarm.languages["SQL_missions_txt_end" + mission.missionId])),
                }, {
                    name: "Reward(s)",
                    value: rewardify([mission], true),
                    inline: true
                }, {
                    name: "Requirement(s)",
                    value: `Level: ${mission.missionReqLvl}\nAlignment: ${alignment(mission.missionReqAlign)}\nClass: ${edClass(mission.missionReqClass)}`,
                    inline: true
                }, {
                    name: "Objective(s)",
                    value: objectify(mission), inline: true
                }],
                footer: {
                    text: merchant ? "NPC: " + merchant.mercName : "NPC: N/A"
                }, author: {
                    name: interaction.message.embeds[0].author?.name ?? "N/A",
                    iconURL: interaction.message.embeds[0].author?.iconURL
                }, thumbnail: {
                    url: (files.length || recycleAvatar) ? "attachment://avatar.png" : ""
                }
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    customID: "mission_menu_" + strtype + "_" + strgroupid + '_' + userId,
                    options: optionsify(missions, type, mission.missionId), type: 3, minValues: 1, maxValues: 1
                }]
            }], ...obj1, files
        })
    })