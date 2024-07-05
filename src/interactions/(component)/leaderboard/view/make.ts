import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../../util/Command.js";
import DatabaseManager from "../../../../manager/database.js";

export default new Command(CommandType.Component, { custom_id: "switch_view_lb_menu_<userId>_<lastUsed>", gateVerifiedChar: 69 })
    .attach('run', async ({ client, interaction, variables: { userId, lastUsed } }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        let userSetting = await DatabaseManager.helper.getUserSettings(interaction.user.id);//.catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });

        if (userSetting === null) {
            userSetting = {
                id: interaction.user.id, flags: 0, lb_view: 0, lb_default: 0
            }

            await DatabaseManager.helper.createUserSettings(userSetting);//.catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
        // } else {
        //     if (userSetting.lb_view !== 1) {
        //         userSetting.lb_view = viewType;
        //         await DatabaseManager.helper.updateUserSettings(interaction.user.id, { lb_view: viewType }).catch(err => { client.processing[interaction.user.id].refreshLb = false; throw err; });
        //     } else return interaction.createFollowup({ content: "You've already switched the view, please use the refresh button!", flags: 64 }).then(() => client.processing[interaction.user.id].refreshLb = false, () => client.processing[interaction.user.id].refreshLb = false);
        }

        return interaction.reply({
            content: "Click on one of the option to change your view type!\nNote: if you have vertical or horizontal on, they only work for characters and not factions (in which case the game style will be used)",
            flags: 64,
            components: [{
                type: ComponentTypes.ACTION_ROW,
                components: [{
                    type: ComponentTypes.STRING_SELECT, customID: "switch_view_lb_select_" + userId,
                    options: [{
                        label: "Classic", value: "classic", default: userSetting.lb_view === 0,
                        description: "Ascii table (works best on PC), this is the fastest.",
                    }, {
                        label: "Image (Game Style)", value: "img_game", default: userSetting.lb_view === 1,
                        description: "Image layout is the same as in game, this is the fastest image view.",
                    }, {
                        label: "Image (Vertical)", value: "img_vert", default: userSetting.lb_view === 2,
                        description: "All 20 characters displayed vertically, slowest initially. Game style is used if lb is faction.",
                    }, {
                        label: "Image (Horizontal)", value: "img_hori", default: userSetting.lb_view === 3,
                        description: "All 20 characters displayed horizontally, slowest initially. Game style is used if lb is faction.",
                    }]
                }]
            }]
        });
    })