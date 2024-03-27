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
}