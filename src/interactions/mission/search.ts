import { readFile } from "fs/promises";
import ImageManager from "../../manager/image.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";
import Config from "../../config/index.js";
import { ButtonComponent, ButtonStyles, ComponentTypes } from "oceanic.js";
import Swarm from "../../manager/epicduel.js";
import { emojis, filter, find, getHighestTime, map } from "../../util/Misc.js";
import MissionSBox from "../../game/box/MissionBox.js";
import MerchantSBox from "../../game/box/MerchantBox.js";
import { objectify, rewardify } from "./recent.js";
import { replaceHTMLbits } from "../../manager/designnote.js";
import he from "he";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };
let edClass = (id: number) => { return id == 0 ? "None" : id == 1 ? "Hunter" : id == 2 ? "Mercenary" : id == 3 ? "Mage" : "Unknown" };

export default new Command(CommandType.Application, { cmd: ["mission", "search"], category: "Mission", description: "ed mission search." })
    .attach('run', async  ({ client, interaction }) => {
        if (MissionSBox.objMap.group.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const missionGroupId = interaction.data.options.getInteger("id", true);

        const group = MissionSBox.objMap.group.get(missionGroupId);

        if (!group) return interaction.reply({ flags: 64, content: "There are no missions with the ID given." });

        const missions = filter(MissionSBox.objMap.self, v => v.groupId === missionGroupId).sort((a, b) => a.missionOrder - b.missionOrder);
        const mission = missions[0];//find(missions, v => v.groupId === missionGroupId && v.missionOrder === 1);
        const merchant = mission ? MerchantSBox.objMap.get(mission.merchantId) : undefined;

        if (!mission || !merchant) {
            return interaction.reply({ content: "The bot don't recognise the mission chain anymore, it may be the missions have since been removed?", flags: 64});
        }

        const files = [];
        if (!interaction.acknowledged) await interaction.defer();

        if (ImageManager.has("avatars", merchant.mercLink + ".png")) {
            files[0] = {
                contents: await readFile(Config.dataDir + "/assets/avatars/" + merchant.mercLink + ".png"), name: "avatar.png"
            }
        }

        return interaction.reply({
            embeds: [{
                title: "Mission Chain: " + group?.groupName,
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
                    text: "NPC: " + merchant?.mercName
                }, author: {
                    name: interaction.user.username,//interaction.message.embeds[0].author?.name ?? "N/A",
                    iconURL: interaction.user.avatarURL()//interaction.message.embeds[0].author?.iconURL
                }, thumbnail: {
                    url: (files.length) ? "attachment://avatar.png" : ""
                }
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    customID: "mission_menu_2_" + missionGroupId + '_' + interaction.user.id,
                    options: [...map(missions, (val, index) => {
                        return {
                            label: val.missionName,
                            emoji: emojis.numbers[index],
                            value: String(val.missionId),
                            default: index == 0
                        }
                    }), { label: "Summary", value: "summary", emoji: { id: null, name: '📃'}}], type: 3, minValues: 1, maxValues: 1
                }]
            }], files
        })
    });