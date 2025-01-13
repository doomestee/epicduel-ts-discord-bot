import { ComponentTypes } from "oceanic.js";
import DatabaseManager from "../../../manager/database.js";
import Command, { CommandType } from "../../../util/Command.js";
import { findIndex, getUserLevelByExp, levels, map } from "../../../util/Misc.js";
import Swarm from "../../../manager/epicduel.js";
import { SwarmError } from "../../../util/errors/index.js";

export default new Command(CommandType.Component, { custom_id: "character_verify_edserver" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (!interaction.inCachedGuildChannel()) return interaction.reply({ content: "This command can only be used in guilds." });
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        let roles = map([
            ["1081679325121744946", "Beta", "Awarded to players that participated in EpicDuel's Beta testing phases.", ["1085255626604691596", "AchAlpha"]],
            ["1081679368293724271", "Gamma", "Awarded to players that participated in EpicDuel's Gamma phase.", ["1085255692564312105", "AchGamma"]],
            ["1081679415882297524", "Delta", "Awarded to those brave individuals who participated in EpicDuel Delta!", ["1085255726080987146", "AchDeltaKnight"]],
            ["1081679443162050560", "Omega", "Available during EpicDuel's Omega phase.", ["1085255785073872906", "AchOmegaOverlord"]]
        ], v => {return { id: v[0], name: v[1], desc: v[2], emoji: { id: v[3][0], name: v[3][1] }}});

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving);

        if (!ed) return interaction.reply(SwarmError.noClient());

        await interaction.defer(64);

        const charLinks = await DatabaseManager.helper.getCharacterLinks(interaction.user.id);

        if (charLinks.length === 0) return interaction.reply({ content: "You do not have any linked characters, link one in order to use this feature." });

        let oldestChar = charLinks[0];

        for (let i = 0, len = charLinks.length; i < len; i++) {
            if (charLinks[i].id < oldestChar.id) {
                oldestChar = charLinks[i];
            }
        }

        const result = await ed.modules.Achievements.getAchievements(oldestChar.id);

        if (!result.success) return interaction.reply({ content: "Unable to fetch your oldest character's (by its ID) achievemments, the server may have timed out, please try again?" });

        const cheevos = result.value;

        const checks = {
            phase: {
                Alpha: findIndex(cheevos, v => v.achId === 1) !== -1,
                Beta: findIndex(cheevos, v => v.achId === 2) !== -1,
                Gamma: findIndex(cheevos, v => v.achId === 63) !== -1,
                Delta: findIndex(cheevos, v => v.achId === 89) !== -1,
                Omega: findIndex(cheevos, v => v.achId === 170) !== -1,
            }, bonus: {
                elite: findIndex(cheevos, v => v.achId === 3) !== -1,
                founder: findIndex(cheevos, v => v.achId === 7) !== -1,
            }
        };

        return interaction.createFollowup({
            content: "Pick your role(s), oldest character linked: " + oldestChar.name + " (Lvl " + getUserLevelByExp(oldestChar.exp) + ")",
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, minValues: 1, maxValues: Object.values(checks.phase).reduce((a, b) => a + (b ? 1 : 0), 0), customID: "select_chars_" + interaction.user.id,
                    options: roles.map(v => {return {
                        label: v.name,
                        value: v.id, description: v.desc,
                        default: interaction.member.roles.includes(v.id),
                        emoji: v.emoji,
                    }}).filter(v => checks.phase[v.label as "Alpha"])
                }]
            }]
        });
    });