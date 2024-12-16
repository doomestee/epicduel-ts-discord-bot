import { ButtonStyles, ComponentTypes, Embed, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import ItemSBox from "../../../game/box/ItemBox.js";
import Swarm from "../../../manager/epicduel.js";
import AchievementRecord from "../../../game/record/AchievementRecord.js";
import SkillsSMBox from "../../../game/box/SkillsBox.js";
import SwarmResources from "../../../util/game/SwarmResources.js";

let alignment = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };

/**
 * @param {import("../../server/structures/record/AchievementRecord")} cheevo
 */
let parseCheevo = (cheevo: AchievementRecord) => {
    return cheevo.achDetails;
}

let parseCore = (coreId: number) => {
    const allRec = SkillsSMBox.recordBySkillId("all", SkillsSMBox.recordById("core", coreId)?.skillId ?? -1);//box.recordBySkillId("all", box.recordById("core", coreId).skillId);

    if (!allRec) return "UNABLE TO GRAB SKILL DESCRIPTION";

    return SwarmResources.langCheck(allRec.skillDesc);
}

type OptType = "ENHANCED_ONLY"|"NO_STYLES"|"CORE_ONLY";

export default new Command(CommandType.Component, { custom_id: "list_item_<type>_<pageNumber>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const type = parseInt(variables.type);
        const pageNumber = parseInt(variables.pageNumber);
        const { userId } = variables;

        let bypass = userId === "000";

        if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.createMessage(SwarmError.noClient());

        let options:Array<OptType> = [];

        if (userId !== "000" && interaction.message.components[1].components[0].type === ComponentTypes.STRING_SELECT) {
            options = interaction.message.components[1].components[0].options.filter(v => v.default).map(v => v.value) as OptType[];
        }

        if (type !== 0) return interaction.createMessage({ content: "The inputted type isn't supported.", flags: 64 });//.createFollowup({ content: "The core records returned null? Try again later please."});

        if (!interaction.acknowledged && userId !== "000") await interaction.deferUpdate();
        else if (!interaction.acknowledged && userId === "000") await interaction.defer();

        let rewards = ed.modules.BattlePass.rewards[options.includes("ENHANCED_ONLY") ? "enhanced" : "basic"]
            .map((v, i) => { return {...ed.modules.BattlePass.rewardInfo(v), i}})
            .filter(v => options.includes("NO_STYLES") ? v.type !== 1 : true)
            .filter(v => options.includes("CORE_ONLY") ? v.type === 0 && v.item.itemCat === 9 : true);

        let stuff = {
            credits: 0, varium: 0, arcade: 0, homeItem: 0, cheevo: 0, exp: 0, styles: 0, core: 0, item: 0, unknown: 0
        }

        let embeds:Embed[] = [{
            title: "List of Items in Battle Pass",
            description: "", author: {
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()
            }
        }];

        let desc = (i=0, text: string) => { embeds[0].description += `**${i+1}**. ` + text };

        for (let x = (10 * pageNumber); x < (10+(pageNumber*10)) && x < rewards.length; x++) {
            let reward = rewards[x]; let { i } = reward;

            switch (reward.type) {
                case 0: desc(i, `${reward.qty > 1 ? reward.qty + "x " : ""}[${reward.item.itemName}](https://epicduelwiki.miraheze.org/wiki/${encodeURIComponent(reward.item.itemName.split(" ").join("_"))}) (${ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[reward.item.itemCat]}, ID: ${reward.item.itemId})${reward.item.itemCat === 9 ? "\n" + parseCore(reward.item.coreId) : ""}\n\n`); break;
                case 1: desc(i, "Hair Style No. " + reward.styleId + "\n\n"); break;
                case 2: desc(i, "Home Item No. " + reward.homeItem.id + "\n\n"); break;
                case 3: desc(i, `[${reward.ach.achName}](https://epicduelwiki.miraheze.org/wiki/${encodeURIComponent(reward.ach.achName.split(" ").join("_"))}) - ${reward.ach.achRating} Rating\n${parseCheevo(reward.ach)}\n\n`); break;
                case 4: desc(i, reward.credits + ` Credits\n\n`); break;
                case 5: desc(i, reward.exp + " XP\n\n"); break;//stuff.exp += reward.exp; break;
                case 6: desc(i, reward.varium + " Varium\n\n"); break;//stuff.varium += reward.varium; break;
                default: desc(i, "Unknown reward type.\n\n");//stuff.unknown++; break;
            }
        }

        /**
         * @type {import("oceanic.js").ActionRowBase<import("oceanic.js").MessageComponent>[]}
         */

        // list_item_<type>_<pageNumber>_<userId>

        const components:MessageActionRow[] = [{
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: "list_item_0_" + ((pageNumber) - 1) + "_" + (userId === "000" ? interaction.user.id : userId),
                style: ButtonStyles.PRIMARY, label: "<", disabled: ((pageNumber) < 1)
            }, {
                type: ComponentTypes.BUTTON, customID: "promptidk",
                style: ButtonStyles.SECONDARY, label: "...", disabled: true,
            }, {
                type: ComponentTypes.BUTTON, customID: "list_item_0_" + ((pageNumber) + 1) + "_" + (userId === "000" ? interaction.user.id : userId),
                style: ButtonStyles.PRIMARY, label: ">", disabled: ((pageNumber) >= (Math.ceil(rewards.length / 10) - 1))
            }]
        }, {
            type: 1, components: [{ // list_item_<type>_<pageNumber>_<userId>
                type: ComponentTypes.STRING_SELECT, customID: "item_cat_0_" + (userId === "000" ? interaction.user.id : userId),
                minValues: 0, maxValues: 3, options: [{
                    label: "Enhanced Prizes",
                    value: "ENHANCED_ONLY", // "ENHANCED_ONLY"|"NO_STYLES"|"CORE_ONLY"
                    default: options.includes("ENHANCED_ONLY"),
                    description: "Flip to see the enhanced rewards.",
                }, {
                    label: "No Hair Styles",
                    value: "NO_STYLES",
                    default: options.includes("NO_STYLES"),
                    description: "Filter to hide hair styles.",
                    emoji: {
                        id: "1138975541400191058",
                        name: "nohairstyle"
                    }
                }, {
                    label: "Cores Only",
                    value: "CORE_ONLY",
                    default: options.includes("CORE_ONLY"),
                    description: "Filter to show cores only.",
                    emoji: {
                        id: "1138976149687504988",
                        name: "9lives"
                    }
                }]//categories.map((v, i) => { return { label: v, value: String(i + 1), description: ownIt(i),  default: filters.length && filters.includes(i + 1) }}), placeholder: "All"
            }]
        }];

        let optionsSend = {
            embeds, components
        };

        return (userId === "000") ? interaction.createFollowup(optionsSend) : interaction.editOriginal(optionsSend);
    });