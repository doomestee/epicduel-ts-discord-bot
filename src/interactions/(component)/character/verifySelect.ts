import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "select_chars_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (!interaction.inCachedGuildChannel()) return interaction.reply({ content: "This command can only be used in guilds." });
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;

        let phaseRoles = [["1081679325121744946", "Beta", "Awarded to players that participated in EpicDuel's Beta testing phases."], ["1081679368293724271", "Gamma", "Awarded to players that participated in EpicDuel's Gamma phase."], ["1081679415882297524", "Delta", "Awarded to those brave individuals who participated in EpicDuel Delta!"], ["1081679443162050560", "Omega", "Available during EpicDuel's Omega phase."]].map(v => {return { id: v[0], name: v[1], desc: v[2]}});

        await interaction.defer(64);

        let roles = interaction.member.roles;
        let changed = [[], []] as [string[], string[]];

        for (let i = 0; i < phaseRoles.length; i++) {
            if (interaction.data.values.raw.includes(phaseRoles[i].id) && !roles.includes(phaseRoles[i].id)) {
                changed[0].push(phaseRoles[i].id);
                roles.push(phaseRoles[i].id);
            } else if (!interaction.data.values.raw.includes(phaseRoles[i].id) && roles.includes(phaseRoles[i].id)) {
                changed[1].push(phaseRoles[i].id);
                roles = roles.filter(v => v !== phaseRoles[i].id);
            }
        }

        if (changed[0].length || changed[1].length) {//roles.length !== interaction.member.roles.length) {
            let sus = await client.rest.guilds.editMember(interaction.guildID, interaction.member.id, {
                roles, reason: "User has been verified and requested to pick said roles."
            }).catch((v) => { console.log(v); interaction.createFollowup({content: "Unable to assign roles, the bot faced error doing so. Might be that it lacks permissions to do so."}); return -2341;});

            if (sus === -2341) return;
        }

        return interaction.createFollowup({
            content: "Changed role(s)\n\nAdded: " + (changed[0].length === 0 ? "N/A" : changed[0].map(v => phaseRoles.find(i => i.id === v)?.name).join(", ")) + "\nRemoved: " + (changed[1].length === 0 ? "N/A" : changed[1].map(v => phaseRoles.find(i => i.id === v)?.name).join(", "))
        });
    });