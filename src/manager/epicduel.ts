import { request } from "undici";
import Client from "../game/Proximus.js";
import User from "../game/User.js";
import { parseStringPromise } from "xml2js";
import { SwarmError } from "../util/errors/index.js";
import Server from "../game/Server.js";
import { MainEDEvents, SFSClientEvents } from "../types/events.js";
import { Requests } from "../game/Constants.js";
import Logger from "./logger.js";
import EDCycler from "../util/EDCycler.js";
import SwarmResources from "../util/game/SwarmResources.js";
import { IWar } from "../Models/War.js";
import DatabaseManager from "./database.js";
import { readdir } from "fs/promises";
import Config from "../config/index.js";
import { ImportResult } from "../util/types.js";
import EDEvent from "../util/events/EDEvent.js";
import type Hydra from "./discord.js";
import RoomManager from "../game/module/RoomManager.js";
import { filter, find, findIndex, map } from "../util/Misc.js";
import { WarObjective } from "../game/module/WarManager.js";
import RoomManagerRecord from "../game/record/RoomManagerRecord.js";
import { readFileSync } from "fs";

export enum RestrictedMode {
    NONE = 0,
    SWARM_ONLY = 1,
    ALL = 2
}

const appendages = JSON.parse(readFileSync(Config.dataDir + "/appendages.json").toString()) as string[];

if (Config.isDevelopment) appendages.reverse();

/**
 * This will be used for epicduel clients, allowing for shared resources.
 */
export default class Swarm {
    /**
     * 3 seconds (can't be reached), 5 seconds, 10 seconds, 60 seconds, 2 minutes, 5 minutes, 10 minutes, 5 minutes, 30 minutes, 5 minutes, 1 hour, 5 minutes, 1.5 hours.
     */
    static delays = [3000, 5000, 10000, 60000, 120000, 300000, 600000, 300000, 1800000, 300000, 3600000, 300000, 5400000, 5000];

    /**
     * 
     */
    static restrictedMode = RestrictedMode.NONE;
    
    /**
     * This will only feature the list of clients that are connected.
     * 
     * If there's none, check purgatory.
     */
    protected static readonly clients:Client[] = [];

    protected static readonly purgatory:Client[] = [];


    /**
     * This is a list
     */
    static readonly appendages:string[] = appendages;

    /**
     * This is a service that will cycle every interval when active, connecting new clients 
     */
    static cycler = new EDCycler(this);

    static get centralClient() {
        return this.getClientById(1);
    }

    /**
     * The limit to how many clients this service can have, irrespective of whether if they were connected or only created or w/e.
     */
    static cap:number = 2;

    /**
     * If the server goes down or is offline, the manager will go into probing mode so for every interval, it'll check on ED server to see if it's alive, using proxied connections.
     */
    static probing = false;

    private static idGen = 1;

    /**
     * Creates a new Client instance with the given account, it'll also initialise (but does not connect).
     * 
     * NOTE: It will automatically add to the internal list.
     */
    static async create(email: string, password: string) : Promise<Client>;
    static async create(account: { email: string, pass: string }) : Promise<Client>;
    static async create(account: string | { email: string, pass: string }, password?: string) {
        if (this.cap <= this.clients.length) throw Error("Too many clients are initiated.");

        const email = typeof account === "object" ? account["email"] : account;
        const pass = typeof account === "object" ? account["pass"] : password;//password ?? account["pass"];

        if (pass === undefined) throw new SwarmError("LOGIN_FAILED", "There's no password.");

        const user = await this.login(email, pass);

        const client = new Client(user, this.idGen++, this);
        client.smartFox.once("onConnection", this.onConnection.bind({ client, swarm: this }))
        client.smartFox.once("onConnectionLost", this.onConnectionLost.bind({ client, swarm: this }));

        if (this.restrictedMode === RestrictedMode.ALL) {
            client.restrictedMode = this.restrictedMode;

            // client.homeJump = true;
        }

        this.purgatory.push(client);

        return client;
    }

    static onConnection(this:{ client: Client, swarm: typeof Swarm }, ev: SFSClientEvents["onConnection"][0]) {
        const { client, swarm } = this;

        if (ev.success) {
            client.connected = true;

            if (client.restrictedMode !== RestrictedMode.NONE) {
                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MY_HOMES, {}, 1, "json");
            }
        } else {
            client.connected = false;
        } 
    }

    static onConnectionLost(this:{ client: Client, swarm: typeof Swarm }, ev: SFSClientEvents["onConnectionLost"][0]) {
        const { client, swarm } = this;

        client.connected = false;

        const bools = client.selfDestruct();

        let broke = false;
        for (let i = 0, len = bools.length; i < len; i++) {
            if (bools[i].some(g => g === false)) {
                Logger.getLoggerP(client.settings.id).debug("Client not fully self destructed.");
                broke = true;
                break;
            }
        }

        if (!broke) Logger.getLoggerP(client.settings.id).debug("Client fully self destructed.");

        // I've decided that the client will persist in the list, even if redundant, to allow for regeneration.
        // // This is the first time I'm comparing objects like this, pls do not fail on me.
        // // nnvm i decided not to
        // const index = swarm.clients.findIndex(v => v.settings.id === client.settings.id);

        // swarm.clients.splice(index, 1);

        if (ev.discParams === "CLIENT_REQUEST_DESTROYED") return;
        if (!client.settings.reconnectable || swarm.probing) return;

        // this.client.
    }

    /**
     * This will return a new User object with session and stuff. This is expensive in that it can ratelimit, so use loginQueue!
     * If you're regenerating, you can just extract the servers, new user details stuff still.
     */
    protected static async login(email: string, password: string, proxy?: boolean) : Promise<User>;
    protected static async login(account: { email: string, pass: string }) : Promise<User>;
    protected static async login(account: string | { email: string, pass: string }, password?: string, proxy=false) {
        const email = typeof account === "object" ? account["email"] : account;
        const pass = typeof account === "object" ? account["pass"] : password;//password ?? account["pass"];

        if (pass === undefined) throw new SwarmError("LOGIN_FAILED", "There's no password.");

        const { body, statusCode, headers } = await request("https://epicduelstage.artix.com/epiclogin.asp?ran=" + Math.random(), {
            headers: {
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                "pragma": "no-cache",
                "x-requested-with": "ShockwaveFlash/32.0.0.101",
            },
            "body": `strPassword=${encodeURIComponent(pass)}&publishMode=2&strUsername=${encodeURIComponent(email)}`,
            "method": "POST",
            "maxRedirections": 2
        });

        if (statusCode === 429) throw new SwarmError("RATELIMITED", "Ratelimited.", headers);
        
        const xml = await body.text().then(parseStringPromise);

        if (!xml.login || xml.login['$'].success === '0' || xml.login['$'].bSuccess === '0') throw new SwarmError("LOGIN_FAILED", "Unable to login", xml.login['$']);

        const user = new User({
            loggedIn: ((xml.login["$"]["success"])),
            session: xml.login["$"]["session"],
            userid: xml.login["$"]["userid"],
            username: xml.login["$"]["username"],
            userPriv: xml.login["$"]["userPriv"],
            userAge: xml.login["$"]["age"],
            password: xml.login["$"]["password"],
        });

        if (xml.login["servers"]) {
            const servers = Object.values(xml.login["servers"]) as any[];

            for (let i = 0, len = servers.length; i < len; i++) {
                user.servers.push(new Server({
                    online: Boolean(Number(servers[i]["$"]["onlineStatus"])),
                    ip: ((servers[i]["$"]["serverIP"])),
                    port: ((servers[i]["$"]["serverPort"])),
                    name: ((servers[i]["$"]["serverName"])),
                    userCount: [servers[i]["$"]["userCount"], servers[i]["$"]["userMax"]].map(Number),
                    initialised: new Date()
                }));
            }
        }

        return user;
    }

    static getClientById(id: number, fromPurgatoryToo?:boolean) : Client | undefined;
    static getClientById(fromPurgatoryToo?:boolean) : Client | undefined;
    static getClientById(id?: number | boolean, fromPurgatoryToo=true) {
        for (let i = 0, len = this.clients.length; i < len; i++) {
            if (typeof id !== "number") {
                if (this.clients[i].connected) return this.clients[i];
                else continue;
            }
            if (this.clients[i].settings.id === id) return this.clients[i];
        }

        if (fromPurgatoryToo || id === true) {
            if (typeof id === "boolean" && id !== true) return undefined;

            for (let i = 0, len = this.purgatory.length; i < len; i++) {
                if (typeof id !== "number") {
                    if (this.purgatory[i].connected) return this.purgatory[i];
                    else continue;
                }
                if (this.purgatory[i].settings.id === id) return this.purgatory[i];
            }
        }

        return undefined;
    }

    /**
     * This will pick the first client that meets the requirement as indicated by the given predicate function.
     */
    static getClient(pred: (cli: Client) => boolean, fromPurgatoryToo=true) {
        for (let i = 0, len = this.clients.length; i < len; i++) {
            if (pred(this.clients[i])) return this.clients[i];
        }

        if (fromPurgatoryToo) {
            for (let i = 0, len = this.purgatory.length; i < len; i++) {
                if (pred(this.purgatory[i])) return this.purgatory[i];
            }
        }

        return undefined;
    }

    static readonly resources = new SwarmResources()

    static get languages() {
        return this.resources.languages;
    }

    static langCheck(key: string) {
        return this.resources.languages[key] ?? key;
    }


    // TODO: move this somewhere

    static activeWar = { done: false, war: {} } as { done: boolean, war: IWar };
    static lastCheckedActiveWar = 0;

    static get isWarActive() {
        if ((this.getClient(v => v.connected && v.lobbyInit)?.modules.WarManager.cooldownHours ?? 1) > 0) return [false, -1];
        return [!!(this.activeWar?.war.id), this.activeWar];
    }

    /**
     * If in standalone, this can't be used and will throw error.
     * Database war ID, not the region ID or anything, the game doesn't have one so we gotta identify stuff ourselves.
     * @param refreshCache 
     */
    static async getActiveWar(refreshCache = false) : Promise<{ type: 1, result: IWar } | { type: 0, prev: IWar } | { type: -1, reasonType: number }> {
        const ed = this.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return { reasonType: 0, type: -1 };

        if (!refreshCache && this.activeWar.war.id) return { type: 1, result: this.activeWar.war };

        const [sussy] = await DatabaseManager.cli.query<IWar>(`SELECT * FROM war ORDER BY id desc LIMIT 1`).then(v => v.rows);

        if (ed.modules.WarManager.activeRegionId > 0 && ed.modules.WarManager.activeRegionId !== sussy.region_id) {
            if (!sussy.ended_at) DatabaseManager.update("war", { id: sussy.id }, { ended_at: new Date() });
            this.checkWar(true);

            return { type: 1, result: { created_at: new Date(), ended_at: null, id: sussy.id + 1, max_points: ed.modules.WarManager.currentObjectives().reduce((a, b) => a + ((b.alignmentId === 1) ? b.maxPoints : 0), 0), region_id: ed.modules.WarManager.activeRegionId } };
        }

        if (sussy.ended_at) {
            this.activeWar["war"] = sussy;
            this.activeWar["done"] = true;

            return { type: 0, prev: sussy };
        }

        this.activeWar = {
            done: false,
            war: sussy
        };

        return {
            type: 1, result: sussy
        };
    }

    static async checkWar(newWar=false) {
        const ed = this.getClient(v => v.connected && v.lobbyInit);

        if (!ed) return false;// { reasonType: 0, type: -1 };
        // if (this.standalone) throw Error("EpicDuel manager in standalone mode. Database access restricted.");
        
        if (newWar) {
            return DatabaseManager.insert("war", {
                region_id: ed.modules.WarManager.activeRegionId,
                max_points: ed.modules.WarManager.currentObjectives().reduce((a, b) => a + ((b.alignmentId == 1) ? (b.maxPoints) : 0), 0),
                created_at: new Date()
            });
        }

        // if (!ed.connected) return "NOT_CONNECTED";

        let oh = (this.lastCheckedActiveWar === 0 || (this.lastCheckedActiveWar + 120000 < Date.now()))
        let x = await this.getActiveWar(oh);

        if (ed.modules.WarManager.cooldownHours > 0 && ed.modules.WarManager.activeRegionId != 0) {
            if ((x.type === 1) && x.result.ended_at) {
                DatabaseManager.update("war", { id: x.result.id }, { ended_at: new Date() })
                    .then(() => {
                        Logger.getLogger("War").debug("War ended at ease.");
                        this.activeWar = {
                            done: true,
                            war: {} as IWar
                        };
                    });
            }
        }

        if (oh) {this.lastCheckedActiveWar = Date.now()}
        if (x.type === 0) return false;

        // commenting out because this kind of check is already implemented in getting active war.
        //if (x[1].id === this.client.modules.WarManager.activeRegionId)

        return true;
    }

    // executor:{ [x in keyof MainEDEvents]: () => any } = {}
    static executor:{ [x in keyof MainEDEvents]: (() => any) | undefined } = {
        onAdminMessage: undefined, // done
        onComparisonUpdate: undefined, // done
        onFactionEncounter: undefined, // done
        onFriendStatus: undefined, // done
        onJoinRoom: undefined, // done
        onPrivateMessage: undefined, // done
        onPublicMessage: undefined, // done
        onUserListUpdate: undefined,
        onWarStatusChange: undefined, // done
    };

    private static async loadEvents() {
        const events = (await readdir(Config.eventsDirectory + "/epicduel", { withFileTypes: true }));

        let suc = 0;

        for (let i = 0, len = events.length; i < len; i++) {
            const file = events[i];

            if (!file.isFile()) continue;

            const path = `${Config.eventsDirectory}/epicduel/${file.name}`;

            let ev = await import(path) as ImportResult<EDEvent>;

            if ("default" in ev) {
                ev = ev.default;
            }

            if (!(ev instanceof EDEvent)) {
                throw new TypeError(`Export of event file "${path}" is not an instance of ClientEvent.`);
            }

            // I hate myself for this yes, but ill be using apply.
            //@ts-ignore
            this.executor[ev.name] = ev.listener;//.bind(this.clients[0]);

            //this.on(ev.name, ev.listener.bind(this));
            suc++;
        }

        Logger.getLogger("EDEvents").debug(`Loaded ${suc} event(s) for swarm.`);
    }

    static discord:Hydra;

    static execute<K extends keyof MainEDEvents = keyof MainEDEvents>(type: K, cli: Client, ...args: MainEDEvents[K]) {
        const exec = [];

        exec[0] = cli;

        for (let i = 0, len = args.length; i < len; i++) {
            exec[i + 1] = args[i];
        }

        //@ts-expect-error
        this.executor[type]?.call(cli, this.discord, ...args);//, [this.discord, ...exec]);// as unknown as [hydra: Hydra, ...MainEDEvents[K]]);
        // this.executor[type]?.call(cli, this.discord, ...args)//.apply(cli, [this.discord, ...args]);
    }

    static init() {
        this.loadEvents();
    }

    static get length() {
        return this.clients.length + this.purgatory.length;
    }

    static scaleFor(type: "war", reverse: boolean = false) {
        Logger.getLogger("Swarm").debug("Requested to " + (reverse ? "down" : "") + "scale, type: " + type);

        const cli = this.getClient(v => v.connected && v.lobbyInit);

        if (!cli) throw Error("UNAVAILABLE CLIENT, NEED AT LEAST ONE CONNECTED CLIENT!");

        if (type === "war") {
            if (reverse) {
                const clis = this.clients.concat(this.purgatory);

                for (let i = 0, len = clis.length; i < len; i++) {
                    if (clis[i].settings.scalable) {
                        clis[i].settings.reconnectable = false;
                        clis[i].smartFox.disconnect();
                    }
                }

                return true;
            }

            const roomWithObjs = filter(RoomManager.roomVersions, v => v.regionId === cli.modules.WarManager.activeRegionId);//cli.modules.WarManager.currentObjectives(-1);
            const objs = cli.modules.WarManager.currentObjectives(-1);

            const oppAlign = cli.modules.WarManager.getControlAlignmentInActiveRegion();

            // Filter through objectives that are done
            const filtered:[WarObjective, RoomManagerRecord][] = [];

            for (let i = 0, len = objs.length; i < len; i++) {
                const obj = objs[i];
                const room = find(roomWithObjs, v => v.objectiveId === obj.objectiveId);

                if (!room) throw Error("Conflicting objectives.");

                if (obj.points !== obj.maxPoints && obj.alignmentId !== oppAlign) filtered.push([obj, room]);
            }

            if (filtered.length > this.appendages.length) Logger.debug("Swarm").warn(`Not enough accounts (currently ${this.appendages.length}) to cover all war objectives ${filtered.length}.`);

            const availClis = filter(this.clients.concat(this.purgatory), v => v.settings.scalable);

            // Loop first anyways, for now it will keep the clients alive until they later disconnect on their own.
            for (let i = 0, len = availClis.length; i < len; i++) {
                availClis[i].settings.reconnectable = false;
            }

            for (let i = 0, len = filtered.length; i < len; i++) {
                // Already in list so use this.
                if (availClis[i]) {
                    availClis[i].settings.reconnectable = true;
                    availClis[i].settings.startRoom = filtered[i][1].roomName + "_0";
                    if (availClis[i]["connected"]) {
                        availClis[i].joinRoom(availClis[i].settings.startRoom);
                    }
                    else if (availClis[i]["isFresh"]) availClis[i]["connect"]();

                    continue;
                }

                const queued = this.loginQueue();
                
                if (queued === false) break;

                queued.settings.reconnectable = true;
                queued.settings.scalable = true;
                queued.settings.startRoom = filtered[i][1].roomName + "_0";
                queued["isFresh"] = false;
                queued.selfDestruct();
            }
        }
    }

    /**
     * If passed undefined, it will pick a fresh one from the queue.
     * 
     * NOTE: PLEASE SET isFresh to false AND set initialised to false or self destruct ASAP, otherwise it will never be logged in unless manually called later.
     */
    static loginQueue() : Client | false;
    static loginQueue(email: string, password: string) : Client | false;
    static loginQueue(account: { email: string, pass: string }) : Client | false;
    static loginQueue(account?: string | { email: string, pass: string }, password?: string) {
        if (typeof account === "string") {
            account = { email: account, pass: password as string };
        }

        if (typeof account === "undefined") {
            const used:string[] = map(filter(map(this.clients, v => [v.user.username, v.user.password] as [string, string]).concat(map(this.purgatory, v => [v.user.username, v.user.password] as [string, string])), v => v[0].startsWith("justforoncedm02+") && v[1] === Config.edPuppetPass), v => v[0].slice(16, -10));

            for (let i = 0, len = this.appendages.length; i < len; i++) {
                if (findIndex(used, v => v === this.appendages[i]) !== -1) continue;

                account = {
                    email: "justforoncedm02+" + this.appendages[i] + "@gmail.com",
                    pass: Config.edPuppetPass
                };
                break;
            }

            if (!account) return false;
        }

        // if (this.cap <= this.clients.length) throw Error("Too many clients are initiated.");

        // const email = typeof account === "object" ? account["email"] : account;
        // const pass = typeof account === "object" ? account["pass"] : password;//password ?? account["pass"];

        if (account.pass === undefined) throw new SwarmError("LOGIN_FAILED", "There's no password.");

        // const user = await this.login(account.email, account.pass);

        const client = new Client(new User({ loggedIn: "false", session: "", username: account.email, password: account.pass }), this.idGen++, this);
        client.smartFox.once("onConnection", this.onConnection.bind({ client, swarm: this }))
        client.smartFox.once("onConnectionLost", this.onConnectionLost.bind({ client, swarm: this }));

        if (this.restrictedMode === RestrictedMode.ALL) {
            client.restrictedMode = this.restrictedMode;

            // client.homeJump = true;
        }

        this.purgatory.push(client);

        return client;
    }
}

Swarm["init"]();