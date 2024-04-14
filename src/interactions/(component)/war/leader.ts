import Command, { CommandType } from "../../../util/Command.js";
import Swarm from "../../../manager/epicduel.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import DatabaseManager from "../../../manager/database.js";
import { IWar } from "../../../Models/War.js";
import { filter, getHighestTime, map } from "../../../util/Misc.js";
import type { File } from "oceanic.js";
import ImageManager from "../../../manager/image.js";

/**
 * @param {Date} date 
 */
let lazyFormatTime = (date: Date | number | null) => {date = (date instanceof Date) ? date : new Date(date ?? 0); return `<t:${Math.floor(date.getTime() / 1000)}:T> <t:${Math.floor(date.getTime() / 1000)}:D>`; }

let align = (id: number) => { return id == 0 ? "None" : id == 1 ? "Exile" : id == 2 ? "Legion" : "Unknown" };

type ValType = "faction"|"player"|"info"|"rally";

export default new Command(CommandType.Component, { custom_id: "war_leader_select_<alignment>_<mode>_<regionId>_<userId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== 3) return;

        const time = process.hrtime.bigint();

        let bypass = false;

        const { userId } = variables;

        const alignment = parseInt(variables.alignment) as 1 | 2;
        const mode = parseInt(variables.mode) as 1 | 2;
        const regionId = parseInt(variables.regionId);

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient());
        
        if (!interaction.acknowledged) await interaction.deferUpdate();

        const type = interaction.data.values.raw[0] as ValType;

        // /**
        //  * @type {import("../../structures/DBWar")}
        //  */
        // let warR = undefined;
        
        // = (type === "info" || type === "rally") ? await database.cli.query(`SELECT * FROM war WHERE region_id = $1 ORDER BY id desc LIMIT 1`, [variables.regionId]).then(v => v.rows) : null;//.db("war").where({ regionId: variables.regionId }).orderBy("id", "desc").limit(1) : null;

        // if (warR && warR.length) warR = warR[0];

        const components = [{
            type: 1, components: [{
                type: 3, customID: "war_leader_select_" + variables.alignment + "_" + variables.mode + "_" + variables.regionId + "_" + userId, minValues: 1, maxValues: 1, disabled: false, options: [{
                    label: "Player", value: "player", default: type === "player", description: "Shows the top 20 daily/overall players.", emoji: { name: "ArcadeToken", id: "1109227594462810142" }
                }, {
                    label: "Faction", value: "faction", default: type === "faction", description: "Shows the top 20 daily/overall factions.", emoji: { name: "faction", id: "1069333514811609138" }
                }, {
                    label: "Info", value: "info", default: type === "info", description: "Shows the basic information regarding to this previous war."
                }, {
                    label: "List of Rallies", value: "rally", default: type === "rally", description: "Shows the list of the rallies that have taken place during this war."
                }]
            }]
        }, {
            type: 1, components: [{
                type: 2, label: "Refresh", style: 1, customID: "refresh_war_leader_info_" + variables.userId, disabled: true
            }]
        }]

        const warR = type === "info" || type === "rally" ? await DatabaseManager.cli.query<IWar>(`SELECT * FROM war WHERE region_id = $1 ORDER BY id desc LIMIT 1`, [variables.regionId]).then(v => v.rows) : [];

        if (type === "info") {
            return interaction.editOriginal({
                embeds: [{
                    title: ed.boxes.war.getRegionById(regionId)?.['warTitle'] + " (ID: " + warR[0].id + ")",
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "unknown",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    }, description: `War influence required to win: **${warR[0].max_points}**\n\nStarted at: ${lazyFormatTime(warR[0].created_at)}\nEnded at: ${lazyFormatTime(warR[0].ended_at)}\n\nWinner Alignment: N/A`,
                    footer: {
                        text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                    },
                    // `War influence required to win: **${points.max[0]}**\n\nExile has **${points.current[1]}** influence (**${points.currentPercent[1]}**).\nLegion has **${points.current[0]}** influence (**${points.currentPercent[0]}**).\n\n${rally}${(isInCoolDown) ? `\n\nWar has already ended, it is currently in cooldown for ${epicduel.client.modules.WarManager.cooldownHours} hours (<t:${Math.round(rawHoursified(epicduel.client.modules.WarManager.cooldownHours, epicduel.client.modules.WarManager.cooldownLastUpdated).getTime()/1000)}:F>)` : ""}`
                }], components, attachments: [], files: []
            })
        } else if (type === "rally") {
            const rallies = await DatabaseManager.helper.getRallies(warR[0].id);

                let count = filter(rallies, v => v.alignment === 1).length;
                let contentParsed = "";

                let sillyThing = false;

                // In case the war didn't have any rallies yet.
                for (let i = rallies.length; i > 0; i--) {
                    let v = rallies[i - 1];

                    if (contentParsed.length > 1900) continue;

                    const time = v.triggered_at.getTime();

                    if (warR[0].id === 28 && sillyThing === false && 1710277236526 > time) {
                        sillyThing = true;
                        contentParsed += `\n\n**!!!**\nTriggered at: <t:1710277236:D> <t:1710277236:T>.\nDetails: **James and Mandatory stopped playing**.`
                    }

                    contentParsed += `\n\n#${i}\nTriggered at: <t:${Math.round(time/1000)}:D> <t:${Math.round(time/1000)}:T>.\nAlignment: **${align(v.alignment)}**.`;
                }

            return interaction.editOriginal({
                embeds: [{
                    title: "Rallies Info - War ID: " + warR[0].id,
                    author: {
                        name: interaction.message.embeds[0].author?.name ?? "unknown",
                        iconURL: interaction.message.embeds[0].author?.iconURL
                    },
                    footer: {
                        text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                    },
                    description: `There are ${rallies.length} rallies - Exile ${count}, Legion ${rallies.length-count}.${contentParsed}`
                }], components, attachments: [], files: []
            });
        }

        const files:File[] = [];

        await ed.modules.WarManager.fetchGFXLeaders(regionId).then(v => {
            if (v.success) {
                const { player, faction } = v.value[alignment === 1 ? "exile" : "legion"];

                if (type === "player") {
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
                description: (result === undefined) ? "Sorry, there has been a problem fetching the war leaders, the developer has been notified." : map(result[type], (v, i) => (i+1) + ". " +  v[0] + " - " + v[1]).join("\n"),
                footer: {
                    text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
                },
                thumbnail: {
                    url: files.length ? "attachment://charorflag.png" : ""
                }
            }], components, attachments: [], files
        });
    })