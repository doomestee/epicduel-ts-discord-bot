import { ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js";
import { find, map } from "../../../util/Misc.js";

export default new Command(CommandType.Component, { custom_id: "edserver_select_rally_<userId>" })
    .attach('run', async ({ client, interaction, variables: { userId } }) => {
        if (interaction.data.componentType !== ComponentTypes.STRING_SELECT) return;
        if (interaction.guildID !== "565155762335383581") return interaction.reply({ flags: 64, content: "This feature is only available for the vendbot support server."});

        let rallyRoles = [["1040690991323164712", "legion", "Receive pings for legion rallies."], ["1040690933978648716", "exile", "Receive pings for legion rallies."]].map(v => {return { id: v[0], name: v[1], desc: v[2]}});

        await interaction.defer(64);

        let roles = interaction.member.roles;
        let changed = [[], [], false] as [string[], string[], boolean];

        for (let i = 0; i < rallyRoles.length; i++) {
            if (interaction.data.values.raw.includes(rallyRoles[i].id) && !roles.includes(rallyRoles[i].id)) {
                changed[0].push(rallyRoles[i].id);
                roles.push(rallyRoles[i].id);
            } else if (!interaction.data.values.raw.includes(rallyRoles[i].id) && roles.includes(rallyRoles[i].id)) {
                changed[1].push(rallyRoles[i].id);
                roles = roles.filter(v => v !== rallyRoles[i].id);
            }
        }

        // if (client.debug) {
        //     if (!client.oknicedebugmoyai) client.oknicedebugmoyai = [];
        //     client.oknicedebugmoyai.push({
        //         roles, changed, rallyRoles, val: interaction.data.values.raw
        //     })
        // }

        //if (rallyRoles.some(v => roles.includes(v.id))) {}
        //else { changed[2] = roles.length; roles = roles.filter(v => v !== "1040691059635781702"); if (changed[2] !== roles.length) changed[2] = true; else changed[2] = false; }

        if (changed[0].length || changed[1].length || changed[2] === true) {//roles.length !== interaction.member.roles.length) {
            let sus = await client.rest.guilds.editMember(interaction.guildID, interaction.member.id, {
                roles, reason: "User has requested to add or remove those roles."
            }).catch((v) => { console.log(v); interaction.createFollowup({content: "Unable to assign roles, the bot faced error doing so. Might be that it lacks permissions to do so."}); return -2341;});

            if (sus === -2341) return;
        }

        return interaction.createFollowup({
            content: "Changed role(s)\n\nAdded: " + (changed[0].length === 0 ? "N/A" : map(changed[0], v => find(rallyRoles, i => i.id === v)?.name).join(", ")) + "\nRemoved: " + (changed[1].length === 0 ? "N/A" : map(changed[1], v => find(rallyRoles, i => i.id === v)?.name).join(", "))
        });
    })