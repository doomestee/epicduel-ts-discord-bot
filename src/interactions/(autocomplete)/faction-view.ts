import { AutocompleteChoice } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import FuzzySearch from "fuzzy-search"
import DatabaseManager from "../../manager/database.js";
import { IFaction } from "../../Models/Faction.js";

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

function actualNeedle(str: string | undefined) : string | undefined {
    if (!str) return undefined;

    const regex = /\(ID:\s*\d+\s*(.*?)(?:\))?$/; // regular expression to match "(123" at the end of the string
    let match = str.match(regex);

    if (match) {
        // if the string ends with "(123" (no closing bracket), remove the digits and the bracket
        str = str.replace(/\(ID:\s*\d+\s*(.*?)(?:\))?$/, '');
    }

    return str.trim(); // trim any whitespace from the beginning and end of the string
}

export default new Command(CommandType.Autocomplete, { cmd: ["faction", "view"], value: "name" })
    .attach('run', async ({ client, interaction }) => {
        const value = actualNeedle(interaction.data.options.getFocused()?.value as string) as string | undefined;

        let isNonce = value ? isNaN(parseInt(value)) : false;

        // if (DatabaseManager.cli.) return interaction.result([{ name: "The bot hasn't connected in game yet.", value: "1" }]);

        let looky:AutocompleteChoice[] = [{name: `0 Result`, value: "102030405"}];

        // const items = await DatabaseManager.cli.query<IFaction>("SELECT * FROM faction").then(v => v.rows);//ItemSBox.objMap.toArray();
        // let list = [];

        // for (let i = prelist.length - 1, x = 0; i >= 0; i--, x++) {
        //     const item = prelist[i];

        //     let upd = {};
        //     if (epicduel.languages[item.itemName]) upd.itemName = epicduel.languages[item.itemName];
        //     if (epicduel.languages[item.itemDesc]) upd.itemDesc = epicduel.languages[item.itemDesc];

        //     list[x] = {...item, ...upd};
        // }

        // const fuzzy = new FuzzySearch(items, [''], { caseSensitive: false });

        // if (value) list = fuzzy.search(actualNeedle(value));
        // else list = items;

        let list = await DatabaseManager.cli.query<IFaction & { similarity: number }>(value ? "select *, similarity(faction.name, $1) from faction where faction.name ilike $2 order by similarity desc limit 25" : "select * from faction limit 25", value ? [value, "%" + value + "%"] : []).then(v => v.rows);

        for (let i = 0, len = list.length; i < len; i++) {
            looky[i] = {
                name: list[i]["name"] + " (" + list[i]["id"] + ")",
                value: String(list[i]["id"])
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