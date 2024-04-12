import { readFile } from "fs/promises";
import MerchantSBox from "../../game/box/MerchantBox.js";
import ImageManager from "../../manager/image.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";
import Config from "../../config/index.js";
import { ButtonComponent, ButtonStyles, ComponentTypes } from "oceanic.js";
import Swarm from "../../manager/epicduel.js";
import { getHighestTime } from "../../util/Misc.js";

export default new Command(CommandType.Application, { cmd: ["npc", "search"], category: "NPC", description: "Pulls up the information about an Epicduel npc." })
    .attach('run', async  ({ client, interaction }) => {
        if (MerchantSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const merchId = interaction.data.options.getInteger("id", true);

        const merchant = MerchantSBox.objMap.get(merchId);

        if (!merchant) return interaction.reply({ flags: 64, content: "There are no merchants with the ID given." });

        if (!interaction.acknowledged) await interaction.defer();

        const files = [];

        if (ImageManager.has("avatars", merchant.mercLink + ".png")) {
            files[0] = {
                contents: await readFile(Config.dataDir + "/assets/avatars/" + merchant.mercLink + ".png"), name: "avatar.png"
            }
        }

        const components:ButtonComponent[] = [{
            type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
            customID: "shop_" + merchId + "_000",//"npc_0_" + merchant.merchantId + "_000",
            label: "Browse Wares", disabled: false,
            emoji: {
                name: "shop", id: "1145385937086447776"
            }
        }, {
            type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
            customID: "npc_1_" + merchant.merchantId + "_000",
            label: "(DEV) Missions", disabled: !client.isMaintainer(interaction.user.id),
            emoji: {
                name: "mission", id: "1145385934523727895"
            }
        }, {
            type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
            customID: "stat_0_" + merchant.merchantId + "_000",//"npc_2_" + merchant.merchantId + "_000",
            label: "Battle Stats (NPC)", disabled: false,
            emoji: {
                name: "skull", id: "1145388316666105888"
            }
        }];

        if (merchant.opts.some(v => v.id === 9 && v.args[0] >= 100 && v.args[0] < 200)) {
            components.push({
                type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
                customID: "stat_1_" + merchant.merchantId + "_000",//"npc_3_" + merchant.merchantId + "_000",
                label: "Battle Stats (Legendary NPC)", disabled: false,
                emoji: {
                    name: "skull", id: "1145388316666105888"
                }
            });
        }

        return interaction.createFollowup({
            embeds: [{
                thumbnail: (files.length) ? {
                    url: "attachment://avatar.png"
                } : undefined,
                /*image: {
                    url: "https://edwiki-image-proxy.cyclic.cloud/image?path=" + lang(merchant.mercName).replace(/[^a-zA-Z0-9]/g, "") + ".png"
                },*/
                title: Swarm.langCheck(merchant.mercName) + " (ID: " + merchant.merchantId + ", Lvl: " + merchant.merchantId + ")",
                description: Swarm.langCheck(merchant.mercChat),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                }
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components
            }], files
        });
    });