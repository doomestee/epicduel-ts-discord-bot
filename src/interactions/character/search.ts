import { ButtonStyles, ComponentTypes } from "oceanic.js";
import Command, { CommandType } from "../../util/Command.js";
import DatabaseManager from "../../manager/database.js";
import Character, { ICharacter } from "../../Models/Character.js";

export default new Command(CommandType.Application, { cmd: ["character", "search"], cooldown: 3000 })
    .attach("run", async ({ client, interaction }) => {
        if (interaction.type !== 2) return;

        if (!interaction.acknowledged) await interaction.defer();

        const charName = interaction.data.options.getString("name", false) ?? "";//focused.options.find(v => v.name === "name")?.value;

        if (!/^(\w| |.)+$/.test(charName)) {
            return interaction.createFollowup({
                content: "Username must consist of letters, numbers or underscores."
            });
        }

        const results = await DatabaseManager.cli.query<ICharacter & { similarity: number }>(`select character.*, similarity(character_name.name, $1) from character_name join character on character.id = character_name.id where character_name.name ilike $2 order by similarity desc limit 10`, [charName, "%" + charName + "%"]).then(v => v.rows);

        if (results.length === 1 && results[0].name.toLowerCase() === charName.toLowerCase()) {
            interaction.createFollowup(Character.respondify(results[0]));
        }
    });

module.exports = new Command({category: "Character", description: "Search for a character etc.", cooldown: 5000 })
    .attach('run', async ({interaction, database, focused, client}) => {

        /**
         * @type {{t: 1, c: import("../../structures/DBCharacter")}|{t: 2, link: import("../../structures/DBLinkedCharacter")}}
         */
        let char = {
            id: -1, exp: -1, fct: { id: -1, n: "" }, t: -1
        };

        let hmm = 0;

        if ((hmm = database.cache.char.findIndex(v => v[3].some(o => o.char.name === charName))) && hmm !== -1) { 
            let charino = database.cache.char[hmm];

            if (!((charino[0] + charino[1]) > Date.now())) {
                char = {
                    t: 2, link: charino[3].find(oh => oh.char.name === charName)//s: 1, exp: charinquestion.char.exp, fct: { id: charinquestion.char.faction_id }, id: charinquestion.char.
                }
            }
        }

        let cacheCheck = () => {
            let a = database.cache.pChar.findIndex(v => v[2] === charName.toLowerCase())//.findIndex(v => v[2] === discordID);

            if (a === -1) return false;

            let b = database.cache.pChar[a][0] + database.cache.pChar[a][1];

            return (b > Date.now())
        }

        let chars = [];
        
        if (!cacheCheck() && char.t === -1) {
            // TIL character name is sort of case insensitive when querying.

            chars = await database.helper.getLinkedCharacters({"character.name": charName}, true);

            //if (chars.error) return interaction.createFollowup({content: "There's been a problem trying to fetch the character from the database.", flags: 64});
            if (chars.type === 1 && chars.result.length) char = { t: 2, link: chars.result[0]}
            else {
                chars = await database.cli.query(`SELECT * FROM character WHERE lower(name) = $1`, [charName.toLowerCase()])
                    .then((v) => { return v.rows.map(cha => new Character(cha)) }).catch(err => { return { error: err }});

                if (chars.error) return interaction.createFollowup({content: "There's been a problem trying to fetch characters from the database.", flags: 64});
                if (!chars.length) return interaction.createFollowup({content: "The character is not in the bot's database, you can ask it to fetch from the website/char page if it exists.\n\nCharacter searched: `" + charName + "`", flags: 64, components: [{
                    type: 1, components: [{
                        type: 2, customID: "populate_1_" + interaction.member.id, style: 1, label: "Fetch"
                    }]
                }]}); //return interaction.createFollowup({content: "The character is not in the bot's database, the bot doesn't query from the website at the moment.", flags: 64});

                database.cache.pChar.push([Date.now(), 1000*60*60, charName.toLowerCase(), chars[0]]);
            }
        } else if (char.t === -1) chars = [database.cache.pChar.find(v => v[2] === charName.toLowerCase())[3]];

        if (chars.length && char?.t !== 2) {
            char = { t: 1, c: chars[0]}
        }

        /**
         * @type {Faction}
         */
        let faction = {};
        if ((char.t === 1 && char.c.faction_id) || (char.t === 2 && char.link.faction?.id)) faction = await database.cli.query(`SELECT * FROM faction WHERE id = $1`, [(char.t === 1) ? char.c.faction_id : char.link.faction.id]).then(v => { return v.rows.map(f => new Faction(f))}).catch(err => { return {error: err }; });

        if (faction.error) faction = {};
        else { faction = faction[0]; }

        let charin = new EDCharacter(char.t === 1 ? char.c : char.link.char, { faction, link: char.t === 2 ? char.link : null, names: await database.cli.query(`SELECT * FROM character_name WHERE id = $1`, [char.t === 2 ? char.link.char.id : char.c.id]).then(v => v.rows) }, false);

        let result = charin.resultify(client, interaction.member.id, false);

        if (result.success === false || (!client.isMaintainer(interaction.member.id) && char.t === 2 && char.link.flags & 1 << 4)) {
            return interaction.createFollowup({ content: "You've attempted to search for a character that's either forbidden, or hidden. Try a different one.", flags: 64});
        }

        if (char.t === 2) {
            let gUser = client.users.get(char.link.discord_id);
            
            if (!gUser) gUser = await client.rest.users.get(char.link.discord_id);

            /*result.result.embeds[0].thumbnail = { url: "attachment://image.png" };
            result.result.files = [{//((result) ? result.result : files).files = [{
                name: "image.png",
                contents: await avatar(gUser.avatarURL())
            }];*/

            result.result.embeds[0].thumbnail = { url: client.endpoints.avatar(gUser.avatarURL("png")) };
            result.result.embeds[0].footer = { text: "Char managed by " + gUser.username };
        }

        result.result.components.reverse();

        return interaction.createFollowup(result.result)
    });