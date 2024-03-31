import { request } from "undici";
import Client from "../game/Proximus.js";
import User from "../game/User.js";
import { parseStringPromise } from "xml2js";
import { SwarmError } from "../util/errors/index.js";
import Server from "../game/Server.js";
import { SFSClientEvents } from "../types/events.js";
import { Requests } from "../game/Constants.js";
import Logger from "./logger.js";
import EDCycler from "../util/EDCycler.js";

export enum RestrictedMode {
    NONE = 0,
    SWARM_ONLY = 1,
    ALL = 2
}

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
     * This is a service that will cycle every interval when active, connecting new clients 
     */
    static cycler = new EDCycler(this);

    static get centralClient() {
        return this.clients[0];
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
                Logger.getLogger(`EpicDuel - ID ${client.settings.id}`).debug("Client not fully self destructed.");
                broke = true;
                break;
            }
        }

        if (!broke) Logger.getLogger(`EpicDuel - ID ${client.settings.id}`).debug("Client fully self destructed.");

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
     * This will return a new User object with session and stuff.
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

    static getClientById(id: number, fromPurgatoryToo:boolean) : Client | undefined;
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
                    if (this.clients[i].connected) return this.clients[i];
                    else continue;
                }
                if (this.purgatory[i].settings.id === id) return this.purgatory[i];
            }
        }

        return undefined;
    }
}

// Swarm["init"]();