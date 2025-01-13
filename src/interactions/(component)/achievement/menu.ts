import { ButtonStyles, ComponentTypes, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import Swarm from "../../../manager/epicduel.js";
import { filter, getHighestTime, map } from "../../../util/Misc.js";
import Achievements, { CheevoPopulated } from "../../../game/module/Achievements.js";
import CacheManager from "../../../manager/cache.js";

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

export function paginateCheevo(pageNumber: number = 0, cheevos: CheevoPopulated[], multiplier = 6) {
    let result = "";

    for (let i = pageNumber*multiplier, count = multiplier+(pageNumber*multiplier), len = cheevos.length; i < count && i < len; i++) {
        result += `**${i+1}**. [${cheevos[i].achName}](https://epicduelwiki.miraheze.org/wiki/${encodeURIComponent(cheevos[i].achName.split(" ").join("_"))}) - ${cheevos[i].achRating} Rating\n${parseCheevo(cheevos[i])}\n\n`;
    }

    return result;
}

// THIS IS A BUTTON, FOR CREATING A NEW MENU
export default new Command(CommandType.Component, { custom_id: "achiev_menu_<charId>_<userId>_<pageNumber>_<category>", gateVerifiedChar: 69 })
    .attach("run", async ({ client, interaction, variables: { userId, charId, pageNumber, category } }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const time = process.hrtime.bigint();

        let bypass = false;

        if (userId === "000") bypass = true;
        else if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());

        const checked = CacheManager.check("achievement", parseInt(charId))

        let result:CheevoPopulated[] = [];

        if (!interaction.acknowledged) {
            if (userId !== "000") await interaction.deferUpdate();
            else await interaction.defer();
        }

        if (!checked.valid) {
            const cli = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving, true);

            if (!cli) return interaction.reply(SwarmError.noClient(true));

            const response = await cli.modules.Achievements.getAchievements(parseInt(charId))

            if (!response.success) return interaction.reply({ content: "The bot was unable to fetch the achievements." });

            result = response.value;
        } else result = Achievements.populateCheevos(checked.value);

        let filters:number[] = [];

        if (category !== "0") {
            filters = category.split("-").map(Number);
        }

        const filtered = (filters.length) ? filter(result, v => filters.includes(v.categoryId)) : result;

        const components:MessageActionRow[] = [{
            type: 1, components: [{
                type: ComponentTypes.STRING_SELECT, customID: "achiev_cat_" + charId + "_" + (userId === "000" ? interaction.user.id : userId),
                minValues: 0, maxValues: categories.length, options: map(categories, (v, i) => {
                    return {
                        label: v,
                        value: String(i + 1),
                        description: ownText(i, result),
                        default: filters.length > 0 && filters.includes(i + 1)
                    };
                }), placeholder: "All"
            }]
        }, {
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: "achiev_menu_" + charId + "_" + (userId === "000" ? interaction.user.id : userId) + "_" + (parseInt(pageNumber) - 1) + "_" + category,
                style: ButtonStyles.PRIMARY, label: "<", disabled: (parseInt(pageNumber) < 1)
            }, {
                type: ComponentTypes.BUTTON, customID: "promptidk",
                style: ButtonStyles.SECONDARY, label: "...", disabled: true,
            }, {
                type: ComponentTypes.BUTTON, customID: "achiev_menu_" + charId + "_" + (userId === "000" ? interaction.user.id : userId) + "_" + (parseInt(pageNumber) + 1) + "_" + category,
                style: ButtonStyles.PRIMARY, label: ">", disabled: (parseInt(pageNumber) >= (Math.ceil(filtered.length / 8) - 1))
            }]
        }, {
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: `achiev_summary_${charId}_${userId}`,
                style: ButtonStyles.PRIMARY, label: "See Summary", emoji: { name: "🧻", id: null }
            }]
        }];

        return (userId === "000" ? interaction.createFollowup.bind(interaction) : interaction.editOriginal.bind(interaction))({
            embeds: [{
                title: (userId === "000") ? interaction.message.embeds[0].title + "'s Achievements (" +result.length + ")" : interaction.message.embeds[0].title?.slice(0, interaction.message.embeds[0].title.indexOf("'s Achievements")) + "'s Achievements (" + result.length + (category !== "0" ? " - " + filtered.length : "") + ")",
                //(userId === "000") ? interaction.message.embeds[0].title + "'s Achievements (" + cache.length + ")" : interaction.message.embeds[0].title.slice(0, interaction.message.embeds[0].title.indexOf("'s Achievements")) + "'s Achievements (" + cache.length + ((variables.category !== "0") ? " - " + filtered.length : "") + ")",
                //title: (variables.memberid !== "000" && interaction.message?.embeds[0].title) ? interaction.message.embeds[0].title : variables.charId + "'s Achievements (" + cache.length + ")",
                //title: variables.charId + "'s Achievements (" + cache.length + ")",
                description: paginateCheevo(parseInt(pageNumber), filtered, 8),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}`
                }
            }], components
        })
    })