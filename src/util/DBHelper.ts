import type pg from "pg";
import { IBlacklist } from "../Models/Blacklist.js";
import Character, { ICharacter } from "../Models/Character.js";
import { ICharacterLink } from "../Models/CharacterLink.js";
import { IFaction } from "../Models/Faction.js";
import Fame, { IFame } from "../Models/Fame.js";
import { IMerchant } from "../Models/Merchant.js";
import { INotification } from "../Models/Notification.js";
import { IRally } from "../Models/Rally.js";
import { IUserSettings } from "../Models/UserSettings.js";
import type DatabaseManager from "../manager/database.js";

export type CharLink = ICharacterLink & ICharacter & { link_flags: number };
export type CharLinkFact = ICharacter & { discord_id: string, link_date: Date, link_flags: number, fact_name: string, fact_alignment: 1|2 };

export default class DBHelper {
    #db: typeof DatabaseManager;

    constructor(db: typeof DatabaseManager) {
        this.#db = db;
    }

    get #cli() {
        return this.#db.cli;
    }

    getFaction(id?: number) {
        return this.#cli.query<IFaction>(`SELECT * FROM faction${id ? " WHERE id = $1" : ""}`, id ? [id] : []).then(v => v.rows);//;.map(v => new Faction(v)))
    }

    getNotification(serverId?: string) {
        return this.#cli.query<INotification>(`SELECT * FROM notification${serverId ? " WHERE guild_id = $1" : ""}`, serverId ? [serverId] : [])
            .then(v => v.rows);//.then(v => v.rows.map(v => new (v)))
    }

    createAnalytics(type = 0, id: string, args = null, triggered_at = new Date()) {
        if (!id && type === 0) throw Error("ID needed for type 0");

        let obj = {
            id, type, args: args || null, triggered_at
        };

        if (typeof (id) === "object") {
            obj = id;

            if (!obj.type) obj.type = type || 0;
        }

        return this.#db.insert<string>("analytics", obj, "o_id");
    }

    async linkCharacter(discordId: string, userId: number, characterId: number, obj?: { flags: number }) : Promise<{ success: false, reason: string } | { success: true }> {
        if (!(discordId && userId && characterId)) throw Error("Not all IDs been passed.");
        if (!obj) obj = { flags: 0 };

        const result = {
            discord_id: discordId, user_id: userId, id: characterId,
            flags: obj.flags || 0, last_famed: null, link_date: new Date()
        } satisfies ICharacterLink;

        const { rows: x } = await this.#cli.query<ICharacter>("SELECT * FROM character WHERE id = $1 AND user_id = $2", [characterId, userId]);

        if (x.length === 0) return { success: false, reason: "Character with the ID and user ID doesn't exist in database." };

        /*const y = */await this.#db.insert<number>("characterlink", result, "id", false)//.catch(v => ({ error: v }));

        return { success: true };//{ success: true, };
    }

    /**
     * @param id If string, it'll be used as discord ID (which can return multiple character links). If number, it will be used as character ID (thus can only return one character link, still in array). If object, it'll be used wholly as a where clause.
     */
    getCharacterLinks(id: string | number | Record<string, string|number|Date>) : Promise<CharLink[]> {
        let keys:string[] = [];

        if (typeof(id) === "string") keys = ['link.discord_id'];
        else if (typeof(id) === "number") keys = ['link.id'];
        else if (typeof(id) === "object") keys = Object.keys(id);
        else throw Error("Unknown type for ID passed.");

        return this.#cli.query<ICharacterLink & ICharacter & { link_flags: number }>(`SELECT character.*, link.flags as link_flags, link.discord_id, link.link_date, link.last_famed FROM character INNER JOIN characterlink AS link ON character.id = link.id WHERE ${keys.map((v, i) => v + " = $" + (i + 1)).join(" AND ")}`, typeof(id) === "object" ? Object.values(id) : [id])
            .then(r => r.rows);
    }

    getCharacterFactLinks(discordId: string) : Promise<CharLinkFact[]>;
    getCharacterFactLinks(charId: number) : Promise<CharLinkFact[]>;
    getCharacterFactLinks(charId: number | string) {
        return this.#cli.query<CharLinkFact>(`select char.*, link.discord_id, link.link_date as link_date, link.flags as link_flags, faction.name as fact_name, faction.alignment as fact_alignment from character as char left join characterlink as link on link.user_id = char.user_id and link.id = char.id left join faction on faction.id = char.faction_id where ${typeof charId === "string" ? "link.discord_id" : "char.id"} = $1`, [charId])
            .then(v => v.rows);
    }

    /**
     * Returns based on EXACT values.
     * @param id If string, it will return the list of all blacklist records for the user with that ID, not the source/mod.
     * @returns Note that for the first index; -1 means the user has never been blacklisted before, 0 and 1 means either were blacklisted before, but 1 means currenttly blacklisted.
     */
    async isBlacklisted(id: string) : Promise<[0|1, IBlacklist[]] | [-1, []]> {
        const select = await this.#cli.query<IBlacklist>(`SELECT * FROM blacklist WHERE id = $1`, [id]).then(v => v.rows);

        if (select.length) {
            const result:[0|1, IBlacklist[]] = [0, []];
            const now = new Date();

            for (let i = 0; i < select.length; i++) {
                result[1].push(select[i]);

                // @ts-expect-error "Object is possibly 'null'.ts(2531)" my ass
                if (result[0] === 0 && (result[1][i].end === null || now < result[1][i].end)) result[0] = 1;
            }

            return result;
        } else return [-1, []];
    }

    getRallies(warId: number) : Promise<IRally[]> {
        return this.#cli.query<IRally>(`SELECT * FROM rallies WHERE war_id = $1`, [warId]).then(v => v.rows);
    }

    incrementFameCounter(charId: number, name: string, count = 1, lastSpoken: number | Date = new Date()) {
        if (!(lastSpoken instanceof Date)) lastSpoken = new Date(lastSpoken);

        return this.#cli.query<{}>('INSERT INTO fame (char_id, count, last_spoken, char_name) VALUES ($1, $2, $3, $4) ON CONFLICT (char_id) DO UPDATE SET last_spoken = $3, count = fame.count + $2', [charId, count == null ? 1 : count, lastSpoken, name]);
    }

    getUserSettings(discordId: string) {
        return this.#cli.query<IUserSettings>(`SELECT * FROM user_settings WHERE id = $1`, [discordId])
            .then(v => v.rows.length ? v.rows[0] : null);
    }

    createUserSettings(obj: IUserSettings) {
        return this.#db.insert<string>("user_settings", obj);
    }

    updateUserSettings(discordId: string, obj: Partial<Omit<IUserSettings, "id">>) {
        return this.#db.update("user_settings", { id: discordId }, obj);
    }

    async getFamousLb(limit:number, chars: true)  : Promise<{ fame: Fame, char: Character }[]>
    async getFamousLb(limit:number, chars: false) : Promise<IFame[]>
    async getFamousLb(limit = 10, chars = false) {
        let sql = "SELECT * FROM fame ORDER  BY count DESC limit $1";

        if (chars) sql = "SELECT fame.*, char.* FROM fame INNER JOIN character AS char ON char.id = fame.char_id ORDER BY fame.count DESC limit $1";

        const fetch = await this.#cli.query<IFame & ICharacter>(sql, [limit])
            .then(v => v.rows);

        if (chars === false) return fetch as IFame[];
        else {
            const res: { fame: Fame, char: Character }[] = [];

            for (let i = 0; i < fetch.length; i++) {
                res[i] = {
                    fame: new Fame(fetch[i]),
                    char: new Character(fetch[i])
                };
            }

            return res;
        }
    }

    getMerchantsByItemId(itemId: number) {
        return this.#cli.query<IMerchant>(`SELECT DISTINCT m.* FROM merchant m CROSS JOIN LATERAL jsonb_array_elements(items) AS item WHERE (item->>0)::text = $1;`, [itemId])
            .then(v => v.rows);
    }

    getMerchant(id: number) : Promise<IMerchant | undefined> {
        return this.#cli.query<IMerchant>(`SELECT * FROM merchant WHERE id = $1`, [id])
            .then(v => v.rows[0]);
    }
}