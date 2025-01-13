import { ActionRowBase, ButtonStyles, ComponentTypes, MessageComponent } from "oceanic.js";
import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";

export default new Command(CommandType.Application, { cmd: ["battle-pass", "view"], waitFor: ["EPICDUEL"], cooldown: 3000, usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;
        // if (!interaction.acknowledged) await interaction.defer();

        const cli = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving);//centralClient//.getClient(v => v.connected && v.lobbyInit);

        if (!cli) return interaction.reply({ content: "There's no fresh client" })

        if (!cli.modules.BattlePass.active) return interaction.reply({ content: "There is no active battle pass at the moment.", flags: 64});

        let cores:number[] = [];

        let rewards = (isEnhanced=false) => {
            let rewarding = cli.modules.BattlePass.rewards[isEnhanced ? "enhanced" : "basic"].map(v => cli.modules.BattlePass.rewardInfo(v));

            let stuff = {
                credits: 0, varium: 0, arcade: 0, weapons: 0, homeItem: 0, cheevo: 0, exp: 0, styles: 0, core: 0, item: 0, unknown: 0
            }

            for (let i = 0; i < rewarding.length; i++) {
                let reward = rewarding[i];

                switch (reward.type) {
                    case 0:
                        if (cli.boxes.item.itemIsWeapon(reward.item['itemCat'])) stuff.weapons++;
                        else if (reward.item.itemId == 1660) stuff.arcade += reward.qty;
                        else if (reward.item.itemCat == 9) { if (reward.item.isCoreItemRecord() && !cores.includes(reward.item.coreId)) cores.push(reward.item.coreId); stuff.core++; }
                        else stuff.item++;
                        break;
                    case 1: stuff.styles++; break;
                    case 2: stuff.homeItem++; break;
                    case 3: stuff.cheevo++; break;
                    case 4: stuff.credits += reward.credits; break;
                    case 5: stuff.exp += reward.exp; break;
                    case 6: stuff.varium += reward.varium; break;
                    default: stuff.unknown++; break;
                }
            }

            return stuff.credits + ` credits,\n${stuff.varium} varium,\n${stuff.exp} exp,\n${stuff.arcade} arcade tokens,\n${stuff.weapons} weapons,\n${stuff.item} non-weapon items,\n${stuff.homeItem} home items,\n${stuff.styles} hair styles,\n${stuff.core} cores`

        }

        let reward = {
            basic: rewards(),
            enhanced: rewards(true),
        }

        let components:ActionRowBase<MessageComponent>[] = [{
            type: 1, components: [{
                type: ComponentTypes.BUTTON, customID: "refresh_battlePass_" + interaction.user.id + "_" + Math.round(cli.modules.BattlePass.lastCached),
                style: ButtonStyles.PRIMARY, label: "Refresh (DEV)", disabled: true
            }, {
                type: ComponentTypes.BUTTON, customID: "list_item_0_0_000",
                style: ButtonStyles.SECONDARY, label: "See Item(s)"
            }]
        }]

        if (cores.length) components[0].components.push({
            type: ComponentTypes.BUTTON, customID: "list_cores_" + cores.join("-") + "_000_0",
            style: ButtonStyles.SECONDARY, label: "[DEPRECATED] See Core(s)", disabled: true
        });

        let result = () => { 
            return interaction.reply({
                embeds: [{
                    title: "Battle Pass: " + cli.modules.BattlePass.name,
                    description: "Active challenges:",
                    fields: [{
                        name: "Daily",
                        value: cli.modules.BattlePass.challenges.daily.map((v) => `${v[0]} (**${v[2]}**) - ${v[3]} XP`).join("\n"),
                    }, {
                        name: "Weekly",
                        value: cli.modules.BattlePass.challenges.weekly.map((v) => `${v[0]} (**${v[2]}**) - ${v[3]} XP`).join("\n"),
                    }, {
                        name: "Info",
                        value: `rDays (?): ${cli.modules.BattlePass.rDays}\nMax Daily XP: ${cli.modules.BattlePass.challenges.daily.reduce((a, b) => a + b[3], 0)}\nMax Weekly XP: ${cli.modules.BattlePass.challenges.weekly.reduce((a, b) => a + b[3], 0)}`
                    }, {
                        name: "Reward (Basic)",
                        value: reward.basic,
                        inline: true
                    }, {
                        name: "Reward (Enhanced)",
                        value: reward.enhanced,
                        inline: true
                    }]
                }], components
            });
        }

        // Refresh challenges if empty
        if (cli.modules.BattlePass.challenges.daily.length === 0 || ((cli.modules.BattlePass.lastCached + 3600000) < Date.now()) || (cli.modules.BattlePass.lastCachedD.getDay() !== new Date().getDay())) {
            await interaction.defer();
            cli.modules.BattlePass.openChallenges();

            let refreshed = 0;
            let int: NodeJS.Timeout | undefined;

            let func = () => {
                refreshed++;

                if (cli.modules.BattlePass.challenges.daily.length === 0) {
                    if (refreshed > 5) {
                        return interaction.createFollowup({content: "There was an error refreshing the challenges. Please try again later.", flags: 64});
                    }
    
                    int = setTimeout(func, 2000);
                } else {
                    clearTimeout(int);
                    result();
                }
            }

            int = setTimeout(func, 1000);
        } else result();
    });