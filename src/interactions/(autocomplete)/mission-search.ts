import { AutocompleteChoice } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import FuzzySearch from "fuzzy-search"
import MissionSBox from "../../game/box/MissionBox.js";

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

// Long live ChatGPT
function actualNeedle(str: string) : string {
    const regex = /\(\d+$/; // regular expression to match "(123" at the end of the string
    let match = str.match(regex);

    if (match) {
        // if the string ends with "(123" (no closing bracket), remove the digits and the bracket
        str = str.replace(/\(\d+$/, '');
    } else if (match = str.match(/\(\d+\)$/)) {
        // if the string ends with "(123)", remove it
        str = str.substring(0, str.length - match[0].length);
    }

    return str.trim(); // trim any whitespace from the beginning and end of the string
}

export default new Command(CommandType.Autocomplete, { cmd: ["mission", "search"], value: "id" })
    .attach('run', ({ client, interaction }) => {
        const value = interaction.data.options.getFocused()?.value as string | undefined;

        let isNonce = value ? isNaN(parseInt(value)) : false;

        if (MissionSBox.objMap.group.size === 0) return interaction.result([{ name: "The bot hasn't connected in game yet.", value: "1" }]);

        let looky:AutocompleteChoice[] = [{name: `0 Result`, value: "102030405"}];

        const items = MissionSBox.objMap.group.toArray();
        let list = [];

        // for (let i = prelist.length - 1, x = 0; i >= 0; i--, x++) {
        //     const item = prelist[i];

        //     let upd = {};
        //     if (epicduel.languages[item.itemName]) upd.itemName = epicduel.languages[item.itemName];
        //     if (epicduel.languages[item.itemDesc]) upd.itemDesc = epicduel.languages[item.itemDesc];

        //     list[x] = {...item, ...upd};
        // }

        const fuzzy = new FuzzySearch(items, ['groupName'], { caseSensitive: false });

        if (value) list = fuzzy.search(actualNeedle(value));
        else list = items;

        for (let i = list.length, y = 0; i > 0; i--, y++) {//let i = 0, len = list.length; i < len; i++) {
            looky[y] = {
                name: list[i - 1]["groupName"] + " (" + list[i - 1]["groupId"] + ")",
                value: String(list[i - 1]["groupId"])
            }
        }

        const result = truncateResults(looky);

        if (value && !isNonce && value.length < 10) {
            if (result.length === 25) {
                result.splice(24, 1);
            }

            result.push({ name: "ID: " + value, value });
        }

        return interaction.result(result);
    });