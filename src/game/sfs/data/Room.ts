import Swarm from "../../../manager/epicduel.js";
import SwarmResources from "../../../util/game/SwarmResources.js";
import { find } from "../../../util/Misc.js";
import User from "./User.js";

type Variables = Record<string, string | number | boolean>;

export default class Room {
    id: number;
    name: string;
    maxSpectators: number;
    maxUsers: number;
    temp: boolean;
    game: boolean;
    priv: boolean;
    limbo: boolean;
    userCount: number;
    specCount: number;
    userList: Map<number, User>;
    variables: Variables;
    protected myPlayerIndex: number = 0;

    constructor(id: number, name: string, maxUsers: number, maxSpectators: number, isTemp: boolean, isGame: boolean, isPrivate: boolean, isLimbo: boolean, userCount = 0, specCount = 0) {
        this.id = id;
        this.name = name;
        this.maxSpectators = maxSpectators;
        this.maxUsers = maxUsers;
        this.temp = isTemp;
        this.game = isGame;
        this.priv = isPrivate;
        this.limbo = isLimbo;
        this.userCount = userCount;
        this.specCount = specCount;
        /**
         * @type {import("./User")[]}
         */
        this.userList = new Map();
        this.variables = {};
    }

    addUser(user: User) {
        this.userList.set(user.getId(), user);
        this.userCount++;
    }

    removeUser(sfsId: number) {
        if (this.userList.delete(sfsId)) {
            this.userCount--;
        }

        if (SwarmResources.botIds.get(sfsId) === true && Swarm.settings.hiatuses) this.leadingClientCharId;
    }

    getUserList() {
        return Array.from(this.userList.values());
    }

    getUser(sfsId: number) {
        return this.userList.get(sfsId) ?? null;
    }

    clearUserList() {
        this.userList.clear();
        this.userCount = 0;
        this.specCount = 0;
    }

    getVariable<T extends string|number|boolean = string|number|boolean>(varName: string) : T {
        return this.variables[varName] as T;
    }

    setVariables(o: Record<string, string | number | boolean | null>) {
        const keys = Object.keys(o);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i];
            const val = o[key];

            if (val === null) delete this.variables[key];
            else this.variables[key] = val;
            
        }
    }

    clearVariables() {
        this.variables = {};
    }
    
    getName()
    {
        return this.name;
    }
    
    getId()
    {
        return this.id;
    }
    
    isTemp()
    {
        return this.temp;
    }
    
    isGame()
    {
        return this.game;
    }
    
    isPrivate()
    {
        return this.priv;
    }
    
    getUserCount()
    {
        return this.userCount;
    }
    
    getSpectatorCount()
    {
        return this.specCount;
    }
    
    getMaxUsers()
    {
        return this.maxUsers;
    }
    
    getMaxSpectators()
    {
        return this.maxSpectators;
    }
    
    setMyPlayerIndex(id: number)
    {
        this.myPlayerIndex = id;
    }
    
    getMyPlayerIndex()
    {
        return this.myPlayerIndex;
    }
    
    setIsLimbo(b: boolean)
    {
        this.limbo = b;
    }
    
    isLimbo()
    {
        return this.limbo;
    }
    
    setUserCount(n: number)
    {
        this.userCount = n;
    }
    
    setSpectatorCount(n: number)
    {
        this.specCount = n;
    }
    
    get isBattle()
    {
        return (Number.parseInt(this.getVariable("type")) > 0)
    }
    
    get isHome()
    {
        return this.name.substring(0,5) == "HOME_";
    }
    
    get hasMediumPopulation()
    {
        return this.userCount >= 20;
    }
      
    get hasHighPopulation()
    {
        return this.userCount >= 30;
    }
    
    get isProbablyGiftingRoom()
    {
        return this.userCount >= 60;
    }

    prevLeaderId = -1;
    currLeaderId = -1;

    /**
     * This will be the first bot in the room. It will be their Client/Proximus instance.
     */
    get leadingClient() {
        const sfsId = this.leadingClientId;

        return sfsId ? find(Swarm.clis, v => v.smartFox.myUserId === sfsId) : undefined;
    }

    /**
     * This will be the first bot in the room. It will be their SFS id.
     */
    get leadingClientId() {
        const users = this.getUserList();
        const clis = [];
        let firstHit = false;

        for (let i = 0, len = users.length; i < len; i++) {
            if (users[i].isBot && SwarmResources.botIds.get(users[i].id) === true) {
                if (!firstHit) {
                    firstHit = true;

                    if (this.currLeaderId !== users[i].id) {
                        this.prevLeaderId = this.currLeaderId;
                    }

                    this.currLeaderId = users[i].id;
                }

                if (Swarm.settings.hiatuses === false) return users[i].id;

                clis.push(users[i]);
            }
        }

        if (clis.length === 0) return;

        for (let i = 0, len = clis.length; i < len; i++) {
            const cli = clis[i].getClient()?.smartFox;

            if (cli) {
                if (i === 0) {
                    // if it's already false, it would be devastating as it could clear buffer.
                    if (cli.bufferHiatus) cli.changeBufferHiatus(false);
                } else cli.changeBufferHiatus(true);
            }
        }

        return clis[0]?.id;
    }

    /**
     * This will be the first bot in the room. It will be their char ID.
     */
    get leadingClientCharId() {
        const users = this.getUserList();
        const clis = [];

        let firstHit = false;

        for (let i = 0, len = users.length; i < len; i++) {
            if (users[i].isBot && SwarmResources.botIds.get(users[i].id) === true) {
                if (!firstHit) {
                    firstHit = true;

                    if (this.currLeaderId !== users[i].id) {
                        this.prevLeaderId = this.currLeaderId;
                    }

                    this.currLeaderId = users[i].id;
                }

                if (Swarm.settings.hiatuses === false) return users[i].charId;

                clis.push(users[i]);
            }
        }

        if (clis.length === 0) return;

        for (let i = 0, len = clis.length; i < len; i++) {
            const cli = clis[i].getClient()?.smartFox;

            if (cli) {
                if (i === 0) {
                    // if it's already false, it would be devastating as it could clear buffer.
                    if (cli.bufferHiatus) cli.changeBufferHiatus(false);
                } else cli.changeBufferHiatus(true);
            }
        }

        return clis[0]?.charId;
    }

    getAllMods() {
        const users = this.getUserList();

        const mods:User[] = [];

        for (let i = 0, len = users.length; i < len; i++) {
            if (users[i].isModerator()) mods.push(users[i]);
        }

        return users;
    }
}