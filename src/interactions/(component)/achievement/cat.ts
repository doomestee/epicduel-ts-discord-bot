import { ButtonStyles, ComponentTypes, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import CacheManager from "../../../manager/cache.js";
import Achievements, { CheevoPopulated } from "../../../game/module/Achievements.js";
import Swarm from "../../../manager/epicduel.js";
import { filter, getHighestTime } from "../../../util/Misc.js";
import { paginateCheevo } from "./menu.js";

const categories = ["General", "War", "Boss", "Arcade", "Seasonal", "Badges", "Ultra-Rare", "Event"];

function ownText(index: number, cheevos: CheevoPopulated[]) {
    const cheevtered = filter(cheevos, v => v.categoryId === index + 1);
    const rares = filter(cheevtered, v => v.rarityId > 0);

    return `Owned: ${cheevtered.length} (of which: ${rares.length} Rares). Sum RP: ${cheevtered.reduce((a, b) => a + b.achRating, 0)}`;
}

function parseCheevo(cheevo: CheevoPopulated) {
    let desc = cheevo.achDetails.split("#").join(String(cheevo.count)).split("(,)").join(",");
    
    return cheevo.count == 1 ? desc.split("*").join("time") : desc.split("*").join("times");
}

export default new Command(CommandType.Component, { custom_id: "achiev_cat_<charId>_<userId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { charId, userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        const time = process.hrtime.bigint();

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        //if (!bypass && interaction.member.permissions.has("MANAGE_MESSAGES")) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const checked = CacheManager.check("achievement", parseInt(charId))

        let result:CheevoPopulated[] = [];

        if (!interaction.acknowledged) await interaction.deferUpdate();

        if (!checked.valid) {
            const cli = Swarm.getClient(v => v.connected && v.lobbyInit, true);

            if (!cli) return interaction.reply(SwarmError.noClient(true));

            const response = await cli.modules.Achievements.getAchievements(parseInt(charId))

            if (!response.success) return interaction.reply({ content: "The bot was unable to fetch the achievements." });

            result = response.value;
        } else result = Achievements.populateCheevos(checked.value);

        // note that each category value is just number (one-based).
        const filters = interaction.data.values.raw.map(Number);

        const filtered = (filters.length) ? filter(result, v => filters.includes(v.categoryId)) : result;

        if (!filters.length) filters.push(0);

        const components:MessageActionRow[] = [{
            type: 1, components: [{
                type: ComponentTypes.STRING_SELECT, customID: "achiev_cat_" + charId + "_" + userId,
                minValues: 0, maxValues: categories.length, options: categories.map((v, i) => {
                    return {
                        label: v, value: String(i + 1),
                        description: ownText(i, result),
                        default: filters[0] !== 0 && filters.includes(i + 1)
                    }
                }), placeholder: "All"
            }]
        }, {
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: "achiev_menu_" + charId + "_" + (userId === "000" ? interaction.user.id : userId) + "_-1_" + filters.join("-"),
                style: ButtonStyles.PRIMARY, label: "<", disabled: true
            }, {
                type: ComponentTypes.BUTTON, customID: "promptidk",
                style: ButtonStyles.SECONDARY, label: "...", disabled: true,
            }, {
                type: ComponentTypes.BUTTON, customID: "achiev_menu_" + charId + "_" + (userId === "000" ? interaction.user.id : userId) + "_1_" + filters.join("-"),
                style: ButtonStyles.PRIMARY, label: ">", disabled: (0 >= (Math.ceil(filtered.length / 8) - 1))
            }]
        }, {
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: `achiev_summary_${charId}_${userId}`,
                style: ButtonStyles.PRIMARY, label: "See Summary", emoji: { name: "🧻", id: null }
            }]
        }];

        return interaction.editOriginal({
            embeds: [{
                title: interaction.message.embeds[0].title?.slice(0, interaction.message.embeds[0].title.indexOf("'s Achievements")) + "'s Achievements (" + result.length + " - " + filtered.length + ")",
                //title: (variables.memberid !== "000" && interaction.message?.embeds[0].title) ? interaction.message.embeds[0].title : variables.charId + "'s Achievements (" + cache.length + ")",
                //title: variables.charId + "'s Achievements (" + cache.length + ")",
                description: paginateCheevo(0, filtered, 8),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}`
                }
            }], components
        })
    });