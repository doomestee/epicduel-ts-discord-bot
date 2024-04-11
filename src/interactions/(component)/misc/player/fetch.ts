import Command, { CommandType } from "../../../../util/Command.js";

export default new Command(CommandType.Component, { custom_id: "fetch_players_<userId>" })
    .attach('run', ({ client, interaction, variables }) => {
        let bypass = false;

        if (interaction.user.id === variables.userId) bypass = true;
        if (!bypass && client.isMaintainer(interaction.user.id)) bypass = true;

        if (!bypass) return interaction.reply({content: "You are not the original person who used the command for the message.", flags: 64});

        // if (!epicduel.client.lobbyInit) return client.safeSend(interaction, 1)({content: "Woops, the bot is still in the lobby, this means it hasn't joined a room yet... for some reason.", flags: 64});

        // /**
        //  * @type {import("../../server/structures/data/User")[]}
        //  */
        // let players = epicduel.client.smartFox.getActiveRoom();

        // if (!players) {
        //     return client.safeSend(interaction, 1)({content: "Damn, there's no active room..? Another case of bot smoking pot.", flags: 64});
        // };

        // let myPlayerIndex = players.myPlayerIndex;

        // players = players.userList.filter(a => a.pId !== myPlayerIndex);

        // let parsed = JSON.stringify(players.map(v => v.charId + '-' + v.charName + '-' + v.id), undefined, 2);

        // let file = (parsed.length > 1987) ? [{name: "output.json", file: parsed}] : [];
        // //parsed.length > 1987;

        // //if (parsed.length > 1987) obj = {name: "output.json", file: parsed};
        // //else obj = {content: "```json\n" + parsed + "```"};

        // return client.safeSend(interaction, 1)({content: (file.length) ? '' : "```json\n" + parsed + "```", components: [{
        //     type: 1, components: [{
        //         type: 2, style: Constants.ButtonStyles.DANGER, customID: "remove_message_" + variables.memberid, label: "Remove Message"
        //     }],
        // }]}, file).catch((err) => {});
    });