import { ComponentTypes, TextInputStyles } from "oceanic.js";
import Command, { CommandType } from "../../../../util/Command.js";

// feedback_0_0_000
// respType: 1 for creating a new modal, 2 for receiving a modal submit.
// type: 0 for "help", 1 for leaderboard image

export default new Command(CommandType.Component, { custom_id: "feedback_receiv_<type>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        // const respType = parseInt(variables.respType) as 1 | 2;
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        const type = parseInt(variables.type) as 0 | 1;
        const userId = (variables.userId);

        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && userId === "000") bypass = true;

        if (!bypass) return interaction.createMessage({
            content: "This command isn't for you!", flags: 64
        });

        const title = ["General Feedback", "Leaderboard Feedback"];


        return interaction.createModal({
            title: title[type],
            customID: `feedback_sent_${type}_${userId}`,
            components: [{
                type: ComponentTypes.ACTION_ROW,
                components: [{
                    type: ComponentTypes.TEXT_INPUT,
                    customID: "text", label: "Message", style: TextInputStyles.PARAGRAPH,
                    required: true, placeholder: "Write your feedback here.",
                    maxLength: 1000, minLength: 10
                }]
            }]
        })
    })