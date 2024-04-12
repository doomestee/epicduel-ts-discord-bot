import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "edserver_rally_roles" })
    .attach('run', async ({ client, interaction }) => {
        if (interaction.guildID !== "565155762335383581") return interaction.reply({ flags: 64, content: "This feature is only available for the vendbot support server."});

        return interaction.createMessage({
            content: "You can pick any roles, or unselect none to remove any roles.",
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, minValues: 0, maxValues: 2, customID: "edserver_select_rally_" + interaction.member.id,
                    options: [{
                        label: "Legion",
                        emoji: {
                            name: "legion",
                            id: "1085244935042764881"
                        }, default: interaction.member.roles.includes("1040690991323164712"),
                        value: "1040690991323164712",
                        description: "Receive pings for legion rallies."
                    }, {
                        label: "Exile",
                        emoji: {
                            name: "exile",
                            id: "1085244911005208596"
                        }, default: interaction.member.roles.includes("1040690933978648716"),
                        value: "1040690933978648716",
                        description: "Receive pings for exile rallies."
                    }]
                }]
            }], flags: 64
        });
    });