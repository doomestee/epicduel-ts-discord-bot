import { ButtonStyles, ComponentTypes, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import CacheManager from "../../../manager/cache.js";
import Achievements, { CheevoPopulated } from "../../../game/module/Achievements.js";
import Swarm from "../../../manager/epicduel.js";
import { getHighestTime, map } from "../../../util/Misc.js";
import AchievementSBox from "../../../game/box/AchievementBox.js";

const emojify = (...[id, name]: string[]) => ({ id, name, get wrapped() { return `<:${this.name}:${this.id}>` } });

export default new Command(CommandType.Component, { custom_id: "achiev_summary_<charId>_<userId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { charId, userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const time = process.hrtime.bigint();

        // let bypass = false;

        // if (interaction.user.id === userId) bypass = true;
        // //if (!bypass && interaction.member.permissions.has("MANAGE_MESSAGES")) bypass = true;

        // if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const checked = CacheManager.check("achievement", parseInt(charId))

        let result:CheevoPopulated[] = [];

        if (!interaction.acknowledged) await interaction.defer();

        if (!checked.valid) {
            const cli = Swarm.getClient(v => v.connected && v.lobbyInit, true);

            if (!cli) return interaction.reply(SwarmError.noClient(true));

            const response = await cli.modules.Achievements.getAchievements(parseInt(charId))

            if (!response.success) return interaction.reply({ content: "The bot was unable to fetch the achievements." });

            result = response.value;
        } else result = Achievements.populateCheevos(checked.value);

        const misc = {
            Founder: {
                desc: "Awarded to players that upgraded during EpicDuel's first month with Artix.",
                emoji: emojify("1085255841197858877", "AchFounder"),
                acquired: false
            },

            Beta: {
                desc: "Awarded to players that participated in EpicDuel's Beta testing phases.",
                emoji: emojify("1085255659248943114", "AchBeta"),
                acquired: false,
            },
            
            Gamma: {
                desc: "Awarded to players that participated in EpicDuel's Gamma phase.",
                emoji: emojify("1085255692564312105", "AchGamma"),
                acquired: false,
            },
            
            Delta: {
                desc: "Awarded to those brave individuals who participated in EpicDuel Delta!",
                emoji: emojify("1085255726080987146", "AchDeltaKnight"),
                acquired: false,
            },
            
            Omega: {
                desc: "Available during EpicDuel's Omega phase.",
                emoji: emojify("1085255785073872906", "AchOmegaOverlord"),
                acquired: true,
            },
            
            Influence: {
                desc: "Accumulation of war influence.",
                emoji: emojify("1201198130402701393", "influence"),
                count: 0
            },   
        }

        console.log(AchievementSBox.CATEGORY_WAR);
        for (let i = 0, len = result.length; i < len; i++) {
            const cheevo = result[i];

            if (cheevo.categoryId === AchievementSBox.CATEGORY_WAR && cheevo.achDetails.includes("Earned # Influence ")) {
                console.log([misc.Influence.count, cheevo.count]);
                misc.Influence.count += cheevo.count;
            }

            // if (cheevo.categoryId === AchievementSBox.CATEGORY_ULTRA_RARE) {
                else if (cheevo.achId === 170) misc.Omega.acquired = true;
                else if (cheevo.achId === 89)  misc.Delta.acquired = true;
                else if (cheevo.achId === 63)  misc.Gamma.acquired = true;
                else if (cheevo.achId === 89)  misc.Beta.acquired = true;
                else if (cheevo.achId === 7)   misc.Founder.acquired = true;
            // }
        }

        return interaction.createFollowup({
            embeds: [{
                title: "Selected Character's Info.",
                description: map(Object.entries(misc), ([key, val]) => {
                    if ("acquired" in val) {
                        return `**${key}**: ${val.acquired ? "<:GreenTick:1236716052746993875>" : "<:RedTick:1236716079397732393>"}\n*${val.desc}*`
                    } else return `**Estimated ${key}**: ${val.count}\n*${val.desc}*NOTE: This is estimated based on the achievements!`;
                }).join("\n\n"),//`Founder: ${misc.Founder.acquired ? "<GreenTick:1236716052746993875>" : "<:RedTick:1236716079397732393>"}\n`,
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }
            }]
        })
    });