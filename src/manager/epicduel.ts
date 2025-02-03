import { fetch, request } from "undici";
import Client, { ClientSettingsMode } from "../game/Proximus.js";
import User from "../game/User.js";
import { parseStringPromise } from "xml2js";
import { SwarmError } from "../util/errors/index.js";
import Server from "../game/Server.js";
import type { MainEDEvents, SFSClientEvents } from "../types/events.js";
import { Requests } from "../game/Constants.js";
import Logger from "./logger.js";
import EDCycler from "../util/EDCycler.js";
import type { IWar } from "../Models/War.js";
import DatabaseManager from "./database.js";
import { readdir } from "fs/promises";
import Config from "../config/index.js";
import type { ImportResult } from "../util/types.js";
import EDEvent from "../util/events/EDEvent.js";
import type Hydra from "./discord.js";
import RoomManager from "../game/module/RoomManager.js";
import { filter, find, findIndex, map, sleep } from "../util/Misc.js";
import type { WarObjective } from "../game/module/WarManager.js";
import type RoomManagerRecord from "../game/record/RoomManagerRecord.js";
import { readFileSync } from "fs";
import ProxyManager from "./proxy.js";

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
    // /**
    //  * 3 seconds (can't be reached), 5 seconds, 10 seconds, 60 seconds, 2 minutes, 5 minutes, 10 minutes, 5 minutes, 30 minutes, 5 minutes, 1 hour, 5 minutes, 1.5 hours.
    //  */
    // static delays = [3000, 5000, 10000, 60000, 120000, 300000, 600000, 300000, 1800000, 300000, 3600000, 300000, 5400000, 5000];

    /**
     * 
     */
    static restrictedMode = RestrictedMode.NONE;
    
    /**
     * This will only feature the list of clients that are connected.
     * 
     * If there's none, check purgatory.
     */
    static readonly clients:Client[] = [];

    static readonly purgatory:Client[] = [];

    /**
     * Concatenation of both clients and clients in purgatory (that are connected and passed the lobby).
     */
    static get clis() {
        return filter(this.clients.concat(this.purgatory), v => v.connected && v.lobbyInit);
    }


    /**
     * This is a list
     */
    static readonly appendages:Array<string|[string, string]> = appendages;

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

        const bools = client.selfDestruct(true);

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

        // if (ev.discParams === "CLIENT_REQUEST_DESTROYED") return;
        // if (!client.settings.reconnectable || swarm.probing) return;

        // this.client.
    }

    /**
     * This will return a new User object with session and stuff. This is expensive in that it can ratelimit, so use loginQueue!
     * If you're regenerating, you can just extract the servers, new user details stuff still.
     * 
     * @param proxy If 0, it will be proxied if applicable. If 1 or true, it will only be proxied. If -1 or undefined or false, it will never be proxied.
     */
    protected static async login(email: string, password: string, proxy?: boolean | -1 | 0 | 1) : Promise<User>;
    protected static async login(account: { email: string, pass: string }) : Promise<User>;
    protected static async login(account: string | { email: string, pass: string }, password?: string, proxy=false) {
        const email = typeof account === "object" ? account["email"] : account;
        const pass = typeof account === "object" ? account["pass"] : password;//password ?? account["pass"];

        if (email === undefined || email.length === 0) throw new SwarmError("LOGIN_FAILED", "There's no email.");
        if (pass === undefined || pass.length === 0) throw new SwarmError("LOGIN_FAILED", "There's no password.");

        let xml;

        //@ts-expect-error
        if (typeof proxy !== "undefined" && ProxyManager.available && proxy !== -1 && proxy !== false) {
            const res = await ProxyManager.login(email, pass);

            if (res.success) {
                xml = await parseStringPromise(res.value);
            } else {
                if (res.value === "Exhausted Requests" || res.value === "Ratelimited") throw new SwarmError("RATELIMITED", "Ratelimited.");

                Logger.getLogger("SwarmProxy").error(res);
                throw Error("unknown error not identified");
            }
        } else {
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
            
            xml = await body.text().then(parseStringPromise);
        }

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
                if (this.clients[i].connected && this.clients[i].receiving) return this.clients[i];
                else continue;
            }
            if (this.clients[i].settings.id === id) return this.clients[i];
        }

        if (fromPurgatoryToo || id === true) {
            if (typeof id === "boolean" && id !== true) return undefined;

            for (let i = 0, len = this.purgatory.length; i < len; i++) {
                if (typeof id !== "number") {
                    if (this.purgatory[i].connected && this.purgatory[i].receiving) return this.purgatory[i];
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
    static getClient(pred: (cli: Client) => boolean, fromPurgatoryToo=true, randomise=true) {
        const clis:Client[] = [];

        for (let i = 0, len = this.clients.length; i < len; i++) {
            if (pred(this.clients[i])) {
                if (!randomise) return this.clients[i];
                clis.push(this.clients[i]);
            }
        }

        if (fromPurgatoryToo) {
            for (let i = 0, len = this.purgatory.length; i < len; i++) {
                if (pred(this.purgatory[i])) {
                    if (!randomise) return this.purgatory[i];
                    clis.push(this.purgatory[i]);
                }
            }
        }

        return clis.length > 0 ? clis[Math.floor(Math.random() * clis.length)] : undefined;
    }

    static settings = {
        giftLog: false,
        test1: false,
        hiatuses: false
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

        if (!refreshCache && this.activeWar.war.id && !this.activeWar.done && !(ed.modules.WarManager.activeRegionId > 0 && this.activeWar.war.region_id !== ed.modules.WarManager.activeRegionId)) return { type: 1, result: this.activeWar.war };

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
    static executor:{ [x in keyof MainEDEvents]: EDEvent<x> | undefined } = {//(() => any) | undefined } = {
        onAdminMessage: undefined, // done
        onComparisonUpdate: undefined, // done
        onFactionEncounter: undefined, // done
        onFactionMemberEncounter: undefined, // done
        onFriendStatus: undefined, // done
        onJoinRoom: undefined, // done
        onPrivateMessage: undefined, // done
        onPublicMessage: undefined, // done
        onUserListUpdate: undefined,
        onWarStatusChange: undefined, // done
        onDailyMissions: undefined, // done
        onReceiveGift: undefined // done
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
            this.executor[ev.name] = ev;

            //@ts-ignore
            // this.executor[ev.name] = ev.listener;//.bind(this.clients[0]);

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

        this.executor[type]?.listener.call(cli, this.discord, ...args);

        // this.executor[type]?.call(cli, this.discord, ...args);//, [this.discord, ...exec]);// as unknown as [hydra: Hydra, ...MainEDEvents[K]]);
        // this.executor[type]?.call(cli, this.discord, ...args)//.apply(cli, [this.discord, ...args]);
    }

    static init() {
        this.loadEvents();
    }

    static get length() {
        return this.clients.length + this.purgatory.length;
    }

    static scaleFor(type: "war" | "vendbot", reverse: boolean = false) {
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

            if (cli.modules.WarManager.cooldownHours < 1) {
                for (let i = 0, len = objs.length; i < len; i++) {
                    const obj = objs[i];
                    const room = find(roomWithObjs, v => v.objectiveId === obj.objectiveId);

                    if (!room) throw Error("Conflicting objectives.");

                    if (room.roomName === "TrainHubRight" && this.centralClient?.smartFox.getActiveRoom()?.name.startsWith("TrainHubRight_")) continue;

                    if (obj.points !== obj.maxPoints && obj.alignmentId !== oppAlign) filtered.push([obj, room]);
                }
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
                queued.settings.proxy = 0;
                queued["isFresh"] = false;
                queued.selfDestruct();
            }
        } else {
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

            if (8 > this.appendages.length) Logger.debug("Swarm").warn(`Not enough accounts (currently ${this.appendages.length}) to cover all rooms.`);

            const availClis = filter(this.clients.concat(this.purgatory), v => v.settings.scalable);

            // Loop first anyways, for now it will keep the clients alive until they later disconnect on their own.
            for (let i = 0, len = availClis.length; i < len; i++) {
                availClis[i].settings.reconnectable = false;
            }

            for (let i = 0; i < 8; i++) {
                // Already in list so use this.
                if (availClis[i]) {
                    availClis[i].settings.reconnectable = true;
                    availClis[i].settings.startRoom = RoomManager.TRAIN_HUB_RIGHT + "_" + (i + 1);//filtered[i][1].roomName + "_0";
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
                queued.settings.startRoom = RoomManager.TRAIN_HUB_RIGHT + "_" + (i + 1);//filtered[i][1].roomName + "_0";
                queued.settings.proxy = 0;
                queued["isFresh"] = false;
                queued.selfDestruct();
            }
        }
    }

    static scale(count: number, roomie = false, randomie = false) {
        Logger.getLogger("Swarm").debug("Requested to scale the scalable fleet to " + count + ".");

        const cli = this.getClient(v => v.connected && v.lobbyInit);

        // if (reverse) {
        //     const clis = this.clients.concat(this.purgatory);

        //     for (let i = 0, len = clis.length; i < len; i++) {
        //         if (clis[i].settings.scalable) {
        //             clis[i].settings.reconnectable = false;
        //             clis[i].smartFox.disconnect();
        //         }
        //     }

        //     return true;
        // }

        if (count > this.appendages.length) Logger.debug("Swarm").warn(`Not enough accounts (currently ${this.appendages.length}) to cover all rooms.`);

        const availClis = filter(this.clients.concat(this.purgatory), v => v.settings.scalable);

        // Loop first anyways, for now it will keep the clients alive until they later disconnect on their own.
        for (let i = 0, len = availClis.length; i < len; i++) {
            availClis[i].settings.reconnectable = false;
        }

        const rooms = randomie ? [] : map(["TrainHubRight", "TrainHubBLeft"], c => map([0, 1, 2, 3, 4, 5, 6, 7, 8], n => c + "_" + n)).flat();//[]//[, RoomManager.getAllRoomRecordsForMerchant()]
        rooms.splice(0, 1); // always exclude the main station.
        const roomC = rooms.length;

        for (let i = 0; i < count; i++) {
            // Already in list so use this.
            if (availClis[i]) {
                availClis[i].settings.reconnectable = true;
                if (availClis[i]["connected"]) {
                    if (roomie) {
                        availClis[i].settings.startRoom = roomC > i ? rooms[i] : RoomManager.getRandomRoomRecord(v => v.merchants.length > 0 && !v.isHomeOrHQ()).roomName + "_0";
                        availClis[i].joinRoom(availClis[i].settings.startRoom);
                    }
                    // availClis[i].joinRoom(availClis[i].settings.startRoom);
                } else if (availClis[i]["isFresh"]) {
                    availClis[i].settings.startRoom = roomC > i ? rooms[i] : RoomManager.getRandomRoomRecord(v => v.merchants.length > 0 && !v.isHomeOrHQ(), true, map(availClis, v => v.settings.startRoom)).roomName + "_0";
                    availClis[i]["connect"]();
                }

                continue;
            }

            const queued = this.loginQueue();
            
            if (queued === false) break;

            queued.settings.reconnectable = true;
            queued.settings.scalable = true;
            queued.settings.startRoom = roomC > i ? rooms[i] : RoomManager.getRandomRoomRecord(v => v.merchants.length > 0 && !v.isHomeOrHQ(), true, map(availClis, v => v.settings.startRoom)).roomName + "_0";
            queued.settings.proxy = 0;
            queued["isFresh"] = false;
            queued.selfDestruct();

            availClis.push(queued); // For randomiser thing up here ^
        }
    }

    /**
     * If passed undefined, it will pick a fresh one from the queue.
     * 
     * NOTE: PLEASE SET isFresh to false AND set initialised to false or self destruct ASAP, otherwise it will never be logged in unless manually called later.
     * 
     * Or throw in true for the 3rd parameter anyway
     */
    static loginQueue() : Client | false;
    static loginQueue(email: string, password: string, lazy?: boolean) : Client | false;
    static loginQueue(account: { email: string, pass: string }) : Client | false;
    static loginQueue(account?: string | { email: string, pass: string }, password?: string, lazy=false) {
        if (typeof account === "string") {
            account = { email: account, pass: password as string };
        }

        let proxiable:0|1|-1 = lazy ? -1 : 0;

        if (typeof account === "undefined") {
            const used = map(this.clients.concat(this.purgatory), v => v.user.username);

            let email = "", pass = "";

            for (let i = 0, len = this.appendages.length; i < len; i++) {
                const appendage = this.appendages[i];

                if (typeof appendage === "string") {
                    email = Config.edPuppetEmailBase + "+" + appendage + "@gmail.com";
                    pass = Config.edPuppetPass;
                } else {
                    proxiable = 1;

                    email = appendage[0];
                    pass = appendage[1];
                }

                if (findIndex(used, v => v === email) !== -1) continue;

                account = {
                    email, pass
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

        if (lazy) {
            client.selfDestruct();
            client.initialised = false;
            client.isFresh = false;
            client.settings.reconnectable = true;
            client.settings.proxy = -1;
        }

        // if (!proxiable) {
        client.settings.proxy = proxiable;
        // }

        this.purgatory.push(client);

        return client;
    }

    /**
     * This will start from id 20 and use all available clients
     */
    static async indexFactions() {
        // Commented out for now as I've added partial faction member
        // const facts = await DatabaseManager.helper.getFaction();
        const factIds:number[] = [1];//map(facts, v => v.id);

        let clis = filter(this.clis, v => v.settings.scalable && v.receiving);

        const lastId = factIds[factIds.length - 1];

        /**
         * Array which is a map of client index to their assigned faction ids.
         */
        const turns:Array<number[]> = [];

        let remainingIds = 0;

        for (let id = 20, c = 0; id < lastId; id++) {
            if (factIds.indexOf(id) !== -1) continue;

            if (c >= clis.length) c = 0;

            const cli = clis[c];

            turns[c] ??= [];

            if (cli.settings.mode !== ClientSettingsMode.ACTIVE) cli.settings.mode = ClientSettingsMode.ACTIVE;

            turns[c].push(id);

            c++;
            remainingIds++;
        }
        
        Logger.getLogger("Swarm").debug(`Ready to fetch ${remainingIds} factions with ${clis.length} clients.`);

        let cycle = 0;

        let loop = async () => {
            Logger.getLogger("Swarm").debug(`BEGIN: Cycle no. ${cycle} - ${turns.length} clients - ${turns[0].length} factions each.`);

            const proms:Promise<{ missing: number[]; timedout: number[]; }>[] = [];
    
            for (let i = 0, len = turns.length; i < len; i++) {
                proms.push(index(clis[i], turns[i]));
            };
    
            const res = await Promise.all(proms);

            let remaining:number[] = [];
            let timedout:number[] = [];

            for (let i = 0, len = res.length; i < len; i++) {
                if (res[i].missing.length !== 0) remaining = remaining.concat(res[i].missing);
                if (res[i].timedout.length !== 0) timedout = remaining.concat(res[i].timedout);

                clis[i].settings.mode = ClientSettingsMode.FREE;
            }
            
            Logger.getLogger("Swarm").debug(`END: Cycle no. ${cycle} - ${remaining.length} remaining, ${timedout.length} facts failed due to time outs.`);

            DatabaseManager.bulkInsert("faction", ["id", "name"], map(timedout, v => [v, "Missing Faction"]));

            if (remaining.length === 0) return true;

            clis = filter(this.clis, v => v.settings.scalable && v.receiving);

            if (clis.length === 0) return false;

            for (let i = 0, c = 0, len = remaining.length; i < len; i++) {
                const id = remaining[i];

                if (c >= clis.length) c = 0;

                const cli = clis[c];

                turns[c] ??= [];

                if (cli.settings.mode !== ClientSettingsMode.ACTIVE) cli.settings.mode = ClientSettingsMode.ACTIVE;

                turns[c].push(id);

                c++;
            }

            return loop();
        }

        return loop();
    }
}

// Not to be exported
async function index(cli: Client, fctIds: number[]) : Promise<{ missing: number[]; timedout: number[]; }> {
    let timedout = [];

    for (let attempt = 0, i = 0, len = fctIds.length; i < len; i++) {
        // In case the cli disconnects midway through

        if (!cli.connected) return { missing: fctIds.slice(i), timedout };

        const res = await cli.modules.FactionManager.getFaction(fctIds[i]);

        // If fails
        if (!res.success) {
            // It will attempt 3 times before skipping this faction
            if (++attempt > 2) {
                attempt = 0;
                timedout.push(fctIds[i]);
            } else i--;
        } else attempt = 0;

        await sleep(1500);
    }

    return { missing: [], timedout };
}

Swarm["init"]();