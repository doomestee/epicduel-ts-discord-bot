import DesignNoteManager from "../../../manager/designnote.js";
import Command, { CommandType } from "../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "fetch_recent_note_<channelId>" })
    .attach('run', async ({ client, interaction, variables: { channelId } }) => {
        DesignNoteManager.addQueue(channelId, interaction.user.id);//.catch(error => logger.error(error));

        return interaction.editParent({content: "The design note is being dispatched!\nNote that the bot won't send if it can't send messages there without Embed Links.", components: [{
            type: 1, components: [{
                type: 2, customID: 'fetch_recent_note', style: 2, label: "Fetch Recent Note", disabled: true
            }]
        }]});
    })