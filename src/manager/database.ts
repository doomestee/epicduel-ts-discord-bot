import pg from "pg";
import Logger from "./logger.js";
import DBHelper from "../util/DBHelper.js";
import Config from "../config/index.js";

/**
 * This is to avoid use of map excessively, as it's significantly weaker (in terms of performance) compared to for loop
 * @param length How many more to add
 * @param index Starting index
 */
export function quickDollars(length: number | Array<any>, index = 0) : string {
    const len = Array.isArray(length) ? length.length : length;

    let str = "";

    for (let i = 0; i < len; i++) {
        str += "$" + (i + index + 1);//values[i] + ", "

        if ((i + 1) !== len) str += ", "
    }

    return str;
}

export default class DatabaseManager {
    static cli: pg.Client;
    private static init = false;
    static ready = false;
    static initiatedAt = 0;
    
    static async initialise() {
        if (this.init) return;
        this.init = true;

        this.cli = new pg.Client({
            host: Config.dbHost,// "localhost" : "postgres.containers.local",
            port: Config.dbPort,
            user: Config.dbUser,// "vendie" : "vendie",
            password: Config.dbPassword,//undefined,
            ssl: false, // This is a local database
            application_name: "VendBot"
        });

        this.initiatedAt = Date.now();

        Logger.getLogger("Database").debug("Connecting...");
        const start = Date.now();
        return this.cli.connect().then(() => {
            const end = Date.now();
            Logger.getLogger("Database").debug(`Connected in ${Math.round((end - start)/10)/100}s.`);
            this.ready = true;
        });
    }

    static get initialised() {
        return this.init && this.cli !== undefined;
    }

    static async insert<T extends string | number = string | number>(table: string, data: Record<string, any>, ignoreDuplicate: true) : Promise<null>;
    static async insert<T extends string | number = string | number>(table: string, data: Record<string, any>, returning?: string, ignoreDuplicate?: false) : Promise<T>;
    static async insert<T extends string | number = string | number>(table: string, data: Record<string, any>, returning:string|boolean = "id", ignoreDuplicate = false) {
        const keys = Object.keys(data);
        const values = Object.values(data);

        if (typeof returning === "boolean") {
            ignoreDuplicate = returning;
            returning = "";
        }
        
        const res = await this.cli.query<Record<string, T>>(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${quickDollars(keys)})${ignoreDuplicate ? " ON CONFLICT DO NOTHING" : ""}${returning !== "" ? " RETURNING " + returning : ""}`, values);

        return ignoreDuplicate ? null : res["rows"][0][returning];
    }

    /**
     * @param {string} table 
     * @param {Record<string, unknown>} data
     * @param {string[]} constraints List of columns
     */
    static async upsert(table: string, data: Record<string, unknown>, constraints: string[]) {
        const keys = Object.keys(data);
        const values = Object.values(data);

        return this.cli.query(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${quickDollars(keys)}) ON CONFLICT (${constraints.join(", ")}) DO UPDATE SET (${keys.join(", ")}) = (${keys.map(v => "EXCLUDED." + v)})`, values)
            .catch(err => {
                console.log(data);
                throw err;
            });
    }

    static async update(table: string, where: Record<string, unknown>, to: Record<string, unknown>) {
        const keys = [Object.keys(to), Object.keys(where)];
        const values = [Object.values(to), Object.values(where)];

        let str = "";

        let index = 1;

        for (let k = 0; k < keys.length; k++) {
            for (let i = 0; i < keys[k].length; i++) {
                str += keys[k][i] + " = $" + (index++);
    
                if ((i + 1) !== keys[k].length) {
                    if (k === 0) str += ", ";
                    else str += " AND ";
                }
            }

            if (k === 0) str += " WHERE ";
        }

        if (Config.isDevelopment) console.log([`UPDATE ${table} SET ${str}`, values.flat()]);

        return this.cli.query(`UPDATE ${table} SET ${str}`, values.flat());
    }

    static async bulkInsert(table: string, columns: string[], values: (string|number)[] | Record<string, string|number>[] | Array<string|number>[]) {
        if (columns.length === 0) throw Error("No columns.");
        if (values.length === 0) throw Error("No values.");

        /**
         * SQL statement
         */
        let query = "INSERT INTO " + table + " (";
        /**
         * Parameters
         */
        let toQuery:(string|number)[] = [];

        for (let i = 0, len = columns.length; i < len; i++) {
            query += columns[i] + ", ";
        }

        query = query.slice(0, -2) + ") VALUES";

        for (let i = 0, len = values.length; i < len; i++) {
            let count = 0;

            const val = values[i];

            if (typeof val === "object") {
                if (Array.isArray(val)) {
                    toQuery.push(...val);
                    count += val.length;
                } else {
                    for (let k = 0, ken = columns.length; k < ken; k++) {
                        const col = columns[k];

                        if (typeof val[columns[k]] === undefined) {
                            throw Error(`Bulk insert HALTED due to a missing column (${col}) in an object`);
                        } else {
                            toQuery.push(val[columns[k]]);
                            count++;
                        }
                    }
                }
            } else {
                toQuery.push(val);
                count++;
            }

            if (i !== 0) query += ",";

            query += ` (${quickDollars(count, toQuery.length - count)})`;
        }

        //@ts-ignore
        if (this.test) console.log(query, toQuery);
        return this.cli.query(query, toQuery as string[]).then(v => v.rowCount);
    }

    static helper = new DBHelper(this);
}

// const Fame = require("../structures/DBFame");
// const Rally = require("../structures/DBRally");
// const Analytic = require("../structures/Analytic");
// const Merchant = require("../structures/DBMerchant");
// const Blacklist = require("../structures/Blacklist");
// const Character = require("../structures/DBCharacter");
// const Notification = require("../structures/DBNotification");
// const UserSettings = require("../structures/DBUserSettings");
// const LinkedCharacter = require("../structures/DBLinkedCharacter");
// const { getUserLevelByExp } = require("../utilities");
// const Faction = require("../structures/DBFaction");

// const pg = require("pg");