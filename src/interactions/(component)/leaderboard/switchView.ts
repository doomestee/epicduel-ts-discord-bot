import { ActionRowBase, ButtonStyles, ComponentTypes, SelectMenuComponent, SelectOption, StringSelectMenuOptions, TextButton, File } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import Leader, { CharacterLeaderType, LeaderType } from "../../../game/module/Leader.js";
import Swarm from "../../../manager/epicduel.js";
import DatabaseManager, { quickDollars } from "../../../manager/database.js";
import { AsciiTable3 } from "ascii-table3";
import { headings, transform } from "../../../util/Leaderboard.js";
import { IFaction } from "../../../Models/Faction.js";
import { ICharacter } from "../../../Models/Character.js";
import { emojis, find, getUserLevelByExp, map } from "../../../util/Misc.js";
import { lbTypes, sortFn } from "../../leaderboard/fetch.js";
import ImageManager from "../../../manager/image.js";
import ClassBox from "../../../game/box/ClassBox.js";

export default new Command(CommandType.Component, { custom_id: "switch_view_lb_<userId>_<lbType>_<viewType>_<lastUsed>", gateVerifiedChar: 69})
    .attach('run', async ({client, interaction, variables: { userId, lbType: strLbType, viewType: strViewType, lastUsed: strLastUsed }}) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;
        const cooldown = Math.round(Date.now());

        if (interaction.user.id !== userId) return interaction.createMessage(DiscordError.noBypass());
        if (parseInt(strLastUsed) + 10000 > Date.now()) return interaction.createMessage({content: "Calm down, the buttons are on cooldown for 10 seconds, refresh after that time period.", flags: 64});

        const ed = Swarm.getClient(v => v.connected && v.lobbyInit && v.receiving);

        if (!ed) return interaction.reply(SwarmError.noClient(true));

        if (client.processing[interaction.user.id]) {
            if (client.processing[interaction.user.id].refreshLb) return interaction.reply({content: "Cool down, a leaderboard is being refreshed by you.", flags: 64});
            // else client.processing[interaction.user.id].refreshLb = true;
        } else client.processing[interaction.user.id] = { refreshLb: false }//client.blankProcess();

        client.processing[interaction.user.id].refreshLb = true;
        
        if (!interaction.acknowledged) await interaction.deferUpdate();

        const lbType = parseInt(strLbType) as LeaderType;//= focused.options.find(v => v.name === "type") ? focused.options.find(v => v.name === "type").value : 3;
        const viewType = parseInt(strViewType);

        let userSetting = await DatabaseManager.helper.getUserSettings(interaction.user.id).catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });

        if (userSetting === null) {
            userSetting = {
                id: interaction.user.id, flags: 0, lb_view: viewType, lb_default: 0
            }

            await DatabaseManager.helper.createUserSettings(userSetting).catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
        } else {
            if (userSetting.lb_view !== viewType) {
                userSetting.lb_view = viewType;
                await DatabaseManager.helper.updateUserSettings(interaction.user.id, { lb_view: viewType }).catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
            } else return interaction.createFollowup({ content: "You've already switched the view, please use the refresh button!", flags: 64 }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);
        }

        const result = await ed.modules.Leader.fetch(lbType);//.catch((err) => {return {error: err}});

        if (!result.success) return interaction.reply({ embeds: [{ description: "The bot was unable to grab the leaderboard data, it may be that the server have timed out." }] }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);

        const table = new AsciiTable3(lbTypes[lbType]).setAlignLeft(1).setStyle("unicode-double").setHeading("No.", "Name", ...headings(lbType));//const table = new ascii().setAlign(LEFT).setBorder("║", "═", "╦", "╩").setHeading("No.", "Name", ...(spitOutStats(type, null, null, true)));//.setHeading("No.", "Name", "Wins", "Total", "Level");

        const leaders = result.value;

        // tis only a few kb's prob anyways
        for (let i = 0; i < leaders.length; i++) {
            table.addRow(i + 1, leaders[i].name, ...(transform(lbType, leaders[i])));
        }

        const isFaction = Leader.Indexes.Faction.includes(lbType);

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
                customID: "refresh_lb_" + lbType + "_" + interaction.user.id + "_" + cooldown, label: "Refresh"
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
                type: ComponentTypes.BUTTON, style: 1, customID: `switch_view_lb_${interaction.user.id}_${strLbType}_${viewType === 1 ? 0 : 1}_${cooldown}`, label: "Switch View",
                emoji: { name: userSetting.lb_view === 1 ? "📰" : "📷" }
            });

        if (viewType === 1 || viewType > 1 && isFaction) {
            files[0] = {
                contents: await ImageManager.SVG.generator.lb(lbType, leaders).catch(() => client.processing[interaction.user.id].refreshLb = false) as Buffer,
                name: "img.png"
            }; content = "";
        }

        if (viewType > 1 && !isFaction) {
            files = [{
                contents: await ImageManager.SVG.generator.lb20(lbType as unknown as CharacterLeaderType, leaders as CacheTypings.AnyPlayerLeaders[], (viewType - 2) as 0 | 1).catch(() => client.processing[interaction.user.id].refreshLb = false) as Buffer,
                name: "img.png"
            }]; content = "";
        }

        //@ts-expect-error
        if (files.length && files[0].contents === false) return interaction.reply({
            content: "error, unable to generate lb image", flags: 64
        });

        if (components[0].components[0].type === 3 && components[0].components[0].options.length === 0) {
            components[0].components[0].options.push({
                label: "Placeholder",
                description: `Placeholder`,
                value: "a" + 1234
            });
            components[0].components[0].disabled = true;
        }

        // ABCIAOHEFIWFAHWIOA

        return interaction.editOriginal({
            content, files, attachments: [],
            components/*: [{
                type: 1, components: [{
                    type: 2, style: 1, disabled: false, customID: "refresh_lb_" + lbType + "_" + userId + "_" + cooldown, label: "Refresh"
                }, {
                    type: 2, style: 1, customID: `switch_view_lb_${interaction.user.id}_${lbType}_${viewType === 1 ? 0 : 1}_${cooldown}`, label: "Switch View", emoji: { name: userSetting.lb_view === 1 ? "📰" : "📷" }
                }, {
                    type: 2, style: ButtonStyles.SECONDARY, customID: "feedback_1_1_" + interaction.user.id,
                    label: "Send Feedback",
                }]
            }]*/
        }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);
    })