import Swarm from "../../manager/epicduel.js";
import ImageManager from "../../manager/image.js";
import Command, { CommandType } from "../../util/Command.js";
import { getHighestTime, map } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";

export default new Command(CommandType.Application, { cmd: ["war", "leader"], description: "Sees who's currently leading the war.", waitFor: ["EPICDUEL", "LOBBY"], cooldown: 3000, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        // For intellisense
        if (interaction.type !== 2) return;

        const time = process.hrtime.bigint();

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving);

        if (!ed) return interaction.createMessage(SwarmError.noClient());

        if (!interaction.acknowledged) await interaction.defer();

        const alignId = interaction.data.options.getInteger("alignment") as 1 | 2 | undefined ?? 1;
        const mode = interaction.data.options.getInteger("mode") as 1 | 2 | undefined ?? 1;
        const regionId = interaction.data.options.getInteger("region");

        let gfx = ed.modules.WarManager.fetchGFXLeaders(regionId);
        const response = await ed.modules.WarManager.fetchLeaders(alignId, mode, regionId);

        if (!response.success) return interaction.reply({ content: "The request for war leaders timed out.", flags: 64 });

        const result = response.value;

        const files:import("oceanic.js").File[] = [];

        await gfx.then((v) => {
            if (v.success) {
                const { player } = v.value[alignId === 1 ? "exile" : "legion"];

                const armor = ed.boxes.item.objMap.get(player.charArm);
                const style = ed.boxes.style.getStyleRecord(player.charClassId, player.charHairS, player.charGender as "M" | "F");

                if (!armor || !armor.isArmorItemRecord() || !style) return undefined;

                return ImageManager.SVG.generator.char({
                    charAccnt: player.charAccnt,
                    charAccnt2: player.charAccnt2,
                    charArm: player.charArm,
                    charClassId: player.charClassId,
                    charEye: player.charEye,
                    charGender: player.charGender as "M" | "F",
                    charHair: player.charHair,
                    charHairS: player.charHairS,
                    charPri: player.charPri,
                    charSec: player.charSec,
                    charSkin: player.charSkin,
                    customHeadLink: armor.customHeadLink,
                    noHead: armor.noHead,
                    bypass: {
                        body: armor.getAssetPool(player.charClassId, { g: player.charGender }).body.slice("assets/armors/".length),
                        bicepR: armor.defaultLimbs ? null : armor.getAssetPool(player.charClassId, { g: player.charGender }).bicepR.slice("assets/armors/".length)
                    },
                    styleHasAbove: style ? style.styleHasAbove : false,
                    armClass: armor.itemClass as 0 | 1 | 2 | 3,
                    armGender: armor.itemSexReq as "M" | "F",
                    armMutate: armor.itemLinkage === "Mutate",
                    defaultLimbs: armor.defaultLimbs,
                })
            } else return undefined;
        }).then(v => {
            if (!v) return;

            files.push({
                contents: v,
                name: "creatura.png"
            });
        })

        return interaction.reply({
            embeds: [{
                title: (result.mode === 1 ? "Daily " : "Overall ") + ed.boxes.war.getRegionById(result.regionId)?.warTitle + " Leaders" + (alignId === 1 ? " - Exile" : " - Legion"),
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                },
                description: (result === undefined) ? "Sorry, there has been a problem fetching the war leaders, the developer has been notified." : map(result.player, (v, i) => (i+1) + ". " +  v[0] + " - " + v[1]).join("\n"),
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                },
                thumbnail: {
                    url: files.length ? "attachment://creatura.png" : ""
                }
            }],
            components: [{
                type: 1, components: [{
                    type: 3, customID: "war_leader_select_" + alignId + "_" + result.mode + "_" + result.regionId + "_" + interaction.user.id, minValues: 1, maxValues: 1, disabled: false, options: [{
                        label: "Player", value: "player", default: true, description: "Shows the top 20 " + (result.mode === 1 ? "daily" : "overall") + " players.", emoji: { name: "ArcadeToken", id: "1109227594462810142" }
                    }, {
                        label: "Faction", value: "faction", default: false, description: "Shows the top 20 " + (result.mode === 1 ? "daily" : "overall") + " factions.", emoji: { name: "faction", id: "1069333514811609138" }
                    }, {
                        label: "Info", value: "info", default: false, description: "Shows the basic information regarding to this previous war."
                    }, {
                        label: "List of Rallies", value: "rally", default: false, description: "Shows the list of the rallies that have taken place during this war."
                    }]
                }]
            }, {
                type: 1, components: [{
                    type: 2, label: "Refresh", style: 1, customID: `refresh_war_leader_info_${alignId}_${result.mode}_${result.regionId}_1_${interaction.user.id}`, disabled: false,
                }]
            }],
            files
        })
    })