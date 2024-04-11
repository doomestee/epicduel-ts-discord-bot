import DatabaseManager from "../../../manager/database.js";
import Command, { CommandType } from "../../../util/Command.js";
import { levels } from "../../../util/Misc.js";

export default new Command(CommandType.Component, { custom_id: "character_verify_<level>_<promptLink>_<roleids>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (!interaction.inCachedGuildChannel()) return interaction.reply({ content: "This command can only be used in guilds." });

        let roleIds:string[] = variables.roleids.split("-");
        let comps = 0;

        for (let i = 0, len = roleIds.length; i < len; i++) {
            if (interaction.member.roles.includes(roleIds[i])) comps++;
        }

        if (comps === roleIds.length) return interaction.reply({ flags: 64, content: "You already have all of the role(s) so no need to verify." });
        
        let successfullyVerified = () => {
            if (roleIds.length === 1) client.rest.guilds.addMemberRole(interaction.guildID, interaction.member.id, roleIds[0], "Member verified.");
            else if (roleIds.length > 1) client.rest.guilds.editMember(interaction.guildID, interaction.member.id, {roles: [...new Set([...interaction.member.roles, ...roleIds])], reason: "Member verified."});

            return interaction.reply({ content: "You're verified!", flags:64 }).catch(err => {});
        }

        await interaction.defer(64);

        let charLinks = await DatabaseManager.cli.query<{ id: number, user_id: number, flags: number, exp: number }>(`SELECT characterlink.id, characterlink.user_id, character.flags, character.exp FROM characterlink INNER JOIN character ON characterlink.id = character.id AND characterlink.user_id = character.user_id WHERE characterlink.discord_id = $1`, [interaction.user.id])
            .then(v => v.rows);

        // if (charLinks.error) {
        //     return client.safeSend(interaction, 1)({content: "There's been a problem accessing the database, this is an internal issue so please try again later.", flags: 64});
        // }

        let notes = `\n\n\nNote: if you have leveled up your character since the last time you linked, due to how the game works, I can't know your new levels/exp unless you re-visit the room I'm in every time.\nThis means you have to see the bot if you have levelled up and is well past the requirement. To see its location, use character link command. (Don't re-link, just simply enter)`;

        if (!charLinks.length) {
            return interaction.reply({content: "You need to link a character that fits the requirements to make it through!\n\nLevel requirement: " + ((variables.level && (variables.level == '0' || variables.level == '1')) ? 'NONE.' : variables.level) + notes, components: (variables.promptLink && variables.promptLink === '1') ? [{
                type: 1, components: [{
                    type: 2, style: 1, label: "Link a Character", customID: "character_link"
                }]
            }] : [], flags: 64});//.catch(err => {});
        }
        
        if (variables.level) {
            if (client.debug == true) {
                console.log(variables.level);
                // console.log(levels);
            }

            const expFromLevel = (variables.level != "0") ? levels[(Number(variables.level) - 1)] : 0;

            if (expFromLevel && expFromLevel != 0) {
                let passed = false;

                for (let i = 0; i < charLinks.length; i++) {
                    if (expFromLevel <= charLinks[i].exp) { passed = true; break; }
                }

                if (passed) return successfullyVerified();
                else return interaction.reply({content: "None of your character fits the requirements!\n\nLevel requirement: " + ((variables.level && (variables.level == '0' || variables.level == '1')) ? 'NONE.' : variables.level) + notes, components: (variables.promptLink && variables.promptLink === '1') ? [{
                    type: 1, components: [{
                        type: 2, style: 1, label: "Link a Character", customID: "character_link"
                    }]
                }] : [], flags: 64}).catch(err => {});

            } else {
                return successfullyVerified();
            }
        } else {
            return successfullyVerified();
        }
    });