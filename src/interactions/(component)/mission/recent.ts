import { ComponentTypes, File, StringSelectMenu } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import MissionSBox from "../../../game/box/MissionBox.js";
import { emojis, filter, find, map, numbers } from "../../../util/Misc.js";
import MerchantSBox from "../../../game/box/MerchantBox.js";
import ImageManager from "../../../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../../../config/index.js";
import Swarm from "../../../manager/epicduel.js";
import { objectify, rewardify } from "../../mission/recent.js";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };
let edClass = (id: number) => { return id == 0 ? "None" : id == 1 ? "Hunter" : id == 2 ? "Mercenary" : id == 3 ? "Mage" : "Unknown" };

export default new Command(CommandType.Component, { custom_id: 'mission_daily_menu_<userId>' })
    .attach('run', async ({ client, interaction, variables: { userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        let bypass = userId === "000";

        if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());

        if (MissionSBox.objMap.group.size === 0) return interaction.reply(SwarmError.noClient());

        const groupId = Number(interaction.data.values.raw[0]);

        const missions = filter(MissionSBox.objMap.self, v => v.groupId === groupId);
        const group = find(MissionSBox.objMap.group, v => v.groupId === groupId);

        if (!group) {
            interaction.message.components[0].components[0].disabled = true;
            await interaction.editParent({
                components: interaction.message.components
            });

            return interaction.createFollowup({ content: "The bot don't recognise the mission chain anymore, it may be the missions have since been removed?", flags: 64});
        }

        if (!interaction.acknowledged) await interaction.deferUpdate();

        const merchant = MerchantSBox.objMap.get(missions[0].merchantId);
        const files:File[] = [];

        if (merchant && ImageManager.has("avatars", merchant.mercLink + ".png")) {
            files[0] = {
                contents: await readFile(Config.dataDir + "/assets/avatars/" + merchant.mercLink + ".png"),
                name: "avatar.png"
            }
        };

        return interaction.editOriginal({
            embeds: [{
                title: "Mission Chain: " + group?.groupName,
                fields: [{
                    name: "Before",
                    value: Swarm.languages["SQL_mission_chat_" + missions[0].missionId],
                }, {
                    name: "After",
                    value: Swarm.languages["SQL_missions_txt_end" + missions[0].missionId]
                }, {
                    name: "Reward(s)",
                    value: rewardify([missions[0]], true),
                    inline: true
                }, {
                    name: "Requirement(s)",
                    value: `Level: ${missions[0].missionReqLvl}\nAlignment: ${alignment(missions[0].missionReqAlign)}\nClass: ${edClass(missions[0].missionReqClass)}`,
                    inline: true
                }, {
                    name: "Objective(s)",
                    value: objectify(missions[0]), inline: true
                }],
                footer: {
                    text: "NPC: " + merchant?.mercName
                }, author: {
                    name: interaction.message.embeds[0].author?.name ?? "N/A",
                    iconURL: interaction.message.embeds[0].author?.iconURL
                }, thumbnail: {
                    url: (files.length) ? "attachment://avatar.png" : ""
                }
            }], components: [{
                type: 1, components: [{
                    customID: "mission_menu_0_" + groupId + '_' + userId,
                    options: [...map(missions, (val, index) => {
                        return {
                            label: val.missionName,
                            emoji: emojis.numbers[index],
                            value: String(val.missionId),
                            default: index == 0
                        }
                    }), { label: "Summary", value: "summary", emoji: { id: null, name: '📃'}}, {label: "Go back", value: "reverse", emoji: {id: null, name: '↩️'}}], type: 3, minValues: 1, maxValues: 1
                }]
            }], files
        })
    });