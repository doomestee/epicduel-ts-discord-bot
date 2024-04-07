import { AutocompleteChoice, GuildAutocompleteInteraction } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager from "../../manager/database.js";
import FuzzySearch from "fuzzy-search";
import { INotification } from "../../Models/Notification.js";

function truncateResults(values: AutocompleteChoice[], max=25) : AutocompleteChoice[] {
    if (values.length === 0) return [{name: `0 Result`, value: "102030405"}];
    if (values.length < max) return values;//(values.length === 1) ? values : [...values, {name: "Query for Random NPC in this list.", value: "more_count_" + appendToMoreCount}];
    else return [
        ...values.slice(0, max),
        /*{
            name: `(And ${values.length - (max - 1)} More) (Click here for a Random NPC)`,
			value: "more_count" + ((appendToMoreCount) ? '_' + appendToMoreCount : '')
        }*/
    ]
}

function nameId(int: GuildAutocompleteInteraction, id: string) {
    const c = int.guild.channels.get(id);

    if (c) return "#" + c.name
    else return "Channel ID: " + id;
}

function nameNotify(int: GuildAutocompleteInteraction, g: INotification) {
    return "ID: " + g.id + ", " + (((g.type === 1) ? "Exile, " : "Legion, ")) + nameId(int, g.channel_id);
};

export default new Command(CommandType.Autocomplete, { cmd: ["notification", "rally", "delete"], value: "id" })
    .attach('run', async ({ client, interaction }) => {
        if (!interaction.inCachedGuildChannel()) return;

        if (!(interaction.member.permissions.has("MANAGE_GUILD") || client.isMaintainer(interaction.member.id))) return interaction.result([{name: "Insufficient permission.", value: "102030405"}])

        const value = interaction.data.options.getFocused()?.value as string | undefined;

        let looky:AutocompleteChoice[] = [{name: `0 Result`, value: "102030405"}];
        const notifications = await DatabaseManager.helper.getNotification(interaction.guildID);

        if (!notifications.length) return interaction.result(looky);

        const fuzzy = new FuzzySearch(notifications, ["id"], { caseSensitive: true });
        let list = [];

        if (value) list = fuzzy.search(value);
        else list = notifications;

        // looky.splice(0); automatically gets cleared anyways
        for (let i = 0, len = list.length; i < len; i++) {
            looky[i] = {
                name: nameNotify(interaction, list[i]), value: String(list[i]["id"])
            }
        }

        return interaction.result(looky);
    });