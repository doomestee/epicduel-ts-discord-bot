import Command, { CommandType } from "../../../util/Command.js";
import Swarm from "../../../manager/epicduel.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import { getHighestTime, map } from "../../../util/Misc.js";
import { ComponentTypes, type File } from "oceanic.js";
import ImageManager from "../../../manager/image.js";

export default new Command(CommandType.Component, { custom_id: "refresh_war_leader_info_<alignment>_<mode>_<regionId>_<type>_<userId>", waitFor: ["EPICDUEL", "LOBBY"], gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const time = process.hrtime.bigint();

        let bypass = false;

        const { userId } = variables;

        const alignment = parseInt(variables.alignment) as 1 | 2;
        const mode = parseInt(variables.mode) as 1 | 2;
        const regionId = parseInt(variables.regionId);
        const type = parseInt(variables.type) as 1 | 2;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving);

        if (!ed) return interaction.reply(SwarmError.noClient());
        
        if (!interaction.acknowledged) await interaction.deferUpdate();

        // /**
        //  * @type {import("../../structures/DBWar")}
        //  */
        // let warR = undefined;
        
        // = (type === "info" || type === "rally") ? await database.cli.query(`SELECT * FROM war WHERE region_id = $1 ORDER BY id desc LIMIT 1`, [variables.regionId]).then(v => v.rows) : null;//.db("war").where({ regionId: variables.regionId }).orderBy("id", "desc").limit(1) : null;

        // if (warR && warR.length) warR = warR[0];

        const components = [{
            type: 1, components: [{
                type: 3, customID: "war_leader_select_" + variables.alignment + "_" + variables.mode + "_" + variables.regionId + "_" + userId, minValues: 1, maxValues: 1, disabled: false, options: [{
                    label: "Player", value: "player", default: type === 1, description: "Shows the top 20 daily/overall players.", emoji: { name: "ArcadeToken", id: "1109227594462810142" }
                }, {
                    label: "Faction", value: "faction", default: type === 2, description: "Shows the top 20 daily/overall factions.", emoji: { name: "faction", id: "1069333514811609138" }
                }, {
                    label: "Info", value: "info", default: false, description: "Shows the basic information regarding to this previous war."
                }, {
                    label: "List of Rallies", value: "rally", default: false, description: "Shows the list of the rallies that have taken place during this war."
                }]
            }]
        }, {
            type: 1, components: [{
                type: 2, label: "Refresh", style: 1, customID: `refresh_war_leader_info_${variables.alignment}_${variables.mode}_${variables.regionId}_${type}_${userId}`, disabled: false
            }]
        }]

        const files:File[] = [];

        await ed.modules.WarManager.fetchGFXLeaders(regionId).then(v => {
            if (v.success) {
                const { player, faction } = v.value[alignment === 1 ? "exile" : "legion"];

                if (type === 1) {
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
                } else {
                    return ImageManager.SVG.generator.fact({
                        alignment: alignment,
                        back: faction.fctBack,
                        backColor: faction.fctBackClr,
                        flagColor: faction.fctFlagClr,
                        symbol: faction.fctSymb,
                        symbolColor: faction.fctSymbClr
                    }, true, false);
                }
            } else return undefined;
        }).then(v => {
            if (!v) return;

            files[0] = {
                contents: v,
                name: "charorflag.png"
            };
        });

        const response = await ed.modules.WarManager.fetchLeaders(alignment, mode, regionId);;

        if (!response.success) return interaction.reply({ content: "The request for war leaders timed out.", flags: 64 });

        const result = response.value;

        return interaction.editOriginal({
            embeds: [{
                title: (result.mode === 1 ? "Daily " : "Overall ") + ed.boxes.war.getRegionById(regionId)?.['warTitle'] + " Leaders",
                author: {
                    name: interaction.message.embeds[0].author?.name ?? "unknown",
                    iconURL: interaction.message.embeds[0].author?.iconURL
                },
                description: (result === undefined) ? "Sorry, there has been a problem fetching the war leaders, the developer has been notified." : map(result[type === 1 ? "player" : "faction"], (v, i) => (i+1) + ". " +  v[0] + " - " + v[1]).join("\n"),
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}, refreshed at`
                },
                timestamp: interaction.createdAt.toISOString(),//new Date().toISOString(),
                thumbnail: {
                    url: files.length ? "attachment://charorflag.png" : ""
                }
            }], components, attachments: [], files
        });
    });