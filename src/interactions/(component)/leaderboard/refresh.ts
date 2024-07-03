import { AsciiTable3 } from "ascii-table3";
import Leader, { CharacterLeaderType, LeaderType } from "../../../game/module/Leader.js";
import Swarm from "../../../manager/epicduel.js";
import Command, { CommandType } from "../../../util/Command.js";
import { headings, transform } from "../../../util/Leaderboard.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import DatabaseManager, { quickDollars } from "../../../manager/database.js";
import { ActionRowBase, ButtonStyles, ComponentTypes, SelectMenuComponent, SelectOption, StringSelectMenuOptions, TextButton, File } from "oceanic.js";
import { IFaction } from "../../../Models/Faction.js";
import { ICharacter } from "../../../Models/Character.js";
import { emojis, find, getHighestTime, getUserLevelByExp, map } from "../../../util/Misc.js";
import { lbTypes, sortFn } from "../../leaderboard/fetch.js";
import ImageManager from "../../../manager/image.js";
import ClassBox from "../../../game/box/ClassBox.js";

export default new Command(CommandType.Component, { custom_id: "refresh_lb_<type>_<userId>_<time>", waitFor: ["EPICDUEL", "LOBBY"], gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { type: strType, userId, time: strTime }}) => {
        const time = process.hrtime.bigint();
        const cooldown = Math.round(Date.now());

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;
        //if (!bypass && interaction.user.permissions.has("manageGuild")) bypass = true;

        if (!bypass) return interaction.reply(DiscordError.noBypass());
        if (parseInt(strType) + 10000 > Date.now()) return interaction.reply({content: "Woah woah calm down, the buttons are on cooldown for 10 seconds, refresh after that time period.", flags: 64});

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return interaction.reply(SwarmError.noClient(true));

        if (client.processing[interaction.user.id]) {
            if (client.processing[interaction.user.id].refreshLb) return interaction.reply({content: "Cool down, a leaderboard is being refreshed by you.", flags: 64});
            // else client.processing[interaction.user.id].refreshLb = true;
        } else client.processing[interaction.user.id] = { refreshLb: false }//client.blankProcess();

        client.processing[interaction.user.id].refreshLb = true;
        
        if (!interaction.acknowledged) await interaction.deferUpdate();

        const type = parseInt(strType) as LeaderType;//= focused.options.find(v => v.name === "type") ? focused.options.find(v => v.name === "type").value : 3;

        const result = await ed.modules.Leader.fetch(type);//.catch((err) => {return {error: err}});

        if (!result.success) return interaction.reply({ embeds: [{ description: "The bot was unable to grab the leaderboard data, it may be that the server have timed out.", footer: { text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`} }] }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);

        const table = new AsciiTable3(lbTypes[type]).setAlignLeft(1).setStyle("unicode-double").setHeading("No.", "Name", ...headings(type));//const table = new ascii().setAlign(LEFT).setBorder("║", "═", "╦", "╩").setHeading("No.", "Name", ...(spitOutStats(type, null, null, true)));//.setHeading("No.", "Name", "Wins", "Total", "Level");

        let userSetting = await DatabaseManager.helper.getUserSettings(interaction.user.id);

        if (userSetting === null) {
            userSetting = {
                id: interaction.user.id, flags: 0, lb_view: 0, lb_default: 0
            }

            await DatabaseManager.helper.createUserSettings(userSetting);
        }

        const leaders = result.value;

        // tis only a few kb's prob anyways
        for (let i = 0; i < leaders.length; i++) {
            table.addRow(i + 1, leaders[i].name, ...(transform(type, leaders[i])));
        }

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

        const volues = await DatabaseManager.cli.query<IFaction | ICharacter>(`SELECT * FROM ${isFaction ? "faction" : "character"} WHERE name IN (${quickDollars(leaders.length)})`, map(leaders, v => v.name))
            .then(v => v.rows);

        volues.sort(sortFn.bind(leaders));

        const mergedArr = [] as Array<((IFaction | ICharacter) & { available: true }) | ( ExtractValueType<typeof leaders> & { available: false})>;

        for (let i = 0, len = leaders.length; i < len; i++) {
            const diffObj = find(volues, v => v.name === leaders[i].name);

            if (diffObj) mergedArr.push({ ...diffObj, available: true });
            else mergedArr.push({ ...leaders[i], available: false });
        }

        let indexice = table.getHeading().findIndex(v => v === "Lvl" || v === "Level");

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

            if (indexice && !table.rows[i][indexice] && expL) table.rows[i][indexice] = expL !== 40 ? expL + "?" : expL;

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
        }

        let files:File[] = [];
        let content = "```xl\n" + table.toString() + "```";//"\n**__" + lbnames[type] + "__**" + "\n```xl\n" + table.toString() + "```";//((type === 666) ? "The bot tracks any fame requests or phrases at vendbot, when it's there." : "")+ "\n**__" + lbnames[type] + "__**" + "\n```xl\n" + table.toString() + "```";

        // if (type !== 666) {// && /*[1, 2, 16, 3, 4, 17,  8, 9, 19, 5, 6, 18].includes(type) && */client.isMaintainer(interaction.member.id)) {
            components[1].components.push({
            // components[components.findIndex(v => v.components[0].customID.startsWith("refresh"))].components.push({
                type: ComponentTypes.BUTTON, style: 1, customID: `switch_view_lb_${interaction.user.id}_${type}_${userSetting.lb_view === 0 ? 1 : 0}_${cooldown}`, label: "Switch View",
                emoji: { name: userSetting.lb_view === 1 ? "📰" : "📷" }
            });

        if (userSetting.lb_view === 1 || userSetting.lb_view > 1 && isFaction) {
            files[0] = {
                contents: await ImageManager.SVG.generator.lb(type, leaders).catch(() => client.processing[interaction.user.id].refreshLb = false) as Buffer,
                name: "img.png"
            }; content = "";
        }

        if (userSetting.lb_view > 1 && !isFaction) {
            files = [{
                contents: await ImageManager.SVG.generator.lb20(type as unknown as CharacterLeaderType, leaders as CacheTypings.AnyPlayerLeaders[], (userSetting.lb_view - 2) as 0 | 1).catch(() => client.processing[interaction.user.id].refreshLb = false) as Buffer,
                name: "img.png"
            }]; content = "";
        }

        //@ts-expect-error
        if (files.length && files[0].contents === false) return interaction.reply({
            content: "error, unable to generate lb image", flags: 64
        })
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

        // if (leaderboard.length === 0) {
        //     content = `THERE'S NO ENTITY ON THE LEADERBOARD!`;
        // }

        return interaction.editOriginal({
            content, files,
            components,
            attachments: []
        }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);
    })