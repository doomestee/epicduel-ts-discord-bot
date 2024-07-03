import { ICharacter } from "../../Models/Character.js";
import pg from "pg";
import DatabaseManager, { quickDollars } from "../../manager/database.js";
import { find, findIndex, map } from "../../util/Misc.js";
import EDEvent from "../../util/events/EDEvent.js";
import Logger from "../../manager/logger.js";

// Holy fuck I made this script at like 1am in the morning

function lazy<T>(arr: Array<T>) {
    return map(arr, v => [v]);
}

function quickValues(rows: number | Array<Array<string | number>>, columns: number, offset = 1) {
    let str = ""; let len = offset;

    if (Array.isArray(rows)) {
        for (let i = 0; i < rows.length; i++) {
            for (let y = 0; y < columns; y++) {
                if (y !== 0) {
                    str += ", "
                } else if (i !== 0) str += "), ("

                str += typeof rows[i][y] === "string" ? pg.escapeLiteral(rows[i][y] as string) : rows[i][y];//"$" + (len++)
            }
        }

        return "(" + str + ")";
    }

    for (let i = 0; i < rows; i++) {
        for (let y = 0; y < columns; y++) {
            if (y !== 0) {
                str += ", "
            } else if (i !== 0) str += "), ("

            str += "$" + (len++)
        }
    }

    return "(" + str + ")";
}

/**
 * This excludes encounters with faction members in the same room.
 * 
 * Includes: checking faction.
 */
export default new EDEvent("onFactionMemberEncounter", async function (hydra, { alignment, chars, faction_id }) {
    // if (!fact || fact.id === 0) return;    

    if (!Array.isArray(chars)) chars = [chars];

    if (chars.length === 0) return;

    const toPush:[number, string][] = [];
    const toRename:[number, string][] = []; const renameIds:number[] = [];

    const ogChars = await DatabaseManager.cli.query<ICharacter>(`SELECT * FROM character WHERE id IN (${quickDollars(chars)})`, map(chars, v => v.id))
        .then(v => v.rows);

    for (let i = 0, len = ogChars.length; i < len; i++) {
        const ogChar = ogChars[i];
        const char = find(chars, v => v.id === ogChar.id);

        if (char && char?.name !== ogChar.name) {
            toRename.push([ogChar.id, char.name]);
            renameIds[ogChar.id] = 1;
        }

        if (ogChar.faction_id === faction_id || !char) continue;

        toPush.push([ogChar.id, char.name]);
    }

    // TODO: TRACK NAME CHANGES AS WELL!
    // BY THIS I MEAN character_name !!

    // We are annulling these members so...
    if (faction_id === 0) {
        if (!toPush.length && !toRename.length) return;

        await DatabaseManager.cli.query(`UPDATE character as c1 SET faction_id = 0, name = c2.name FROM (VALUES ${quickValues(toPush.length + toRename.length, 2)} ) as c2(id, name) WHERE c2.id = c1.id`, toPush.concat(toRename).flat() as string[]);//`UPDATE character SET faction_id = 0 AND name = ${} WHERE id IN (${quickDollars(char_id)})`, char_id);

        // Character_name
        if (toRename.length) {
            // At this point I have given out to do a single query and will just instead loop
            for (let i = 0, len = toRename.length; i < len; i++) {
                const user = toRename[i];

                DatabaseManager.cli.query(`SELECT * FROM character_name WHERE id = $1 ORDER BY last_seen desc LIMIT 1`, [user[0]])
                    .then(v => {
                        if (v.rows.length && v.rows[0].name.toLowerCase() === user[1].toLowerCase()) {
                            return DatabaseManager.cli.query(`UPDATE character_name SET last_seen = $1 WHERE o_id = $2 `, [new Date(), v.rows[0]["o_id"]]);
                        } else return DatabaseManager.cli.query(`INSERT INTO character_name (id, name) VALUES ($1, $2)`, [user[0] as unknown as string, user[1]]);
                    }).catch(e => Logger.getLogger("CharTracker").error(e))
            }
        }

        return;
    }

    const members = await DatabaseManager.cli.query<ICharacter>(`SELECT * FROM character WHERE faction_id = $1`, [faction_id])
        .then(v => v.rows);

    const toKick:number[] = [];

    for (let i = 0, len = members.length; i < len; i++) {
        const m = members[i];
        const actualName = find(chars, v => v.id === m.id);

        if (actualName && actualName.name !== m.name && renameIds[m.id] !== 1) {
            toRename.push([m.id, actualName.name]);
            renameIds[m.id] = 1;
        }

        if (!actualName) {
            console.log("Goodbye " + m.name);
            toKick.push(m.id);
        }
        // if (!actualName) to
    }

    // Now the final bit, updating everything!

    console.log(`PUSHING`);
    console.log(toPush);
    // toPush.push([1235, "PUSH HARD'E!R\"; DROP TABLE your_mom;"]);
    console.log(`REMOVING`);
    console.log(toKick);
    console.log(`SQLs:`);
    console.log([`UPDATE character as c1 SET faction_id = $1, name = c2.name FROM (VALUES ${quickValues(toPush, 2, 2)}) AS c2(id, name) WHERE c2.id = c1.id`, [faction_id]]);//([faction_id] as unknown as [number, string][]).concat(toPush).flat() as string[]]);
    console.log([`UPDATE character as c1 SET faction_id = 0 FROM (VALUES ${quickValues(lazy(toKick), 1)}) AS c2(id) WHERE c2.id = c1.id`]);

    // New members.
    if (toPush.length) DatabaseManager.cli.query(`UPDATE character as c1 SET faction_id = $1, name = c2.name FROM (VALUES ${quickValues(toPush, 2, 2)}) AS c2(id, name) WHERE c2.id = c1.id`, [faction_id]).then(v => console.log({ rowCount: v.rowCount }), console.log);//([faction_id] as unknown as [number, string][]).concat(toPush).flat() as string[]).then(console.log, console.log);

    // Missing members
    if (toKick.length) DatabaseManager.cli.query(`UPDATE character as c1 SET faction_id = 0 FROM (VALUES ${quickValues(lazy(toKick), 1)}) AS c2(id) WHERE c2.id = c1.id`).then(v => console.log({ rowCount: v.rowCount }), console.log);
    
    // Character_name
    if (toRename.length) {
        // At this point I have given out to do a single query and will just instead loop
        for (let i = 0, len = toRename.length; i < len; i++) {
            const user = toRename[i];

            // Update character in case

            const isBeingPushed = findIndex(toPush, v => v[0] === user[0]) !== -1;

            if (!isBeingPushed) {
                DatabaseManager.cli.query(`UPDATE character SET name = $1 WHERE id = $2`, [user[1], user[0] as unknown as string]);
            }

            DatabaseManager.cli.query(`SELECT * FROM character_name WHERE id = $1 ORDER BY last_seen desc LIMIT 1`, [user[0]])
                .then(v => {
                    if (v.rows.length && v.rows[0].name.toLowerCase() === user[1].toLowerCase()) {
                        return DatabaseManager.cli.query(`UPDATE character_name SET last_seen = $1 WHERE o_id = $2 `, [new Date(), v.rows[0]["o_id"]]);
                    } else return DatabaseManager.cli.query(`INSERT INTO character_name (id, name) VALUES ($1, $2)`, [user[0] as unknown as string, user[1]]);
                }).catch(e => Logger.getLogger("CharTracker").error(e))
        }
    }
});