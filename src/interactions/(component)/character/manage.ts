import { ButtonStyles, ComponentTypes, InteractionContent } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import DatabaseManager from "../../../manager/database.js";
import { find, findIndex } from "../../../util/Misc.js";
import Character from "../../../Models/Character.js";

export default new Command(CommandType.Component, { custom_id: 'manage_<type>_<charId>' })
    .attach('run', async ({ client, interaction, variables }) => {
        // variables.type; 0 for new page (from character list etc), 1 for continuing/browsing chars

        let bypass:boolean|2 = false;

        (variables.type === "1") ? await interaction.deferUpdate(64) : await interaction.defer(64);

        let charId = parseInt(variables.charId);

        if (variables.type === "1" && interaction.data.componentType === ComponentTypes.STRING_SELECT) charId = parseInt(interaction.data.values.raw[0]);

        let linkedins = await DatabaseManager.helper.getCharacterLinks(charId);

        // if (linkedins.error) return interaction.createFollowup({content: "There's been a problem trying to fetch the character from the database.", flags: 64});
        // linkedins = linkedins.result;

        if (!linkedins.length || (linkedins.length && !linkedins.some(v => v.id === charId))) return interaction.createFollowup({content: "This character does not have a linked discord user.", flags: 64});

        // for the person who've linked it.
        if (linkedins.length && linkedins.some(v => v.discord_id === interaction.user.id && v.id == charId)) bypass = true;

        // for maintainers
        if (client.isMaintainer(interaction.user.id)) bypass = 2;
        if (bypass === false) return interaction.createFollowup({ content: "You don't have the authorisation to manage this character.", flags: 64 });

        let charin:InteractionContent;// = Character.manageify(findIndex(linkedins, v => v.id === charId), linkedins);

        if (bypass === 2 && !linkedins.some(v => v.discord_id === interaction.user.id && v.id == charId)) {
            charin = Character.manageify(0, linkedins);

            charin.components?.splice(0, 1);
        } else {
            linkedins = await DatabaseManager.helper.getCharacterLinks(interaction.user.id);

            charin = Character.manageify(findIndex(linkedins, v => v.discord_id === interaction.user.id && v.id == charId), linkedins);
        }

        switch (variables.type) {
            case "0":
                if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

                // let charin = Character.manageify(findIndex(linkedins, v => v.id === charId), linkedins);//EDCharacter.manageify(linkedins.findIndex(a => a.char.id == charId), linkedins, client);// (dom.char, dom.faction, dom, false);//char.t === 1 ? char.c : char.link.char, faction, char.t === 2 ? char.link : null, false);

                // if (charin.success === false) {
                //     return interaction.createFollowup({ content: "For some reason, the bot can't fetch your linked characters? Please try again later.", flags: 64});
                // }

                return interaction.createFollowup(charin);
            case "1":
                // can be from button (denying unlink), or string select now. if (interaction.data.componentType !== Constants.ComponentTypes.STRING_SELECT) return;

                // let charming = EDCharacter.manageify(linkedins.findIndex(a => a.char.id == charId), linkedins, client);// (dom.char, dom.faction, dom, false);//char.t === 1 ? char.c : char.link.char, faction, char.t === 2 ? char.link : null, false);

                // if (charming.success === false) {
                //     return interaction.createFollowup({ content: "For some reason, the bot can't fetch your linked characters? Please try again later.", flags: 64});
                // }

                return interaction.editOriginal(charin);
                //return interaction.createFollowup({ content: "component was being implemented yet, but owner decided to take a break for now."});
        }
    });