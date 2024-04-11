import { ButtonStyles, ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import DatabaseManager from "../../../manager/database.js";
import { find } from "../../../util/Misc.js";

export default new Command(CommandType.Component, { custom_id: ['unlink_<type>_<charId>_<expByTime>', 'character_unlink_<type>_<charId>'] })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        let bypass = false;

        /**
         * 0 from char manage browsing (prompt), 1 from char unlink prompt (negative), 2 from char unlink prompt (positive), 3 from admin button (silent), 4 from admin button (notify)
         */
        const type = parseInt(variables.type);
        const charId = parseInt(variables.charId);

        ([0, 1, 2].some(v => v === type)) ? await interaction.deferUpdate(64) : await interaction.defer(64);

        if (variables.expTime !== undefined && Number(variables.expTime) < Date.now()) {
            return interaction.editOriginal({
                embeds: [{
                    description: "The button has expired, you can't unlink, please use manage command again from there.\nNote that you have 30 seconds to unlink from each invocation of the button."
                }], components: []
            });
        }

        const charLinks = await DatabaseManager.helper.getCharacterLinks(charId);

        const char = find(charLinks, v => v.id === charId);

        if (!char) return interaction.reply({ content: "This character does not have a linked discord user.", flags: 64 });

        if (char.discord_id === interaction.user.id) bypass = true;

        // for maintainers
        if (client.isMaintainer(interaction.user.id)) bypass = true;
        if (bypass === false) return interaction.createFollowup({ content: "You do not have the authorisation to manage this character.", flags: 64 });

        switch (type) {
            case 0:
                if (char.flags & 1 << 3) {// && !(client.temporary.sussy !== true && client.isMaintainer(interaction.member.id))) {
                    await interaction.createFollowup({
                        embeds: [{
                            title: "Unable to Unlink",
                            description: "Your linked character has been designated as forcibly linked, so cannot be unlinked. Please contact the developer(s) if you wish to do so."
                        }], flags: 64
                    });
                    
                    let computations = interaction.message.components;

                    for (let i = 0, len = computations.length; i < len; i++) {
                        for (let c = 0, cen = computations[i].components.length; c < cen; c++) {
                            const comp = computations[i].components[c];

                            if (comp.type === ComponentTypes.BUTTON && comp.label === "Unlink") {
                                i = len; c = cen;

                                // I hope the mutability works this way, otherwise yikes.
                                comp.disabled = true;
                            }
                        }
                    }

                    return interaction.editOriginal({ components: computations });
                }

                return interaction.editOriginal({
                    embeds: [{
                        title: "Character Management",
                        description: "You're about to unlink a character, are you sure to proceed?\nYou can re-link anytime you want after this.\n\nCharacter you're unlinking:\nName: " + char.name + " (ID: " + char.id + ")"
                    }], components: [{
                        type: ComponentTypes.ACTION_ROW, components: [{
                            type: ComponentTypes.BUTTON, customID: "manage_1_" + charId, style: ButtonStyles.SECONDARY,
                            label: "No"
                        }, {
                            type: ComponentTypes.BUTTON, customID: "unlink_2_" + charId + "_" + Math.round(Date.now() + 30000), style: ButtonStyles.DANGER,
                            label: "Yes"
                        }]
                    }]
                });
            case 2:
                let deletion = await DatabaseManager.cli.query(`DELETE FROM characterlink WHERE id = $1 AND discord_id = $2`, [char.id as unknown as string, char.discord_id]);

                return interaction.editOriginal({
                    embeds: [{
                        description: ((deletion.rowCount ?? 0) > 0)
                           ? "You've successfully unlinked the character, you can link it again anytime if you want to."
                           : "The character couldn't be deleted, it appears to have not existed in the database, or maybe there's an underlying problem?",
                    }], components: []
                });
        }
    });