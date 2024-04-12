import Command, { CommandType } from "../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "remove_message_<userId>" })
    .attach('run', async ({ client, interaction, variables: { userId } }) => {
        let bypass = false;

        if (interaction.user.id === userId) bypass = true;
        if (!bypass && interaction.inCachedGuildChannel() && interaction.member.permissions.has("MANAGE_GUILD")) bypass = true;

        // Only for admin-controlled remove buttons, like /admin eval.
        if (userId === "1234") bypass = client.isMaintainer(interaction.user.id);

        if (!bypass) return interaction.createMessage({ content: "Insufficient permission.", flags: 64 });

        if (!interaction.acknowledged) await interaction.deferUpdate();

        return interaction.deleteOriginal();//.catch(what => logger.error(what));
    })