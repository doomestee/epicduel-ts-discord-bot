import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../../util/Command.js";
import DatabaseManager from "../../../../manager/database.js";

type ViewType = "classic"|"img_game"|"img_vert"|"img_hori";

const viewTypes = {
    "classic":  0,
    "img_game": 1,
    "img_vert": 2,
    "img_hori": 3,
} as const;

export default new Command(CommandType.Component, { custom_id: "switch_view_lb_select_<userId>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        const rawType = interaction.data.values.raw[0] as ViewType;
        const viewType = viewTypes[rawType];

        let userSetting = await DatabaseManager.helper.getUserSettings(interaction.user.id);//.catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });

        if (userSetting === null) {
            userSetting = {
                id: interaction.user.id, flags: 0, lb_view: viewType, lb_default: 0
            }

            await DatabaseManager.helper.createUserSettings(userSetting);//.catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
        // } else {
        //     if (userSetting.lb_view !== 1) {
        //         userSetting.lb_view = viewType;
        //         await DatabaseManager.helper.updateUserSettings(interaction.user.id, { lb_view: viewType }).catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
        //     } else return interaction.createFollowup({ content: "You've already switched the view, please use the refresh button!", flags: 64 }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);
        } else {
            if (userSetting.lb_view === viewType) return interaction.reply({ flags: 64, content: "You are already on that option!\nNote: if you have vertical or horizontal on, they only work for characters and not factions (in which case the game style will be used)." });
            
            await DatabaseManager.helper.updateUserSettings(interaction.user.id, { lb_view: viewType });
        }

        return interaction.editParent({
            content: "Your view type has successfully changed, you may need to refresh the leaderboard (or use another leaderboard fetch command)",
            flags: 64,
            components: [{
                type: ComponentTypes.ACTION_ROW,
                components: [{
                    type: ComponentTypes.STRING_SELECT, customID: "switch_view_lb_select_" + userId,
                    options: [{
                        label: "Classic", value: "classic", default: viewType === 0,
                        description: "Ascii table (works best on PC), this is the fastest.",
                    }, {
                        label: "Image (Game Style)", value: "img_game", default: viewType === 1,
                        description: "Image layout is the same as in game, this is the fastest image view.",
                    }, {
                        label: "Image (Vertical)", value: "img_vert", default: viewType === 2,
                        description: "All 20 characters displayed vertically, slowest initially. Game style is used if lb is faction.",
                    }, {
                        label: "Image (Horizontal)", value: "img_hori", default: viewType === 3,
                        description: "All 20 characters displayed horizontally, slowest initially. Game style is used if lb is faction.",
                    }]
                }]
            }]
        });
    })