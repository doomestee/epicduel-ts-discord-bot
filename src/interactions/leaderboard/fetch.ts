import { ActionRowBase, ButtonComponent, ButtonStyles, ComponentTypes, MessageActionRow, SelectMenuComponent, SelectOption, StringSelectMenuOptions, TextButton, File } from "oceanic.js";
import Leader, { CharacterLeaderType, LeaderType } from "../../game/module/Leader.js";
import DatabaseManager, { quickDollars } from "../../manager/database.js";
import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import { headings, transform } from "../../util/Leaderboard.js";
import { emojis, find, getHighestTime, getUserLevelByExp, map } from "../../util/Misc.js";
import { SwarmError } from "../../util/errors/index.js";

import { AsciiTable3, AlignmentEnum } from "ascii-table3";
import { IFaction } from "../../Models/Faction.js";
import { ICharacter } from "../../Models/Character.js";
import ClassBox from "../../game/box/ClassBox.js";
import ImageManager from "../../manager/image.js";

export const lbNames = [map(["1v1 Wins", "2v2 Wins", "Juggernaut Wins", "Personal Influence", "Fame", "Inventory Rarity", "Faction 1v1 Champions", "Faction 2v2 Champions", "Faction Juggernaut Champions", "World Dominations", "War Upgrades", "Faction Influence", "Code Redeems", "Player Rating"], v => 'All - ' + v), map(["1v1 Wins (Default)", "2v2 Wins", "Juggernaut Wins", "Faction 1v1 Wins", "Faction 2v2 Wins", "Faction Juggernaut Wins", "Fame", "Code Redeems"], v => 'Daily - ' + v)].flat(1);
export const correspondingIndexes = [1, 2, 16, 11, 14, 13, 8, 9, 19, 7, 10, 12, 21, 22, 3, 4, 17, 5, 6, 18, 15, 20] as const;

export const lbTypes = {} as { [x in LeaderType]: string };

for (let i = 0, len = correspondingIndexes.length; i < len; i++) {
    lbTypes[correspondingIndexes[i]] = lbNames[i];
}

/**
 * THIS ISN'T FOR ANY SORT FUNCTION, it only sorts leaderboards!
 */
export function sortFn<T extends Array<any> = Array<any>>(this: T, obj1: any, obj2: any) {
    let index0 = -1; let index1 = -1;

    for (let i = 0, len = this.length; i < len; i++) {
        if (this[i]["name"] === obj1["name"]) index0 = i;
        if (this[i]["name"] === obj2["name"]) index1 = i;
    }

    return index0 - index1;
}

export default new Command(CommandType.Application, { cmd: ["leaderboard", "fetch"], description: "Fetches the leaderboard!", waitFor: ["EPICDUEL", "LOBBY"], cooldown: 3000, gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction }) => {
        const time = process.hrtime.bigint();
        const cooldown = Math.round(Date.now());

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient(true));

        const type = interaction.data.options.getInteger("type") as LeaderType ?? 3;

        // 666 is custom bot - fame for shame
        if (type < 1 || (type > 22/* && type !== 666*/)) return interaction.reply({ content: "Invalid type! Valid types are 1-22." });

        const table = new AsciiTable3(lbTypes[type]).setAlignLeft(1).setStyle("unicode-double").setHeading("No.", "Name", ...headings(type));

        if (!interaction.acknowledged) await interaction.defer();

        const result = await ed.modules.Leader.fetch(type);

        if (!result.success) return interaction.reply({ embeds: [{ description: "The bot was unable to grab the leaderboard data, it may be that the server have timed out.", footer: { text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`} }] });

        let userSetting = await DatabaseManager.helper.getUserSettings(interaction.user.id);

        if (userSetting === null) {
            userSetting = {
                id: interaction.user.id, flags: 0, lb_view: 0, lb_default: 0
            }

            await DatabaseManager.helper.createUserSettings(userSetting);
        }

        const leaders = result.value;

        const isFaction = Leader.Indexes.Faction.includes(type);

        let components = [{
            type: ComponentTypes.ACTION_ROW,
            components: [{
                type: 3, customID: isFaction ? `faction_select_000` : `char_menu_000_1`,//"select_lb_" + (isFaction ? "2" : "1") + "_000",
                placeholder: "Select to see their partial info (cached)!",
                options: [] as SelectOption[]
            }]
        }, {
            type: ComponentTypes.ACTION_ROW, components: [{
                type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
                // disabled: (type === 666),
                customID: "refresh_lb_" + type + "_" + interaction.user.id + "_" + cooldown, label: "Refresh"
            }]
        }] as [ActionRowBase<SelectMenuComponent>, ActionRowBase<TextButton>];

        type ExtractValueType<T> = T extends Array<infer V> ? V : never;

        const volues = await DatabaseManager.cli.query<IFaction | ICharacter>(`SELECT * FROM ${isFaction ? "faction" : "character"} WHERE name IN (${quickDollars(leaders.length)})${isFaction ? " ORDER BY id desc" : ""}`, leaders.map(v => v.name))
            .then(v => v.rows);

        volues.sort(sortFn.bind(leaders));

        const mergedArr = [] as Array<((IFaction | ICharacter) & { available: true }) | ( ExtractValueType<typeof leaders> & { available: false})>;

        for (let i = 0, len = leaders.length; i < len; i++) {
            const diffObj = find(volues, v => v.name === leaders[i].name);

            if (diffObj) mergedArr.push({ ...diffObj, available: true });
            else mergedArr.push({ ...leaders[i], available: false });
        }

        // let indexice = table.getHeading().findIndex(v => v === "Lvl" || v === "Level");

        for (let i = 0; i < mergedArr.length; i++) {
            const item = mergedArr[i]; const leaderItem = leaders[i];

            // cba to rewrite to be more ts friendly
            //@ts-expect-error
            let expL = (item.available || "exp" in leaderItem) && !isFaction ? getUserLevelByExp(item.available ? item.exp : leaderItem.exp) : null;

            // if (client.debug) {
            //     console.log(["ac01", {
            //         expL, mrar: item
            //     }])
            // }

            // if (indexice && !table.rows[i][indexice] && expL) table.rows[i][indexice] = expL !== 40 ? expL + "?" : expL;

            let classId = -1;

            if (leaderItem.misc && "classId" in leaderItem.misc) {
                classId = leaderItem.misc.classId;
            }

            (components[0].components[0] as StringSelectMenuOptions)["options"][i] = {
                label: item.name,
                description: item.available ? (isFaction ? `Alignment: ${item.alignment === 1 ? "Exile" : "Legion"}, ID: ${item.id}` : `Lvl: ${expL !== 40 ? expL + "?" : expL}, ID: ${item.id}, Class: ${classId !== -1 ? ClassBox.CLASS_NAME_BY_ID[classId] : "N/A"}`) : (isFaction ? "Faction" : "Character" )+ " not cached, " + ("Class: " + (classId !== -1 ? ClassBox.CLASS_NAME_BY_ID[classId] : "N/A")),
                value: isFaction ? (item.available ? "a" + item.id : "u" + item.name) : item.name,//item.available ? "a" + item.id : "u" + item.name,
                emoji: emojis.numbers[i],
            };

            // if (item.available) {
                if (Leader.isFaction(type, leaderItem) && leaderItem["misc"] && item["available"]) {
                    leaderItem.misc.align = item.alignment === 1 ? "Exile" : "Legion";
                }
            // }

            table.addRow(i + 1, mergedArr[i].name, ...(transform(type, leaderItem)));
        }

        // // tis only a few kb's prob anyways
        // for (let i = 0; i < leaders.length; i++) {
        //     table.addRow(i + 1, leaders[i].name, ...(transform(type, leaders[i])));
        // }

        let files:File[] = [];
        let content = "```xl\n" + table.toString() + "```";//"\n**__" + lbnames[type] + "__**" + "\n```xl\n" + table.toString() + "```";//((type === 666) ? "The bot tracks any fame requests or phrases at vendbot, when it's there." : "")+ "\n**__" + lbnames[type] + "__**" + "\n```xl\n" + table.toString() + "```";

        // if (type !== 666) {// && /*[1, 2, 16, 3, 4, 17,  8, 9, 19, 5, 6, 18].includes(type) && */client.isMaintainer(interaction.member.id)) {
            components[1].components.push({
            // components[components.findIndex(v => v.components[0].customID.startsWith("refresh"))].components.push({
                type: ComponentTypes.BUTTON, style: 1, customID: `switch_view_lb_${interaction.user.id}_${type}_${userSetting.lb_view === 0 ? 1 : 0}_${cooldown}`, label: "Switch View",
                emoji: { name: userSetting.lb_view === 1 ? "📰" : "📷" }
            });

        if (userSetting.lb_view === 1 || userSetting.lb_view > 1 && isFaction) {
            files = [{
                contents: await ImageManager.SVG.generator.lb(type, leaders),
                name: "img.png"
            }]; content = "";
        }

        if (userSetting.lb_view > 1 && !isFaction) {
            files = [{
                contents: await ImageManager.SVG.generator.lb20(type as unknown as CharacterLeaderType, leaders as CacheTypings.AnyPlayerLeaders[], (userSetting.lb_view - 2) as 0 | 1),
                name: "img.png"
            }]; content = "";
        }
        // }

        // In case there's nobody in it or smth
        if (components[0].components[0].type === 3 && components[0].components[0].options.length === 0) {
            components[0].components[0].options.push({
                label: "Placeholder",
                description: `Placeholder`,
                value: "a" + 1234
            });
            components[0].components[0].disabled = true;
        }

        return interaction.createFollowup({
            content, files,
            components,
        });
    })