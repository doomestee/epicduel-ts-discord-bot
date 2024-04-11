import { ComponentTypes, TextInputStyles } from "oceanic.js";
import Command, { CommandType } from "../../../../util/Command.js";

// feedback_0_0_000
// respType: 1 for creating a new modal, 2 for receiving a modal submit.
// type: 0 for "help", 1 for leaderboard image

export default new Command(CommandType.Modal, { custom_id: "feedback_sent_<type>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        // const respType = parseInt(variables.respType) as 1 | 2;
        // if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const type = parseInt(variables.type) as 0 | 1;
        const userId = (variables.userId);

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && userId === "000") bypass = true;

        if (!bypass) return interaction.createMessage({
            content: "This command isn't for you!", flags: 64
        });

        await interaction.defer(64);

        const data = interaction.data.components.raw[0].components[0].value;

        const title = ["General Feedback (T0)", "Leaderboard Feedback (T1)"];
        const colour = [0xFF00FF, 0xFFFF00]

        client.rest.channels.createMessage("1104125101026316362", {
            embeds: [{
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL(),
                }, description: "```\n" + data + "```",
                color: colour[type], timestamp: interaction.createdAt.toISOString(),
                title: title[type]
            }]
        }).then(() => {
            return interaction.createFollowup({
                content: "Your feedback has been recorded, thank you!"
            });
        }).catch(() => {
            return interaction.createFollowup({
                content: "Error; An error occurred trying to relay the modal to the log channel." // Can't say what happened to them ;-;
            });
        })

        // switch (type) {

        // }
    })