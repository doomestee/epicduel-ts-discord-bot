import SmartFoxClient from "./sfs/SFSClient.js";
import Constants, { Prices, Requests, Responses } from "./Constants.js";
import User from "./User.js";

import { SFSClientEvents } from "../types/events.js";
import { Variables } from "./sfs/data/User.js";

// Boxes
import AchievementBox from "./box/AchievementBox.js";
import CharacterInvBox from "./box/CharacterInvBox.js";
import ClassBox from "./box/ClassBox.js";
import HomeBox from "./box/HomeBox.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "./box/ItemBox.js";
import LegendaryCategorySBox from "./box/LegendaryBox.js";
import MerchantSBox from "./box/MerchantBox.js";
import MissionSBox from "./box/MissionBox.js";
import NewsSBox from "./box/NewsBox.js";
import SkillsSMBox from "./box/SkillsBox.js";
import StyleBox from "./box/StyleBox.js";
import VariumPackageSBox from "./box/VariumPackageBox.js";
import WarSMBox from "./box/WarBox.js";

// Modules
import Achievements from "./module/Achievements.js";
import Advent from "./module/Advent.js";
import BattlePass from "./module/BattlePass.js";
import Character from "./module/Character.js";
import Chat from "./module/Chat.js";
import Currency from "./module/Currency.js";
import Customize from "./module/Customize.js";
import FactionManager from "./module/FactionManager.js";
import Homes from "./module/Homes.js";
import Inventory from "./module/Inventory.js";
import MapModule from "./module/Map.js";
import Merchant from "./module/Merchant.js";
import StatsSkills from "./module/StatsSkills.js";
import UserVariableManager from "./module/UserVariableManager.js";
import WarManager from "./module/WarManager.js";
import RoomManager from "./module/RoomManager.js";
import AdminActionManager from "./module/AdminActionManager.js";
import Buddy from "./module/Buddy.js";
import Leader from "./module/Leader.js";
import MailManager from "./module/MailManager.js";
import ItemFinder from "./module/ItemFinder.js";

// Misc
import { RestrictedMode } from "../manager/epicduel.js";
import Swarm from "../manager/epicduel.js";
import Timer from "./Timer.js";
import ActiveChat from "./record/ActiveChat.js";
import UserRecord from "./record/UserRecord.js";
import InventoryListItem from "./record/inventory/InventoryListItem.js";
import MerchantRecord from "./record/MerchantRecord.js";
import Logger from "../manager/logger.js";
import Tournament from "./module/Tournament.js";
import { SwarmError } from "../util/errors/index.js";
import { WaitForResult, waitFor } from "../util/WaitStream.js";
import { IUserRecord } from "../Models/UserRecord.js";
import DatabaseManager from "../manager/database.js";
import { find } from "../util/Misc.js";

export interface ClientSettings {
    id: number;
    reconnectable: boolean;
    /**
     * This includes the world at the end if applicable!
     */
    startRoom: string;
    /**
     * If true, this will be used for whenever the bot gets called to scale, if there's no need then it may go to offline.
     */
    scalable: boolean;
}

export default class Client {
    settings: ClientSettings;

    protected isFresh = true;

    //#region yes

    version = "1.8.793";

    /**
     * Empty string if not logged in.
     */
    currVersion = "";

    readonly publishMode = Constants.PUBLISH_MODE_LIVE;

    // Last Update: 2024-03-27 (21:01)
    langVersion = 500;

    battleOver = true;
    battlePaused = false;

    _serverTime = 0;
    _serverClientTimeDiff = 0;

    public connected = false;
    public initialised = true;

    hasSentItemOnce = false;

    lobbyInit = false;

    storeRawData = false;
    rawdata = [] as any[];

    runningSince: number;

    connectedSince: number;

    smartFox: SmartFoxClient;
    
    active: { merchRecord: undefined; };
    selected: { character: {}; };

    modules = {
        "Achievements": new Achievements(this),
        "AdminActionManager": new AdminActionManager(this),
        "Advent": new Advent(this),
        "BattlePass": new BattlePass(this),
        "Buddy": new Buddy(this),
        "Character": new Character(this),
        "Chat": new Chat(this),
        "Customize": new Customize(this),
        "FactionManager": new FactionManager(this),
        "Homes": new Homes(this),
        "Inventory": new Inventory(this),
        "ItemFinder": new ItemFinder(this),
        "Leader": new Leader(this),
        "MailManager": new MailManager(this),
        "MapModule": new MapModule(this),
        "Merchant": new Merchant(this),
        "StatsSkills": new StatsSkills(this),
        "Tournament": new Tournament(this),
        "UserVariableManager": new UserVariableManager(this),
        "WarManager": new WarManager(this),
    };

    currency = new Currency(this);

    boxes = {
        "war": new WarSMBox(),
        "news": new NewsSBox(),
        "home": new HomeBox(),
        "item": new ItemSBox(),
        "style": new StyleBox(),
        "class": new ClassBox(),
        "skills": new SkillsSMBox(),
        "mission": new MissionSBox(),
        "merchant": new MerchantSBox(),
        "achievement": new AchievementBox(),
        "characterInv": new CharacterInvBox(),
        "promo": new VariumPackageSBox(),
        "legendary": new LegendaryCategorySBox()
    };

    restrictedMode: RestrictedMode = RestrictedMode.NONE;

    timer = {
        ping: new Timer(Constants.PING_INTERVAL, this.pingServer.bind(this))
    };

    famed: { [id: string]: boolean } = {};
    
    checkpoints = {
        comparison: [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]] as [number, number[]]
    }

    //#endregion

    constructor(public user: User, settings: Partial<ClientSettings> & { id: number } | number, public swarm: typeof Swarm) {
        if (typeof settings === "number") settings = { id: settings };

        this.settings = {
            id: settings["id"],
            reconnectable: settings["reconnectable"] ?? false,
            startRoom: settings["startRoom"] ?? RoomManager.TRAIN_HUB_RIGHT + "_0",
            scalable: false
        };

        //#region legacy dump

        // Custom V

        // /**
        //  * For NPCs.
        //  */
        // this.autoBattle = {
        //     /**
        //      * @type {boolean} When set to false, the next loop will stop.
        //      */
        //     mode: false,
        //     /**
        //      * @type {string|number} Name or ID of the NPC (the merchant, not the NpcId).
        //      */
        //     npc: null,
        //     /**
        //      * The amount of NPC wins left for the day before we can no longer get the reward.
        //      */
        //     left: -1
        // }

        // this.muteChat = false;
        // this.annoyFolk = false;

        // this.restrictedMode = false;

        // this.gifts = [];

        // this.user = user;
        // this.connected = false;
        //this.redeemed = [];

        // this.manager = manager;

        // /**
        //  * @type {{[index: string]: [number, Object[]]}}
        //  */
        // this.cache = {

        // };

        //#endregion

        // this.avatars = [];
        // this.cores = [];

        // if (!this.manager.standalone) {
        //     readdir("/data/avatars/").then((files) => {
        //         this.avatars = files;
        //     });

        //     readdir("/data/cores/").then((files) => {
        //         this.cores = files;
        //     });
        // }

        // /**
        //  * @type {{swords: string[]}}
        //  */
        // this.items = {};

        // if (!this.manager.standalone) {
        //     readdir("/data/swords").then((files) => {
        //         this.items.swords = files;
        //     })
        // }

        // this._battleLog = false;

        // this.battle = {
        //     /**
        //      * If need to reinitialise, use #reinitEPB
        //      * @type {import("../battle/EpicBattle")}
        //      */
        //     epbattle: null,
        //     /**
        //      * @type {[import("../battle/BattleActor"), import("../battle/BattleActor"), import("../battle/BattleActor"), import("../battle/BattleActor")]}
        //      */
        //     battleActors: [],
        //     battleModule: new BattleModule(this),
        //     /**
        //      * @type {[null, import("../battle/BattleTab"), import("../battle/BattleTab"), import("../battle/BattleTab"), import("../battle/BattleTab")]}
        //      */
        //     battleTabs: [],
        //     /**
        //      * @type {ActionButtonHolder} Three rows, with first having just 2 (strike/brace), the other two with 12 action buttons each, zero-based index, if there isn't an action button in place then that will be null.
        //      * 0 is Strike, 1 is Brace. 0 is Pri Passive, 1 is Pri Active, 2 is Gun, 3 is Gun Passive, 4 is Gun Active, 5 is Aux, 6 is Aux Passive, 7 is Aux Active, 8 is Bot Attack, 9 is Bot Special/Passive, 10 is Armor Passive, 11 is Armor Active. The rest are skills.
        //      */
        //     actionBtns: [[], [], []],
        //     BattleActionsModule: new BattleActionsModule(this),
        //     BattleOverModule: new BattleOverModule(this)
        // }

        // Custom ^

        this.runningSince = Date.now();
        this.connectedSince = 0;

        // this._localURL = 'https://epiduelstage.artix.com/';
        // this._baseURL = 'https://epicduelstage.artix.com/';
        // this._playURL = 'https://epicduel.artix.com/play-now/';

        // this.DEFAULT_COLOR_PALETTE = [];

        this.smartFox = new SmartFoxClient();//(this, (debugForSFS === undefined) ? debugMode : debugForSFS);
        this.smartFox.addListener("onAdminMessage",this.onAdminMessageHandler.bind(this));
        this.smartFox.addListener("onConnection",this.onConnectionHandler.bind(this));
        this.smartFox.addListener("onConnectionLost",this.onConnectionLostHandler.bind(this));
        this.smartFox.addListener("onCreateRoomError",this.onCreateRoomErrorHandler.bind(this));
        this.smartFox.addListener("onExtensionResponse",this.onExtensionResponseHandler.bind(this));
        this.smartFox.addListener("onJoinRoom",this.onJoinRoomHandler.bind(this));
        this.smartFox.addListener("onJoinRoomError",this.onJoinRoomErrorHandler.bind(this));
        this.smartFox.addListener("onModeratorMessage",this.onModeratorMessageHandler.bind(this));
        this.smartFox.addListener("onObjectReceived",this.onObjectReceivedHandler.bind(this));
        this.smartFox.addListener("onPublicMessage",this.onPublicMessageHandler.bind(this));
        this.smartFox.addListener("onPrivateMessage",this.onPrivateMessageHandler.bind(this));
        this.smartFox.addListener("onRandomKey",this.onRandomKeyHandler.bind(this));

        this.smartFox.addListener("onLogin",this.onLoginHandler.bind(this));
        //this.smartFox.addListener("onRoomAdded",this.emptyHandler);
        //this.smartFox.addListener("onRoomDeleted",this.emptyHandler);
        //this.smartFox.addListener("onRoomLeft",this.emptyHandler);
        //this.smartFox.addListener("onRoomListUpdate",this.emptyHandler);
        //this.smartFox.addListener("onRoomVariablesUpdate",this.emptyHandler);
        //this.smartFox.addListener("onUserCountChange",this.emptyHandler);
        this.smartFox.addListener("onUserEnterRoom",this.onUserEnterRoomHandler.bind(this));
        this.smartFox.addListener("onUserLeaveRoom",this.onUserLeaveRoomHandler.bind(this));
        //this.smartFox.addListener("onUserVariablesUpdate",this.emptyHandler);
        //this.addListener(Event.ADDED_TO_STAGE,this.onAddedToStage);

        // this.modules = {
        //     "Character": new Character(this),
        //     "RoomManager": RoomManager,
        //     "UserVariableManager": new UserVariableManager(this),
        //     "BattlePass": new BattlePass(this),
        //     "FactionManager": new FactionManager(this),
        //     "WarManager": new WarManager(this),
        //     "AdminActionManager": new AdminActionManager(this),
        //     "Achievements": new Achievements(this),
        //     "EpicBattleManager": new EpicBattleManager(this),
        //     "Inventory": new Inventory(this),
        //     "Homes": new Homes(this),
        //     "Merchant": new Merchant(this),
        //     "Buddy": new Buddy(this),
        //     "Chat": new ChatModule(this),
        //     "MailManager": new MailManager(this),
        //     "StatsSkills": new StatsSkills(this),
        //     "Map": new Map(this),
        //     "ItemFinder": new ItemFinder(this),
        //     "Advent": new Advent(this),
        //     "MissionManager": new MissionManager(this),
        //     "Customize": new Customize(this),
        //     //"EnvironmentObjects": new EnvironmentObjects(this)
        // };

        // this.currency = new Currency(this);

        // this.boxes = {
        //     "war": new WarSMBox(),
        //     "news": new NewsSBox(),
        //     "home": new HomeBox(),
        //     "item": new ItemSBox(),
        //     "style": new StyleBox(),
        //     "class": new ClassBox(),
        //     "skills": new SkillsSMBox(),
        //     "mission": new MissionSBox(),
        //     "merchant": new MerchantSBox(),
        //     "achievement": new AchievementBox(),
        //     "characterInv": new CharacterInvBox(),
        //     "promo": new VariumPackageSBox(),
        //     "legendary": new LegendaryCategorySBox()
        // } satisfies Boxes;

        this.active = {
            merchRecord: undefined
        };
        
        this.selected = {
            character: {

            }
        }
    }

    private init() {
        if (this.initialised) throw Error("The client#initialised has to be false to use.");

        this.modules = {
            "Achievements": new Achievements(this),
            "AdminActionManager": new AdminActionManager(this),
            "Advent": new Advent(this),
            "BattlePass": new BattlePass(this),
            "Buddy": new Buddy(this),
            "Character": new Character(this),
            "Chat": new Chat(this),
            "Customize": new Customize(this),
            "FactionManager": new FactionManager(this),
            "Homes": new Homes(this),
            "Inventory": new Inventory(this),
            "ItemFinder": new ItemFinder(this),
            "Leader": new Leader(this),
            "MailManager": new MailManager(this),
            "MapModule": new MapModule(this),
            "Merchant": new Merchant(this),
            "StatsSkills": new StatsSkills(this),
            "Tournament": new Tournament(this),
            "UserVariableManager": new UserVariableManager(this),
            "WarManager": new WarManager(this),
        };
    
        // currency = new Currency(this);
    
        this.boxes = {
            "war": new WarSMBox(),
            "news": new NewsSBox(),
            "home": new HomeBox(),
            "item": new ItemSBox(),
            "style": new StyleBox(),
            "class": new ClassBox(),
            "skills": new SkillsSMBox(),
            "mission": new MissionSBox(),
            "merchant": new MerchantSBox(),
            "achievement": new AchievementBox(),
            "characterInv": new CharacterInvBox(),
            "promo": new VariumPackageSBox(),
            "legendary": new LegendaryCategorySBox()
        };

        if (!(this.timer && this.timer.ping)) {
            this.timer = {
                ping: new Timer(Constants.PING_INTERVAL, this.pingServer.bind(this))
            };
        }

        this.smartFox = new SmartFoxClient();//(this, (debugForSFS === undefined) ? debugMode : debugForSFS);
        this.smartFox.addListener("onAdminMessage",this.onAdminMessageHandler.bind(this));
        this.smartFox.addListener("onConnection",this.onConnectionHandler.bind(this));
        this.smartFox.addListener("onConnectionLost",this.onConnectionLostHandler.bind(this));
        this.smartFox.addListener("onCreateRoomError",this.onCreateRoomErrorHandler.bind(this));
        this.smartFox.addListener("onExtensionResponse",this.onExtensionResponseHandler.bind(this));
        this.smartFox.addListener("onJoinRoom",this.onJoinRoomHandler.bind(this));
        this.smartFox.addListener("onJoinRoomError",this.onJoinRoomErrorHandler.bind(this));
        this.smartFox.addListener("onModeratorMessage",this.onModeratorMessageHandler.bind(this));
        this.smartFox.addListener("onObjectReceived",this.onObjectReceivedHandler.bind(this));
        this.smartFox.addListener("onPublicMessage",this.onPublicMessageHandler.bind(this));
        this.smartFox.addListener("onPrivateMessage",this.onPrivateMessageHandler.bind(this));
        this.smartFox.addListener("onRandomKey",this.onRandomKeyHandler.bind(this));

        this.smartFox.addListener("onLogin",this.onLoginHandler.bind(this));
        //this.smartFox.addListener("onRoomAdded",this.emptyHandler);
        //this.smartFox.addListener("onRoomDeleted",this.emptyHandler);
        //this.smartFox.addListener("onRoomLeft",this.emptyHandler);
        //this.smartFox.addListener("onRoomListUpdate",this.emptyHandler);
        //this.smartFox.addListener("onRoomVariablesUpdate",this.emptyHandler);
        //this.smartFox.addListener("onUserCountChange",this.emptyHandler);
        this.smartFox.addListener("onUserEnterRoom",this.onUserEnterRoomHandler.bind(this));
        this.smartFox.addListener("onUserLeaveRoom",this.onUserLeaveRoomHandler.bind(this));

        this.smartFox.once("onConnection", Swarm.onConnection.bind({ client: this, swarm: Swarm }));
        this.smartFox.once("onConnectionLost", Swarm.onConnectionLost.bind({ client: this, swarm: Swarm }));
        //this.smartFox.addListener("onUserVariablesUpdate",this.emptyHandler);
        //this.addListener(Event.ADDED_TO_STAGE,this.onAddedToStage);

        this.initialised = true;
    }

    /**
     * THIS IS ONLY FOR THE SWARM TO CALL.
     */
    protected connect() {
        if (!this.initialised) throw Error("The client's not initialised!");
        if (this.connected) throw Error("The client's still connected!");

        if (!this.user.servers.length) throw new SwarmError("NO_SERVER", "There are no servers available to join?");

        const server = this.user.servers.find(v => v.online);

        if (!server) throw new SwarmError("NO_SERVER", "None of the servers available are online.");

        this.smartFox.connect(server.ip, server.port);
        return true;
    }

    async initialise() {
        if (this.initialised) throw Error("The client's already initialised.");
        if (this.connected) throw Error("The client's still connected!");

        // If not done already.
        this.selfDestruct(true);

        await this.regenerate();

        this.init();

        return true;
    }

    private async regenerate() {
        if (this.connected) throw Error("The client's still connected!");
        if (Object.keys(this.modules).length) throw Error("The client hasn't been self destructed!");

        const newUser = await this.swarm["login"](this.user.username, this.user.password);

        return this.user.regenerate(newUser);
    }

    //#region Timers

    pingServer() {
        if (this.connectedSince && ((this.connectedSince + (86400000)) < Date.now())) {
            // After 24 hours, the bot will have to disconnect because I don't trust the server.

            this.smartFox.disconnect();
            // this.manager.destroy(true, true);
        }
        else this.smartFox.sendXtMessage("main", Requests.REQUEST_PING, {}, 3, SmartFoxClient.XTMSG_TYPE_JSON);
    }

    // stopAFK_Timers(shutThemUp=false) {
    //     this.timer.afk.stop(!shutThemUp);
    //     this.timer.afkDisconnect.stop(!shutThemUp);
    // }

    //#endregion

    endAFK() {
        const [uVars, myUser] = [{}, this.getMyUser()];
        // this.stopAFK_Timers();

        if (myUser != null) {
            if (myUser.afk) return;

            this.setVars("afk", { afk: false });
        } 
    }

    goAFK() {
        const [uVars, myUser] = [{}, this.getMyUser()];

        if (myUser != null) {
            if (myUser.afk) return;

            this.setVars("afk", { afk: true });
        }
    }

    setVars(eCmd: string, uVars: { [x: string]: any }, overRoom=null) {
        const fromRoom = overRoom != null ? overRoom : this.smartFox.getActiveRoom();
        const user = fromRoom?.getUser(this.smartFox.myUserId);

        if (user != null) {
            user.setVariables(uVars);
            uVars.eCmd = eCmd;

            this.smartFox.sendXtMessage("main", Requests.REQUEST_SET_USER_VARIABLES, uVars, 3, SmartFoxClient.XTMSG_TYPE_XML);
        }
    }

    getMyUser() {
        if (this.smartFox.getActiveRoom() == null) return null;
        return this.smartFox.getActiveRoom()?.getUser(this.smartFox.myUserId) ?? null;
    }

    /**
     * Fr fr, this will throw error instead of null anyways.
     */
    getMyUserFr() {
        if (this.smartFox.getActiveRoom() == null) throw Error("No active room.");

        const user = this.smartFox.getActiveRoom()?.getUser(this.smartFox.myUserId);

        if (user == null) throw Error("No user.")

        return user;
    }

    startGameCheck() {
        if (this.boxes.item.ready && !this.hasSentItemOnce) {
            this.hasSentItemOnce = true;
            
            this.swarm.execute("onComparisonUpdate", this, { part: 1, type: 1 });
        }

        if (!this.user.gameStarted) {
            this.getCharacterList();
            this.startGame();
        }
    }

    startGame() {
        this.user.gameStarted = true;

        // blah blah
        this.play();
    }

    play() {
        if (this.user._startRoom != "") {
            const startRoomName = this.user._startRoom;

            if (this.restrictedMode) {// || this.manager.standalone) {
                this.joinRoom(RoomManager.TRAIN_HUB_RIGHT + "_7");
                //this.joinRoom()
            } else 
            //const roomCoords = RoomManager.getRoomJumpCoordinates(startRoomName);

            //if (RoomManager.roomIsHome(startRoomName)) {

            //} else {
                this.joinRoom(this.settings.startRoom);
            //}
        }
    }

    getUserBySfsUserId(userId: number) {
        return this.smartFox.getActiveRoom()?.getUser(userId) ?? null;
    }

    //getCharacterByUserId(userId=0) {
    //    const player = this.
    //}

    getCharacterData(charId: number) {
        this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_CHARACTER, { charId }, 1, SmartFoxClient.XTMSG_TYPE_JSON);
    }

    getCharacterList() {
        this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_CHARACTER_LIST, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
    }

    //#region Event Handlers

    onAdminMessageHandler(evt: SFSClientEvents["onAdminMessage"][0]) {
        const msgText = evt.message;

        if(msgText == "Watch the language!" || msgText == "You\'re being booted for language!" || msgText == "You\'re being banned for language!" || msgText == "You have been warned for flooding!" || msgText == "You\'re being booted for flooding!" || msgText == "You\'re being banned for flooding!") {
            // this.debug(evt);
            //client.timer.flood.start();
        }
    }

    onModeratorMessageHandler(evt: SFSClientEvents["onModeratorMessage"][0]) {
        const modCode = Number(evt.message);
        // this.debug("Warned by a malderator for: " + modCode);
    }

    onConnectionHandler(evt: SFSClientEvents["onConnection"][0]) {
        if (evt.success) {
            this.smartFox.getRandomKey();
            this.connected = true;
            this.isFresh = false;

            this.connectedSince = Date.now();
        }

        // if (this.manager.langReset === true) {
        //     this.manager.langReset = false;
        //     loop(this.manager.langVersion, this.manager, this.manager._logger).then((v) => {
        //         // nothing. languages file reset after the update.
        //     });
        // }
    }

    onConnectionLostHandler(evt: SFSClientEvents["onConnectionLost"][0]) {
        console.log("Connection Lost!");

        // if (evt.discParams != null) {

        // }

        //console.log(evt);
        //console.log(this);
        // if (/*discParams*/ evt.params && evt.params != null) {
        //     const discParams = evt.params.discParams;
        //     if (discParams && discParams.msg != "" && discParams.durationMS > 0) {
        //         this.debug(discParams.msg, discParams.durationMS);
        //     } //if (discParams.reconnect) {
        //         //this.debug("Connection Lost - Reconnecting...");
        //         this.connectionLost(false);
        //     //} return;
        //     return;
        // } this.connectionLost(false);

    }

    onCreateRoomErrorHandler(evt: SFSClientEvents["onCreateRoomError"][0]) {
        Logger.getLoggerP(this.settings.id).debug("Errored trying to create a room; " + evt.error);
        // this.manager._logger.error("Errored trying to create a room...?");
        // this.manager._logger.error(evt.params.error);
    }

    /**
     * This is such an abominable, and the decompileld code is awful too so... 
     * 
     * but yes i should prob make a file or smth just for extension response
     */
    onExtensionResponseHandler(evt: SFSClientEvents["onExtensionResponse"][0]) {
        const [type, dataObj] = [evt.type, evt.dataObj];
        const [cmd] = [dataObj._cmd as Responses | Requests];

        // if (this.storeRawData) {
        //     console.log("RawData Count: " + this.rawdata.push(dataObj));
        // }

        if (type === SmartFoxClient.XTMSG_TYPE_XML) {
            switch (cmd) {
                case Responses.RESPONSE_GET_POLL:
                    // TODO: poll, which is very old and ED doesn't use but idk
                    break;
                case Responses.RESPONSE_GET_POLL_TITLE:
                    break;
                case Responses.RESPONSE_SUBMIT_CODE:
                    this.smartFox.emit('redeem_code', {
                        ok: dataObj.ok,
                        prizeList: dataObj.prizeList,
                    });
                    break;
                case Requests.REQUEST_GET_FACTION_NOTES:
                    break;
                case Responses.RESPONSE_GET_MERCHANT_INVENTORY_ALL:
                    this.boxes.item.merchantInvList = dataObj.all;
                    break;
                case Requests.REQUEST_SET_USER_VARIABLES:
                    this.modules.UserVariableManager.handleVariables(dataObj);
                    break;
                case Responses.RESPONSE_LOGIN_OK:
                    if (dataObj.ver !== this.version) this.currVersion = dataObj.ver; // TODO: idk
                    if (this.swarm.resources.gameVersion !== this.currVersion) {
                        this.swarm.resources.gameVersion = this.currVersion;
                        this.swarm.resources.clear();

                        this.swarm.probing = false; // Game is alive.
                        // this.swarm.resources["getLang"]();
                    }

                    this.smartFox.myUserId = dataObj.userId;
                    this.smartFox.myUserName = dataObj.name;
                    // this.smartFox.activeServer.name = dataObj.serverName;

                    this.joinRoom("Lobby");
                    break;
                case Responses.RESPONSE_LOGIN_FAIL:
                    // this.debug(dataObj);
                    console.log(dataObj);

                    break;
                // case Requests.BATTLE_REQUEST_CANCEL_BATTLE:
                //     EpicBattle.handleCancelBattle(dataObj, this);
                //     break;
                // case Responses.BATTLE_RESPONSE_CANCEL_ACTION:
                //     this.user._myBattleActor._inAction = false;
                //     break;
                // case Responses.BATTLE_RESPONSE_TOGGLE_PAUSE:
                //     this.battlePaused = !this.battlePaused;

                //     if(!this.battlePaused) {
                //         this.modules.EpicBattleManager.timer.turn.start();
                //         // TODO: prompt for action!
                //     } else {
                //         this.modules.EpicBattleManager.timer.turn.stop("ABC");
                //         // TODO: says that the battle's been paused.
                //     }
                    break;
                case Responses.RESPONSE_BAN_FAIL: case Responses.RESPONSE_BAN_OK: case Responses.RESPONSE_UNBAN_OK:
                //     // what
                    break;
                case Responses.RESPONSE_NAME_NOT_FOUND: case Responses.RESPONSE_WARN_OK:
                    // idk
                    break;
                case Requests.REQUEST_GET_CHARACTER:
                    this.modules.Character.handleGetCharacter(dataObj);
                    break;
                case Requests.REQUEST_GET_CHARACTER_LIST:
                    Logger.getLoggerP(this).debug("Received character list.");

                    this.modules.Character.characterListAvailable(dataObj.chars);
                    // CHARACTERERERER!
                    break;
                case Responses.RESPONSE_ADD_CHARACTER_OK: case Responses.RESPONSE_ADD_CHARACTER_FAIL:
                    break;
                // case Responses.BATTLE_RESPONSE_START:
                //     EpicBattle.handleBattleStart(dataObj, this);
                //     break;
                // case Responses.BATTLE_RESPONSE_TIMED_OUT:
                //     this.modules.EpicBattleManager.activeBtn = this.battle.actionBtns[0][1];
                //     EpicBattle.handleTimeOut(dataObj, this);
                //     break;
                // case Responses.BATTLE_RESPONSE_NEXT_TURN:
                //     this.modules.EpicBattleManager.handleNextTurn(dataObj);
                //     break;
                // case Responses.BATTLE_RESPONSE_OVER:
                //     this.battle.BattleOverModule.handleBattleOver(dataObj);
                //     break;
                // case Responses.BATTLE_RESPONSE_COMMAND:
                //     this.modules.EpicBattleManager.handleBattleAction(dataObj);
                //     break;
                // case Responses.BATTLE_RESPONSE_CORE_QTY:
                //     this.modules.EpicBattleManager.handleCoreQtyUpdate(dataObj);
                //     break;
                case Requests.REQUEST_UPDATE_STATS_SKILLS:
                    let cwick = parseInt(dataObj.c);

                    if (cwick > -1) {
                        this.modules.Inventory.removeInventoryItems(cwick);
                        this.currency.credits += Prices.getRetrainPrice(this.getMyUserFr().charLvl);
                    }

                    this.user._levelingUp = false;
                    break;
                case Responses.RESPONSE_UPDATE_STATS_SKILLS_FAIL:
                    this.user._levelingUp = false;
                    console.log("failed updating stats skills");
                    break;
                // case Requests.REQUEST_RUN_CHECK:
                //     EpicBattle.handleRunCheck(dataObj, this);
                //     break;
                // case Requests.REQUEST_NPC_CHALLENGE_CHECK:
                //     EpicBattle.handleNpcChallengeCheck(dataObj, this);
                //     break;
                // case Requests.REQUEST_CHALLENGE_CHECK:
                //     EpicBattle.handleChallengeCheck(dataObj, this);
                //     break;
                case Requests.REQUEST_CREATE_REPORT:
                    break;
                case Requests.REQUEST_SELL_ITEM:
                    // TODO: sell item (bonus ig)
                    break;
                case Responses.RESPONSE_SELL_ITEM_FAIL:
                    break;
                case Requests.REQUEST_BUY_HOME:
                    this.modules.Homes.buyHomeComplete(dataObj);
                    break;
                case Requests.REQUEST_BUY_ITEM: case Responses.RESPONSE_SPEND_POINTS: case Requests.REQUEST_COMPLETE_MISSION:
                    break;
                default:
                    Logger.getLoggerP(this.settings.id).debug("Unknown response; ", dataObj);
                    // this.manager._logger.error("Unknown response: " + dataObj);
                    break;
            }
        } else if (type === SmartFoxClient.XTMSG_TYPE_JSON) {
            switch (cmd) {
                case Responses.RESPONSE_GET_BATTLEPASS:
                    this.modules.BattlePass.handleInitServerResponse(dataObj);
                    break;
                case Responses.RESPONSE_GET_BATTLEPASS_CHALLENGES:
                    this.modules.BattlePass.handleChallengesServerResponse(dataObj);
                    break;
                case Responses.RESPONSE_BATTLEPASS_CHALLENGES_UPDATE:
                    //this.modules.BattlePass.handleChallengeUpdate(dataObj);
                    break;
                case Responses.RESPONSE_GET_BATTLEPASS_XP:
                    this.modules.BattlePass.handleServerResponse(dataObj);
                    break;
                case Requests.REQUEST_OPEN_ALL_GIFTS:
                    if (!dataObj.success) console.log("Failed to open gifts.");
                    else {
                        this.currency.credits += Number(dataObj.prizes.credits);

                        // this.cache['prizes'] = dataObj.prizes;

                        for (let itemX of dataObj.prizes.items) {
                            let item = this.boxes.item.getItemById(itemX[1]);

                            if (!item) continue;

                            if (item.isMissionItemRecord() || item.isCoreItemRecord()) {//.itemCat == ItemSBox.ITEM_CATEGORY_MISSION_ID || item.itemCat == ItemSBox.ITEM_CATEGORY_CORE_ID) {
                                this.modules.Inventory.addItemsFromServer(Number(itemX[0]), item.itemId, 1, 0, 0, 2000);
                            } else this.modules.Inventory.addItemFromServer(Number(itemX[0]), item.itemId, true, 2000, 0, 0, "corePassiveItemId" in item ? item.corePassiveItemId : 0, "coreActiveItemId" in item ? item.coreActiveItemId : 0, 0);
                        }

                        console.log("Opened " + dataObj.opened + " Gifts!\nReceived " + dataObj.prizes.credits + " Credits.\nReceived " + dataObj.prizes.items.length + " Items & " + dataObj.prizes.houseitems + " House Items");
                    }
                    break;
                case Requests.REQUEST_ADD_MSG_TO_BOARD:
                    break;
                // i can't believe im doing this :moyai:
                // case Responses.RESPONSE_ALLY_IS_READY:
                //     console.log("Ally is ready for boss.");
                //     console.log(dataObj);
                //     this.stopAFK_Timers();
                //     this.battle.epbattle = new EpicBattle(this, { battleType: Constants.BATTLE_TYPE_2V1_BOSS_USER, counts: false, reward: false, targetUserId: dataObj.merchId });
                // case Responses.RESPONSE_BATTLE_ALLY_READY:
                //     console.log("Ally is ready for 2v2.");
                //     console.log(dataObj);
                //     //this.stopAFK_Timers();
                //     //this.battle.epbattle = new EpicBattle(this, { battleType: Constants.BATTLE_TYPE_2V2_AUTO });
                // case Responses.RESPONSE_BATTLE_ALLY_FAIL:
                //     //AllyWaitModule.instance.closeModule(); all this does is remove the UI screen for "waiting for ally";
                //     console.log("Battle Ally Failed");
                // case Responses.RESPONSE_WAIT_FOR_ALLY:
                //     //AllyWaitModule.instance.openModule(); all this does is add the UI screen for "waiting for ally";
                //     break;
                case Requests.REQUEST_ALLY_CONFIRM:
                    if (this.user._allyCharId != -1) this.modules.Buddy.friendStatusChange(this.user._allyCharId, true, this.user._allySfsId, false);
                    console.log(dataObj);
                    this.modules.Buddy.friendStatusChange(parseInt(dataObj.charId), true, parseInt(dataObj.sfsId), true);
                    break;
                case Responses.RESPONSE_ALLY_UNLINK:
                    console.log(dataObj);
                    this.modules.Buddy.friendStatusChange(parseInt(dataObj.charId), true, parseInt(dataObj.sfsId), false);
                    break;
                case Requests.REQUEST_ALLY_REQUEST:
                    // senderId is sfs user id
                    console.log(dataObj.charName + " [" + dataObj.senderId + "] has attempted to request for an ally link.");

                    // if (this.manager.allyAccepts.includes(dataObj.charName.toLowerCase())) {
                    //     setTimeout(() => {
                    //         this.smartFox.sendXtMessage("main", Requests.REQUEST_ALLY_CONFIRM, { targetId: dataObj.senderId}, 2, "json");
                    //     }, 2000 + (Math.random()*2000));
                    // }
                    break;
                case Requests.REQUEST_GET_MERCHANT_INVENTORY:
                    this.modules.Merchant.merchantInventoryAvailable(dataObj);
                    break;
                case Requests.REQUEST_PM_REQUEST:
                    // { charName: string, senderId: number, _cmd: 'r77' }
                    this.modules.Chat.acceptDialogue(dataObj.senderId, dataObj.charName);
                    break;
                case Responses.RESPONSE_PM_FAIL:
                    switch (dataObj.err) {
                        case 1: console.log(this.swarm.languages["DYN_chat_err_pmOffline"]); break;
                        case 2: console.log(this.swarm.languages["DYN_buddy_err_justLoggedIn"]); break;
                        case 3: console.log("This user has activated Do Not Disturb mode!"); break;
                        default: console.log("Unknown error for PM fail"); console.log(dataObj); break;
                    }
                    break;
                case Requests.REQUEST_PM_CONFIRM:
                    console.log(dataObj);
                    if (!this.modules.Chat.list.some(v => v.charName === dataObj.charName)) {
                        console.log("pass");
                        let loc22 = new ActiveChat(dataObj.charName, dataObj.senderId, this.modules.Chat);
                        this.modules.Chat.list.push(loc22);
                    } else console.log("not pass;")
                    break;
                case Requests.REQUEST_PM_CANCEL:
                    for (let a = 0; a < this.modules.Chat.list.length; a++) {
                        if (this.modules.Chat.list[a].userId !== dataObj.senderId) continue;
                        delete this.modules.Chat.list[a].module;
                        delete this.modules.Chat.list[a];
                    }

                    this.modules.Chat.list = this.modules.Chat.list.filter(v => v);
                    break;
                case Responses.RESPONSE_ISSUE_CHAT_BLOCK:
                    // idk
                    break;
                case Responses.RESPONSE_CHAT_BLOCK_OK: case Responses.RESPONSE_MOD_NOTE_OK:
                    break;
                default:
                    Logger.getLoggerP(this.settings.id).debug(dataObj);
                    console.debug(dataObj);
                    // this.manager._logger.error("Unknown response: " + dataObj);
                    break;
            }
        } else if (type === SmartFoxClient.XTMSG_TYPE_STR) {
            switch (dataObj[0]) {
                case Responses.RESPONSE_INIT_BATTLEPASS:
                    // this.OMG_GAMEMODE_ENABLED = Boolean(dataObj[2]);
                    this.modules.Tournament.request("details");
                    this.modules.BattlePass.active = Boolean(dataObj[3]);
                    if (this.modules.BattlePass.active) {
                        this.modules.BattlePass.name = String(dataObj[4]);
                        this.modules.BattlePass.openModule();
                    }
                    // this.modules.ItemFinder.initModule();
                    break;
                case Responses.RESPONSE_POLL_VOTE: case Responses.RESPONSE_GET_POLL_RESULTS:
                    break;
                case Responses.RESPONSE_ADMIN_ACTION:
                    this.modules.AdminActionManager.processAction(dataObj);
                    break;
                case Responses.RESPONSE_ADVENT_CLAIM_STATUS:
                    console.log("oCk");
                case Requests.REQUEST_CLAIM_ADVENT_PRESENT:
                    console.log(dataObj);

                    if (dataObj[2] === "-1") return console.log("The gifting has ended, can't claim advent present.");

                    if (dataObj[2] === "1"  && dataObj.length > 3) console.log("Successfully claimed daily advent present; prize %i, value %i, %i credits", dataObj[3], dataObj[4], dataObj[5]);
                    else console.log("Not able to claim daily advent present, you may have to wait tomorrow.");

                    // this.smartFox.emit("advent_gift", dataObj[2] !== "1" ? { status: parseInt(dataObj[2]) } : { status: parseInt(dataObj[2]), prize: parseInt(dataObj[3]), value: parseInt(dataObj[4]), credits: parseInt(dataObj[5]) });

                    break;
                case Responses.RESPONSE_GET_USER:
                    let obj = this.user.userRecord = new UserRecord({
                        userId: dataObj[2],
                        userPriv: dataObj[3],
                        userActive: dataObj[4],
                        userLoginCount: dataObj[5]
                    });

                    this.user.userPriv = obj.userPriv;
                    // this.user.userActive = obj.userActive;
                    // this.user.userLoginCount = obj.userLoginCount;
                    this.user.userid = obj.userId;
                    break;
                case Responses.RESPONSE_SERVER_TIME:
                    this._serverTime = Number(dataObj[2]) - (Date.now() - this.runningSince);
                    this._serverClientTimeDiff = (240 - new Date().getTimezoneOffset()) * 60000;
                    break;
                case Requests.REQUEST_MOVE:
                    // TODO: when players move (not us though)
                    break;
                case Requests.REQUEST_GET_FACTION_DATA:
                    this.modules.FactionManager.factionDataAvailable(dataObj);
                    // TODO: faction data  
                    break;
                case Requests.REQUEST_GET_MY_HOMES:
                    let _loc30_ = dataObj.slice(2);

                    this.modules.Homes.homeDataAvailable(_loc30_, this.getMyUserFr().charId, this.getMyUserFr().charName);
                    break;
                case Requests.REQUEST_GET_CHARACTER_HOMES:
                    if (Number(dataObj[2]) != 0) {
                        this.modules.Homes.homeDataAvailable(dataObj.slice(4), parseInt(dataObj[3]), dataObj[2])
                    } else {
                        console.log("Failed fetching home data for " + dataObj[3]);
                        //this.modules.Homes.homeDataFail(dataObj[3]);
                    }
                    break;
                case Responses.RESPONSE_SEND_CLIENT_REQUIREMENTS:
                    if (this.boxes.skills.populate("clientRequirements", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 12 });// === true && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 12);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_IMPROVE_RULES:
                    if (this.boxes.skills.populate("improveRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 11 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 11);
                    this.startGameCheck();
                    break; 
                case Responses.RESPONSE_SEND_SKILLS_ACTIVE_ATTACK_RULES:
                    if (this.boxes.skills.populate("activeAttackRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 5 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 5);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_ACTIVE_TARGET_RULES:
                    if (this.boxes.skills.populate("activeTargetRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 7 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 7);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_PASSIVE_STAT_RULES:
                    if (this.boxes.skills.populate("passiveStatRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 10 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 10);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_PASSIVE_MISC_RULES:
                    if (this.boxes.skills.populate("passiveMiscRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 9 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 9);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_ACTIVE_MISC_RULES:
                    if (this.boxes.skills.populate("activeMiscRules", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 6 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 6);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_ACTIVE:
                    if (this.boxes.skills.populate("active", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 4 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 4);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_SKILLS_PASSIVE: 
                    if (this.boxes.skills.populate("passive", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 8 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 8);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_SEND_CORES:
                    if (this.boxes.skills.populate("core", dataObj.slice(2)) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 13 });// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 13);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_ITEMS:
                    this.boxes.item.populate(1, dataObj);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_ITEMS_2:
                    this.boxes.item.populate(2, dataObj);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_ITEMS_3:
                    this.boxes.item.populate(3, dataObj);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_ITEMS_4:
                    this.boxes.item.populate(4, dataObj);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_ALL_ACHIEVEMENTS:
                    this.boxes.achievement.populate(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_ALL_NEWS:
                    this.boxes.news.populate(dataObj.slice(2));
                    this.startGameCheck();
                    // TODO: news (although idk)
                    break;
                case Responses.RESPONSE_GET_ALL_MISSIONS:
                    this.boxes.mission.populate("self", dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_ALL_MISSION_GROUPS:
                    this.boxes.mission.populate("group", dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_CLASSES:
                    this.boxes.class.populate(dataObj.slice(2));
                    break; // welp, so it did happen lmao ~~//lol~~
                case Responses.RESPONSE_GET_HOMES:
                    this.boxes.home.populate(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_STYLES:
                    this.boxes.style.populate(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_ALL_VARIUM_PACKAGES:
                    this.boxes.promo.populate(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_MERCHANTS:
                    this.boxes.merchant.populate(dataObj.slice(2));
                    break; // TODO: merchants
                case Responses.RESPONSE_GET_SKILLS:
                    const skillData = dataObj.slice(2);
                    const allSkillData = skillData.slice(skillData.indexOf("$") + 1, skillData.indexOf("#"));
                    const skillTreeData = skillData.slice(skillData.indexOf("#") + 1);

                    if (this.boxes.skills.populate("all", allSkillData) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 2 });//true;// && !this.manager.standalone)   this.manager.discord.emit("epicduel_epicduel_comparison", 1, 2);
                    if (this.boxes.skills.populate("tree", skillTreeData) === true) this.swarm.execute("onComparisonUpdate", this, { type: 1, part: 3 });//true;// && !this.manager.standalone) this.manager.discord.emit("epicduel_epicduel_comparison", 1, 3);

                    this.startGameCheck();
                    break; // ironic
                case Responses.RESPONSE_GET_ALL_ARCADE_GAMES: case Responses.RESPONSE_GET_ALL_ARCADE_PRIZES:
                    break;
                case Responses.RESPONSE_UPDATE_FACTION_TITLE: case Requests.REQUEST_CHANGE_FACTION_RANK: case Requests.REQUEST_REMOVE_FACTION_MEMBER: case Requests.REQUEST_REMOVE_NOTE:
                    break; // This is for managing faction so no.
                case Responses.RESPONSE_FACTION_MEMBER_LEFT: case Responses.RESPONSE_FACTION_INVITE_ACCEPTED: case Requests.REQUEST_FACTION_RECRUIT:
                    break;
                case Requests.REQUEST_BUDDY_SONAR:
                    if (dataObj[2] == -1) console.log("User has activated DND mode.");
                    else console.log(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_FACTION_FULL: case Responses.RESPONSE_FACTION_WAIT: case Responses.RESPONSE_CREATE_FACTION_FAIL: case Responses.RESPONSE_CREATE_FACTION_OK:
                    break;
                case Responses.RESPONSE_CREATE_BATTLE_FAIL:
                    break;
                case Requests.REQUEST_GET_LEADERS:
                    this.modules.Leader.leaderDataAvailable(dataObj);
                    // this.smartFox.emit('get_leaders', ...dataObj); // i hate myself for spreading this

                    // TODO: leaderboard
                    break;
                case Requests.REQUEST_GET_PLAYER_ACHIEVEMENTS:
                    this.modules.Achievements.achievementDataReceived(dataObj);
                    break;
                case Requests.REQUEST_GET_USER_RECORD:
                    // if (!this.manager.standalone) {
                    const rec:Omit<IUserRecord, "char_id"> = {
                        last_fetched: new Date(),
                        // b1: parseInt(dataObj[3]),
                        // b2: parseInt(dataObj[4]),
                        w1: parseInt(dataObj[5]),
                        l1: parseInt(dataObj[3]) - parseInt(dataObj[5]),

                        w2: parseInt(dataObj[6]),
                        l2: parseInt(dataObj[4]) - parseInt(dataObj[6]),
                        // bj: parseInt(dataObj[7]),
                        wj: parseInt(dataObj[8]),
                        lj: parseInt(dataObj[7]) - parseInt(dataObj[8]),

                        npc: parseInt(dataObj[9]),
                    };

                    this.swarm.resources.records[dataObj[2]] = rec;
                    this.smartFox.emit("user_record", rec, parseInt(dataObj[2]));

                    // this.manager.logEmit("epicduel_user", {
                    //     user: dataObj[2],
                    //     b1: dataObj[3],
                    //     b2: dataObj[4],
                    //     w1: dataObj[5],
                    //     w2: dataObj[6],
                    //     bj: dataObj[7],
                    //     wj: dataObj[8],
                    //     wn: dataObj[9]
                    // });

                    // this.smartFox.emit("get_records", dataObj[2], dataObj.slice(2));
                    //}
                    break;
                case Requests.REQUEST_GET_USER_SKILLS:
                    const skills:{ id: number, lvl: number }[] = [];

                    let loc49 = dataObj.slice(3);
                    let loc50 = 2; let loc51 = loc49.length / loc50;

                    for (let i = 0; i < loc51; i++) {
                        skills.push({
                            id: loc49[0 + i * loc50],
                            lvl: loc49[1 + i * loc50]
                        });
                    }

                    if (parseInt(dataObj[2]) === this.smartFox.myUserId) this.user._mySkills = skills;
                    else this.swarm.resources.skills[dataObj[2]] = skills;

                    // if (dataObj[2] == this.smartFox.myUserId) {
                    //     this.user._mySkills = loc48;
                    // } else if (!this.battleOver) this.user._playerSkills[String(dataObj[2])] = loc48;

                    this.smartFox.emit("user_skills", skills, parseInt(dataObj[2]));
                    // StatsSkillsModule.instance.populateSkillsForSelectedUser(loc52);
                    this.startGameCheck();
                    break;
                case Responses.RESPONSE_GET_MY_ITEMS:
                    this.boxes.characterInv.populate(dataObj.slice(2));
                    break;
                case Responses.RESPONSE_STYLE_CHANGE:
                    this.modules.Customize.saveCharacterResponse(dataObj);
                    break;
                case Responses.RESPONSE_BUY_HAIR_STYLE:
                    this.modules.Customize.responseBoughtHair(dataObj);
                    break;
                case Requests.REQUEST_JOIN_WORLD:
                    // TODO: joining world!
                    break;
                case Responses.RESPONSE_NEW_WORLD_CREATED:
                    break; // new world created... what?
                case Requests.REQUEST_HOURS_LEFT:
                    // let [loc53, loc54, loc55, loc56] = [dataObj[2], dataObj[3], dataObj[4], dataObj[5]].map(Number);

                    // if (loc54) {
                    //     loc53 += 1;
                    //     loc54 = 0;
                    // }

                    // // TODO: power hour announcement? very useless since it always start at the same time every day
                    break;
                case Requests.REQUEST_RESTOCK_HOURS_LEFT:
                    console.log(`${dataObj[2]} hours left until the next Limited Rare restock.`);
                    break;
                case Responses.RESPONSE_FRIEND_LIST:
                    this.user._buddyListSize = Number(dataObj[2]);
                    this.modules.Buddy.friendDataAvailable(dataObj);
                    break;
                case Responses.RESPONSE_CHANGE_FRIEND_STATUS:
                    this.modules.Buddy.friendStatusChange(parseInt(dataObj[3]), Boolean(parseInt(dataObj[2])), parseInt(dataObj[4]), false, Boolean(parseInt(dataObj[5])));
                    break;
                case Responses.RESPONSE_FRIEND_CHANGED_NAME:
                    this.modules.Buddy.friendNameChange(parseInt(dataObj[2]), dataObj[3]);
                    break;
                case Requests.REQUEST_REMOVE_FRIEND:
                    this.modules.Buddy.removeFriendResponse(parseInt(dataObj[2]), Boolean(parseInt(dataObj[3])));
                    break;
                case Responses.RESPONSE_FRIEND_ADD:
                    this.modules.Buddy.addFriendToList(parseInt(dataObj[2]), dataObj[3], parseInt(dataObj[4]));
                    break;
                case Requests.REQUEST_FRIEND_REQUEST:
                    // dataObj sample: [ 'r38', '-1', 'Spank Doomester', '8776704', '19610' ]

                    // this.manager._database?.getLinkedCharacters(parseInt(dataObj[3]), false).then((val) => {
                    //     // Accept friend requests from linked characters.
                    //     if (val.type === 1 && val.result.length) {
                    //         console.log("Accepting a friend request from " + dataObj[2] + " (" + dataObj[3] + ")")
                    //         this.modules.Buddy.acceptBuddyRequest(parseInt(dataObj[4]), true);
                    //     } else console.log("A friend request was sent from an unlinked char; " + dataObj[2] + " (" + dataObj[3] + ")");
                    // }, (err) => {
                    //     console.log("A friend request was sent from a char; " + dataObj[2] + " (" + dataObj[3] + ")");
                    // });

                    break;
                case Requests.REQUEST_BUY_MORE_BUDDIES: case Requests.REQUEST_BUY_MORE_SLOTS:
                    break;
                case Responses.RESPONSE_GENERAL_FAIL:
                    console.log(dataObj[2]);
                    break;
                case Responses.RESPONSE_TEMP_BLOCK: case Responses.RESPONSE_SONAR_TARGET:
                    // mod stuff
                    break;
                case Responses.RESPONSE_JUMP_CONFIRM:
                    if(dataObj[2] == 1) this.jumpToRoomConfirm(dataObj[3], dataObj[4]);
                    else {
                        switch (parseInt(dataObj[3])) {
                            case 1: console.log(this.swarm.languages["DYN_buddy_err_worldFull"]); break;
                            case 2: console.log(this.swarm.languages["DYN_buddy_err_inHQ"]); break;
                            case 3: console.log(this.swarm.languages["DYN_buddy_err_inBattle"]); break;
                            case 4: console.log(this.swarm.languages["DYN_buddy_err_justLoggedIn"]); break;
                            case 5: console.log(this.swarm.languages["DYN_err_alreadyThere"]); break;
                            case 6: console.log(this.swarm.languages["DYN_buddy_err_jumpFail"]); break;
                            case 7: console.log(this.swarm.languages["DYN_chat_err_pmOffline"]); break;
                            case 8: console.log(this.swarm.languages["DYN_chat_err_homePermission"]); break;
                            case 9: console.log(this.swarm.languages["DYN_buddy_err_restrictedJump"]); break;
                            case 10: console.log("Unable to jump to player, user has activated Do Not Disturb mode!"); break;
                        }
                    }
                    break;
                case Responses.RESPONSE_FRIEND_FAIL:
                    if (dataObj[2] == "0") console.log(this.swarm.languages["DYN_buddy_err_outOfRoomYou"]);
                    else if (dataObj[3] == "0") console.log(this.swarm.languages["DYN_buddy_err_outOfRoomThem"]);
                    break;
                case Requests.REQUEST_BUY_ACHIEVEMENT:
                    break;
                case Requests.REQUEST_GET_BOOST_TIME: case Requests.REQUEST_BUY_BOOST:
                    break;
                // case Responses.RESPONSE_CHALLENGE_REQUEST:
                //     let usId = parseInt(dataObj[2]);
                //     console.log("response_challenge_request");
                //     console.log(usId);

                //     let usah = this.getUserBySfsUserId(usId);

                //     if (usah != null && ["Spank Doomester", "Variation", "Ahri", "Vendetta"].some(v => v === usah.charName)) {
                //         setTimeout(() => {
                //             this.smartFox.sendXtMessage("main", Requests.REQUEST_CHALLENGE_ACCEPT, {tId: usId}, 2, "json");
                //         }, 500);
                //     }

                //     break;
                // case Requests.REQUEST_CHALLENGE_ACCEPT:
                //     let userId = parseInt(dataObj[2]);
                //     console.log("response_challenge_accept");
                //     console.log(userId);

                //     this.smartFox.sendObjectToGroup({type: Requests.OBJECT_REQUEST_CHALLENGE_CONFIRM}, [userId])
                //     break;
                // case Responses.RESPONSE_CHALLENGE_FAIL:
                //     // ClearBlockModule.instance.closeModule(); basically useless
                //     break; // welp, it's now a reality ~~lol~~
                case Requests.REQUEST_CHANGE_CLASS: case Requests.REQUEST_CHANGE_NAME: case Responses.RESPONSE_PM_TARGET_OFFLINE:
                    break;
                case Requests.REQUEST_PING:
                    //this._ping
                    break; // yk that ping ms thing in a battle? yeah no
                case Requests.REQUEST_POINTS_API:
                    break;
                case Requests.REQUEST_GET_HOME_ITEMS:
                    break;
                case Requests.REQUEST_SAVE_HOME_ITEMS:
                    break;
                case Requests.REQUEST_GET_ALL_HOME_ITEMS:
                    break; // mm ?
                case Requests.REQUEST_BUY_HOME_ITEM: case Requests.REQUEST_SELL_HOME_ITEM:
                    break;
                case Requests.REQUEST_GET_MY_HOME_ITEMS:
                    break;
                case Requests.REQUEST_APPRAISE:
                    break;
                case Requests.REQUEST_ACCEPT_MISSION: case Requests.REQUEST_END_MISSION:
                    break;
                case Responses.RESPONSE_GET_MY_MISSIONS:
                    // this.modules.MissionManager.myMissionsReceived(dataObj);
                    break;
                case Responses.RESPONSE_HOME_JUMP_PERM_FAIL:
                    console.log(this.swarm.languages["DYN_chat_err_homePermission"]);
                    if (dataObj[2] == "1") this.play();
                    break; // maybe?
                case Responses.RESPONSE_TESTER_COMMANDS:
                    break;
                case Responses.RESPONSE_GET_OWNED_HAIR_STYLES:
                    this.boxes.style.storeOwnedHairStyles(dataObj);
                    break;
                case Responses.RESPONSE_UPGRADE_ITEM: case Responses.RESPONSE_INSERT_CORE:
                    break;
                case Requests.REQUEST_GET_ALL_PLAYER_CASES: case Requests.REQUEST_GET_CASE: case Responses.RESPONSE_MOD_ACTIONS: case Responses.RESPONSE_MOD_CHAR_NAME_LOG: case Responses.RESPONSE_MOD_ACCT_CHAR_NAMES: case Responses.RESPONSE_MOD_CHAR_DATA: case Responses.RESPONSE_MOD_CHAR_STATUS: case Requests.REQUEST_ELEVATE_CASE: case Requests.REQUEST_DELETE_CASE: case Requests.REQUEST_CLAIM_CASE: case Requests.REQUEST_RELEASE_CASE: case Requests.REQUEST_CLOSE_CASE: case Requests.REQUEST_MODERATOR_ACTION:
                    break;
                case Requests.REQUEST_GET_MAIL:
                    this.modules.MailManager.handleGetMail(dataObj);
                    break;
                case Responses.RESPONSE_NEW_MAIL:
                    console.log("A new mail?!?!!!!? idk");
                    this.modules.MailManager.getNewMail();
                    break;
                case Requests.REQUEST_SEND_PLAYER_MAIL:
                    if (dataObj[2] == 1) {
                        console.log("Mail sent.");
                        // this.modules.MailManager.clearCreateMail();
                        // ++this.modules.MailManager._mailCount;
                    } else {
                        console.log(dataObj[3] + " was not a valid mail recipient");
                    }
                    break;
                case Requests.REQUEST_GET_FACTION_MEMBER_NAMES:
                    //client.modules.FactionManager.handleFactionMemberNames(dataObj);
                    break; // faction member names?
                case Requests.REQUEST_SET_ALIGNMENT: case Requests.REQUEST_CHAR_SWITCH_ALIGN:
                    break;
                case Requests.REQUEST_ARCADE_SPIN:
                    break;
                case Requests.REQUEST_BUY_ARCADE_TOKENS:
                    break;
                case Requests.REQUEST_ARCADE_LEADERS:
                    break;
                case Responses.RESPONSE_ARCADE_GOLD_SPIN:
                    break;
                case Responses.RESPONSE_GIFTER_ON_FIRE:
                    console.log("gifter's onn fireee: " + dataObj[2] + ", tier: " + dataObj[3]);

                    // tier: 0 for none, 1 for 15, 2 for 30, 3 for 45, 4 for 70, 5 for 100, 6 for 150, 7 for 200
                    break;
                case Requests.REQUEST_PICK_UP_MAP_ITEM:
                    break;
                case Requests.REQUEST_BANK_BUY_SLOTS: case Requests.REQUEST_BANK_DEPOSIT: case Requests.REQUEST_BANK_WITHDRAW:
                    break;
                case Responses.RESPONSE_GET_LEGEND_PTS:
                    break;
                case Responses.RESPONSE_GET_LEGEND_CATS:
                    this.boxes.legendary.populate(dataObj.slice(2));
                    break;
                case Requests.REQUEST_UNLOCK_LEGENDARY_SLOT: case Requests.REQUEST_UPDATE_LEGEND_POINTS:
                    break;
                case Responses.RESPONSE_UPDATE_MISSION_COUNT:
                    break;
                case Responses.RESPONSE_GET_WAR_REGION_DATA:
                    this.boxes.war.populate("region", dataObj.slice(2));
                    break; // WAR!!!!!
                case Responses.RESPONSE_GET_OBJ_STATIC_DATA:
                    this.boxes.war.populate("objective", dataObj.slice(2));
                    break;
                case Responses.RESPONSE_GET_ALL_DYN_WAR_DATA:
                    this.modules.WarManager.warObjectiveAllDataReceived(dataObj);
                    break;
                case Responses.RESPONSE_UPDATE_WAR_CD_HOURS:
                    this.modules.WarManager.warCooldownDataReceived(dataObj);
                    break;
                case Responses.RESPONSE_UPDATE_OBJ_POINTS:
                    this.modules.WarManager.warObjectivePointsDataReceived(dataObj);
                    break;
                case Responses.RESPONSE_GET_MY_WAR_DATA:
                    this.modules.WarManager.myWarDataReceived(dataObj);
                    this.play();
                    break;
                case Requests.REQUEST_USE_OBJECTIVE:
                    //WarObjectiveModule.instance.useObjectiveServerResponse(_loc3_ as Array);
                    break;
                case Responses.RESPONSE_WAR_OBJECTIVE_ANIMATE:
                    this.modules.WarManager.animateObjectiveServerResponse(dataObj);
                    break;
                case Requests.REQUEST_GET_REGIONAL_INFLUENCE_LEADERS:
                    this.modules.WarManager.handleLeaderData(dataObj, "overall");
                    break;
                case Requests.REQUEST_GET_REGIONAL_LEADER_GFX:
                    this.modules.WarManager.handleWarLeaderGfx(dataObj);
                    break;
                case Requests.REQUEST_GET_DAILY_INFLUENCE_LEADERS:
                    this.modules.WarManager.handleLeaderData(dataObj, "daily");
                    break;
                case Requests.REQUEST_GET_WAR_PRIZE:
                    break;
                case Requests.REQUEST_CLAIM_GIFTED_PRESENT:
                    this.modules.MailManager.receiveClaimGiftHandler(dataObj);
                    break;
                case Requests.REQUEST_GET_GIFT_LEADERS:
                    this.modules.Advent.receiveGetGiftLeadersResponse(dataObj);
                    break;
                case Requests.REQUEST_GIVE_GIFT:
                    this.modules.Advent.receiveGiveGiftResponse(dataObj);
                    break;
                case Requests.REQUEST_TOURNAMENT_LEADERS:
                    this.modules.Tournament["receiveTournamentLeadersResponse"](dataObj);
                    // this.smartFox.emit('tournament_leaders', ...dataObj); // i hate myself for spreading this

                    //this.cache["tournament_leaders"] = [Date.now(), dataObj];
                    //TournamentModule.instance.receiveTournamentLeadersResponse(_loc3_ as Array);
                    // TODO: tournament leaders!!!!!
                    break;
                case Requests.REQUEST_TOURNAMENT_DETAILS:
                    this.modules.Tournament["receiveTournamentDetailsResponse"](dataObj);
                    // this.smartFox.emit('tournament_details', ...dataObj); // i hate myself for spreading this
                    //this.cache["tournament_details"] = [Date.now(), dataObj];
                    //TournamentModule.instance.receiveTournamentDetailsResponse(_loc3_ as Array);
                    // TOURNAMENT STUFF!!!!
                    break;
                case Requests.REQUEST_MY_TOURNAMENT_SCORE:
                    this.modules.Tournament["receiveTournamentScoreResponse"](dataObj);
                    //TournamentModule.instance.receiveTournamentScoreResponse(_loc3_ as Array);
                    // no
                    break;
                case Responses.RESPONSE_GOT_FAME:
                    console.log("Received a fame from " + dataObj[2]);
                    //client.manager._logger.info("Famed... by", )
                    //FameManager.fameReceived(_loc3_ as Array);
                    break;
                case Requests.REQUEST_GIVE_FAME:
                    this.smartFox.emit("fame", {
                        success: parseInt(dataObj[2]),
                        name: dataObj[3]
                    });
                    // let famed = this.smartFox.getActiveRoom().userList.find(v => v.charName === dataObj[3]);

                    // if (this.manager && famed !== undefined) {
                    //     this.manager.famed[famed.charId] = Date.now();
                    // }
                    // this.smartFox.emit('giveth_fame', {success: parseInt(dataObj[2]), name: dataObj[3]});
                    //FameManager.giveFameServerResponse(_loc3_ as Array);
                    break;
                case Requests.REQUEST_GET_MY_CODES:
                    //CreateCodeModule.instance.myCodeDataReceived(_loc3_ as Array);
                    break;
                case Requests.REQUEST_CREATE_CODE:
                    //CreateCodeModule.instance.codeCreatedResponse(_loc3_ as Array);
                    break;
                case Requests.REQUEST_BUY_TOURNAMENT_TICKET:
                    //TournamentModule.instance.buyTournamentTicketResponse(_loc3_ as Array);
                    break;
                default:
                    Logger.getLoggerP(this.settings.id).debug(dataObj);
                    // this.manager._logger.error("Unknown response: " + dataObj);
                    break;
                
            }
        }
    }

    onJoinRoomHandler(evt: SFSClientEvents["onJoinRoom"][0]) {
        let playerCount = 0;
        const [room] = [evt.room];

        if (!room) return;

        const [roomName, roomId] = [room.getName(), room.getId()];

        const users = room.getUserList();

        for (let i = 0, len = users.length; i < len; i++) {
            this.swarm.execute("onUserListUpdate", this, { type: 1, list: users, user: users[i] });
        }

        this.swarm.execute("onJoinRoom", this, { room: room });

        // if (RoomManager.roomIsChallenge(room)) {
        //     if (this.battle.epbattle == null) {
        //         this.stopAFK_Timers();
        //         this.battle.epbattle = new EpicBattle(this, {battleType: Constants.BATTLE_TYPE_1V1_CHAL, confirmation: true, counts: false, reward: false});
        //     }
        // } else if (RoomManager.roomIsNpc2vs1_User(room)) {
        //     if (this.battle.epbattle == null) {
        //         this.stopAFK_Timers();
        //         this.battle.epbattle = new EpicBattle(this, {battleType: Constants.BATTLE_TYPE_2V1_BOSS_USER, targetUserId: this.active.merchRecord.merchantId, confirmation: true, counts: false, reward: false});
        //     }
        // } else if (RoomManager.roomIsNpc2vs1_Npc(room)) {
        //     if (this.battle.epbattle == null) {
        //         this.stopAFK_Timers();
        //         this.battle.epbattle = new EpicBattle(this, {battleType: Constants.BATTLE_TYPE_2V1_BOSS_NPC, targetUserId: this.active.merchRecord.merchantId, confirmation: true, counts: false, reward: false});
        //     }
        // } else if (RoomManager.roomIs2vs2_User(room)) {
        //     if (this.battle.epbattle == null) {
        //         this.stopAFK_Timers();
        //         this.battle.epbattle = new EpicBattle(this, {battleType: Constants.BATTLE_TYPE_2V2_AUTO, confirmation: true});
        //     }
        // } else if (RoomManager.roomIsSim_User(room)) {
        //     if (this.battle.epbattle == null) {
        //         this.stopAFK_Timers();
        //         this.battle.epbattle = new EpicBattle(this, {battleType: Constants.BATTLE_TYPE_SIMULATION, confirmation: true});
        //     }
        // } else if (false) {
        //     // nobody sane does OMG.
        // }

        // if (this.manager?.jumps.running) {
        //     this.smartFox.emit("room_jump", room.name.endsWith("_0") ? room.name.slice(0, -2).toLowerCase() : room.name.toLowerCase(), true);
        // }
        
        if (roomName == RoomManager.LOBBY) {
            this.timer.ping.start();
            this.lobbyInit = true;
            Logger.getLoggerP(this).debug(`Joined the lobby, sending init.`);
            this.smartFox.sendXtMessage("main", Requests.REQUEST_LOBBY_INIT, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
        } else if (room.isBattle) {
            this.battleOver = false;
            /*
            this.battleovermodule.closemodulething;
            setup some backdrop, never ofc cos this is cmd line lmao
            battlewaitingmodule (wtf) updateplayercount
            */
            // this.battle.epbattle._playerCount = room.getUserList().length;
        } else {
            // this.user._returnFromBattleRoomName = room.getName();
            // if (!this.user._firstAvatarSetup) this.setupMyAvatar(false);

            // if (this.autoBattle && this.autoBattle.mode) {
            //     let myUser = this.getMyUser();
            //     let levello = [getUserLevelByExp(myUser.charExp), nextLegendRankByExp(myUser.charExp)];

            //     if (this.autoBattle.left > 0) {
                    
            //         this.battleLog(`Current Exp: ${myUser.charExp} (Lvl ${levello[0]}${levello[0] === 40 ? " [" + getLegendRankByExp(myUser.charExp) + "]" : ""})`);
            //         if (levello[0] !== 40) this.battleLog(`Exp to next level: ${levels[levello[0]] - myUser.charExp} (${levels[levello[0]]})`)
            //         else this.battleLog(`Exp to next rank: ${levello[1][1]} (${levello[1][0]})`)

            //         setTimeout(() => {
            //             this.battleLog(this.challengeNPC(this.autoBattle.npc));
            //         }, 1000);
            //     } else {
            //         console.log(`Current Exp: ${myUser.charExp} (Lvl ${levello[0]}${levello[0] === 40 ? " [" + getLegendRankByExp(myUser.charExp) + "]" : ""})`);
            //         if (levello[0] !== 40) console.log(`Exp to next level: ${levels[levello[0]] - myUser.charExp} (${levels[levello[0]]})`)
            //         else console.log(`Exp to next rank: ${levello[1][1]} (${levello[1][0]})`)

            //         this.autoBattle.mode = false;
            //         console.log("All 300 npc wins used up OR power hour has ended.");

            //         this.manager.battleMode(false);
            //     }
            // }

            // if (this.manager.battleModeStarted === true) {
            //     this.manager.battleModeStarted = false;
            //     setTimeout(() => {
            //         let charLvl = this.getMyUser().charLvl;

            //         let npcName = "null";

            //         if (charLvl < 8) npcName = "Junker";
            //         else if (charLvl > 39) npcName = "Caden";
            //         else console.log("WARNING, levels other than (1-8 and 40) are not handled for automatic npc!");

            //         if (npcName === "null") {
            //             if (this.autoBattle?.mode) this.manager.battleMode(false);
            //         }

            //         let o = this.challengeNPC(npcName, true, true);

            //         if (o[0] !== 1) { console.log(o); }
            //     }, 1000);
            // }
        }

        // this.debug("JOINED ROOM", roomName);
    }

    onJoinRoomErrorHandler(evt: SFSClientEvents["onJoinRoomError"][0]) {
        if (evt.error === "User is already in this room!") {
            // if (this.manager?.jumps.running) {
                // this.smartFox.emit("room_jump", this.manager.jumps.roomName, false, 1);
            // }

            if (!this.lobbyInit) {
                this.timer.ping.start();
                this.startGameCheck();
                this.smartFox.sendXtMessage("main", Requests.REQUEST_LOBBY_INIT, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
            }
        }

    }

    onObjectReceivedHandler(evt: SFSClientEvents["onObjectReceived"][0]) {
        const sender = evt.sender;
        const type = String(evt.obj.type);

        if (!sender) return;

        const [senderId, senderCharName] = [sender.getId(), sender.charName];
        
        if (!["o4", "o3"].some(v => v === type)) {
            console.log("Object received V!");
            console.log(evt);
            console.log("Object received ^!");
        }

        switch (type) {
            case Requests.OBJECT_REQUEST_ALLY_MESSAGE:
                break;
            case Requests.OBJECT_REQUEST_CHARACTER_ACTION:
                break;
            case Requests.OBJECT_REQUEST_CHALLENGE_CONFIRM:
                // this.modules.EpicBattleManager.createChallengeBattle(senderId);
                break;
            case Requests.OBJECT_REQUEST_CHALLENGE_CONFIRM_FAIL:
                break;
            case Requests.OBJECT_REQUEST_CANCEL_CHALLENGE:
                break;
        }

    }

    /*clearInterface() {
        if (this.user != null && this.user._myAvatar != null) {
            let lvRoom = this.smartFox.getActiveRoom();
            if (lvRoom != null) {
                let baseName = RoomManager.getRoomBaseName(lvRoom.getName());

                if(baseName == RoomManager.WAR_INFERNAL_MINES_LEFT_2 || baseName == RoomManager.WAR_INFERNAL_MINES_RIGHT_2) {
                    coords = RoomManager.getRoomJumpCoordinates(baseName);
                    this.user._savedX = coords.x;
                    this.user._savedY = coords.y;
                }
                else
                {
                    this.user._savedX = this.user._myAvatar.x;
                    this.user._savedY = this.user._myAvatar.y;
                }
                this.user._myAvatar = null;
            }

        }
    }*/

    onPublicMessageHandler(evt: SFSClientEvents["onPublicMessage"][0]) {
        // if (evt == null || evt.params == null || this.muteChat) return;

        const msg = evt.message;
        const room = this.smartFox.getRoom(evt.roomId);

        if (room == null) return;

        /**
         * @type {import("./data/User")}
         */
        const sender = room.getUser(evt.userId);

        if (sender == null) return;

        this.swarm.execute("onPublicMessage", this, { roomId: evt.roomId, user: sender, message: msg });

        if (room.getName() != "Lobby") {
            //const targetPlayer = sender.charName;

            //console.log(msg);
        }

        if (sender.charName === "Spank Doomester") {
            if (msg === "sehup") this.setupMyAvatar();
        }
    }

    onPrivateMessageHandler(evt: SFSClientEvents["onPrivateMessage"][0]) {
        // if (evt == null || evt.params == null) return;

        const msg = evt.message;
        //const room = this.smartFox.getRoom(evt.params.roomId);

        // if (!this.ohniceok) this.ohniceok = [];
        // this.ohniceok.push([msg, evt.userId]);

        //if (room == null) return;

        let window = this.modules.Chat.list.find(v => v.userId === evt.userId);
        if (window) {
            this.swarm.execute("onPrivateMessage", this, { message: msg, userId: evt.userId, userName: window.charName, isFromMe: false });
            // this.manager.discord.emit("epicduel_private_chat", msg, [window.charName, evt.params.userId], -1);
            window.appendMsg([window.charName, msg.slice(window.charName.length + 2)]);
        } else console.log(evt);
    }

    emptyHandler() {
        // nothing
    }

    onLoginHandler(evt: SFSClientEvents["onLogin"][0]) {
        console.log(evt);
        console.log(this instanceof SmartFoxClient);
    }

    onRandomKeyHandler(evt: SFSClientEvents["onRandomKey"][0]) {
        this.smartFox.login("project", this.user.username + "#" + this.user.session + "#" + this.user.userid, this.user.password);
    }

    onUserEnterRoomHandler(evt: SFSClientEvents["onUserEnterRoom"][0]) {
        /**
         * @type {[import("./data/User"), number]}
         */

        const [user, roomId] = [evt.user, evt.roomId];
        const room = this.smartFox.getRoom(roomId);

        if (room && room.getName() != RoomManager.LOBBY) {
            this.swarm.execute("onUserListUpdate", this, { type: 1, list: room.getUserList(), user });
            // if (room.isBattle) {
            //     // ++this.battle.epbattle._playerCount;
            //     // this.battleLog("Player has joined - " + user.charName);
            // }
        }
    }

    onUserLeaveRoomHandler(evt: SFSClientEvents["onUserLeaveRoom"][0]) {
        const [userId, roomId, user] = [evt.userId, evt.roomId, evt.user];
        const room = this.smartFox.getRoom(roomId);

        if (user && room && room.getName() != RoomManager.LOBBY) {
            this.swarm.execute("onUserListUpdate", this, { type: 2, list: room.getUserList(), user });
        }

        // if (room && room.getName() != RoomManager.LOBBY) {
        //     if (room.isBattle) {
        //         if (this.battle.epbattle != null && this.battle.epbattle.client != null) {
        //             let actor = this.battle.epbattle.getBattleActorBySlot(userId);
        //             if (actor != null) {
        //                 actor.removeBuffs();
        //                 actor._inAction = false;
        //                 actor.selfDestruct();
        //             }
        //             if (this.battle.epbattle._currentTurn == this.user._myBattleSlot) {
        //                 this.battle.BattleActionsModule.determineBattleControlStatus();
        //             }
        //             --this.battle.epbattle._playerCount;
        //         }
        //     }
        // }
    }

    //#endregion

    connectionLost(autoReload=true) {
        //this.stopAFK_Timers(true);
        //this.timer.flood.stop();
        // this.modules.EpicBattleManager.timer.turn.stop();
        // this.modules.EpicBattleManager.timer.inAction.stop();
        // this.modules.EpicBattleManager.timer.checkBattleLoaded.stop();
        // this.modules.EpicBattleManager.timer.assetLoadFail.stop();
        // this.timer.ping.stop();
        if (autoReload) {
            //this.timer.reload.start();
        }
    }

    joinRoom(roomName: string) {
        this.smartFox.sendXtMessage("main", Requests.REQUEST_JOIN_ROOM, {rN: roomName}, 3, "json");
    }

    /**
     * @param {string} targetRoomName
     * @param {number} worldIndex
     * @param {number} bypassRestrictions For each increment, skips through the restrictions; level requirement
     */
    jumpToRoomConfirm(targetRoomName: string, worldIndex: number, bypassRestrictions=0) {
        let currentRoom = this.smartFox.getActiveRoom();

        if (currentRoom == null) return;

        let roomRecord = RoomManager.getRoomRecord(RoomManager.getRoomFileName(targetRoomName));

        if (!roomRecord) return;

        if (roomRecord.levelRequired > this.getMyUserFr().charLvl && bypassRestrictions < 1) return this.swarm.languages["DYN_map_err_lowLevel"];
        if (RoomManager.roomIsHome(currentRoom.getName()) && !RoomManager.roomIsHQ(currentRoom.getName())) {
            if (RoomManager.roomIsHome(targetRoomName) || RoomManager.roomIsHQ(targetRoomName)) {
                this.user._returnFromHomeRoomName = currentRoom.getName();
                // this.user._returnFromHomeX = this.user._myAvatar.x;
                // this.user._returnFromHomeY = this.user._myAvatar.y;
            }
        }

        if (roomRecord.coords != null) {
            this.user._arrivalX = roomRecord.coords[0];
            this.user._arrivalY = roomRecord.coords[1];
        }

        this.user._lastRoom = RoomManager.getRoomBaseName(currentRoom.getName());
        this.user._warpIn = true;

        if (RoomManager.roomIsHome(targetRoomName)) {
            let roomParts = targetRoomName.split("_");
            this.smartFox.sendXtMessage("main", Requests.REQUEST_FIND_OR_CREATE_HOME, {
                currRoomId: currentRoom.getId(),
                style: parseInt(roomParts[1]),
                room: parseInt(roomParts[2]),
                charId: parseInt(roomParts[3]),
                warp: false
            }, 3, "json");
        } else {
            this.user._worldIndex = worldIndex;
            // set world instance blah, that's purely cosmetic (world radio)
            this.joinRoom(targetRoomName);
        }
    }

    isHomeMine(roomName: string) {
        let roomParts = roomName.split("_");
        let homeCharId = parseInt(roomParts[3]);
        return homeCharId == this.getMyUser()?.charId;
    }

    initInventory() {
        if (this.modules.Inventory.initialised !== true) {
            let characterInvList = Array.from(this.boxes.characterInv.objMap.values());

            for (let i = 0, len = characterInvList.length; i < len; i++) {
                const myRecord = characterInvList[i];

                let myItem = this.boxes.item.getItemById(myRecord.itemId);

                if (!myItem) throw Error("Unknown item id: " + myRecord.itemId);

                let listItem = new InventoryListItem(myItem, myRecord);
                if (myRecord.itemEquipped === true) {
                    this.modules.Inventory.equippedList.push(listItem);
                }

                this.modules.Inventory.list.push(listItem);
            }

            this.modules.Inventory.initialised = true;
            return true;
        } return false;
    }

    /**
     * Use to bring the bot forth into the real world.
     */
    setupMyAvatar() {
        if (this.smartFox.connected) {
            const myUser = this.getMyUser();
            const uVars = {} as Variables;

            if (!myUser) return -1;

            if (this.user._firstAvatarSetup) {
                this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MY_HOMES, {}, 1, "json");

                let launchCode = 0;
                // if(this._loadParams != null && this._loadParams.launch != null) launchCode = parseInt(this._loadParams.launch);
                
                //if (this.modules.Inventory.initialised !== true) {
                    let characterInvList = this.boxes.characterInv.objMap.toArray();
                    for (let myRecord of characterInvList) {
                        let myItem = this.boxes.item.getItemById(myRecord.itemId);

                        if (!myItem) continue;

                        let listItem = (this.modules.Inventory.initialised !== true) ? new InventoryListItem(myItem, myRecord) : null;
                        if (myRecord.itemEquipped == true) {
                            let isWeapon = ItemSBox.itemIsWeapon(myItem.itemCat);
                            if (isWeapon) {
                                if (myItem.itemCat == ItemSBox.ITEM_CATEGORY_GUN_ID) uVars.iGun = myItem.itemId;
                                else if (myItem.itemCat == ItemSBox.ITEM_CATEGORY_AUXILIARY_ID) uVars.iAux = myItem.itemId;
                                else uVars.iWpn = myItem.itemId;
                            } else {
                                switch ((myItem.itemCat)) {
                                    case ItemSBox.ITEM_CATEGORY_ARMOR_ID:  
                                        break;
                                    case ItemSBox.ITEM_CATEGORY_BOT_ID:
                                        uVars.iBot = myItem.itemId;
                                        break;
                                    case ItemSBox.ITEM_CATEGORY_VEHICLE_ID:
                                        //InventoryModule.instance.ui.equipped_module.vehicle_list.addItem(listItem);
                                        uVars.iVeh = myItem.itemId;
                                        break;
                                }
                            }

                            if (this.modules.Inventory.initialised !== true && listItem) this.modules.Inventory.equippedList.push(listItem);
                        }

                        if (this.modules.Inventory.initialised !== true && listItem) this.modules.Inventory.list.push(listItem);
                    }
                //}

                uVars.px = this.user._arrivalX || 450 + Math.ceil(Math.random() * 70) - 70;
                uVars.py = this.user._arrivalY || 450;
                uVars.charScaleX = this.user._myCharScaleX;
                uVars.warp = this.user._warpIn || false;
                uVars.mv = 0;
                if(myUser.fctId == 0) {
                    // if (this.minusculeAmountOfTomfoolery) {
                    //     uVars.fctId = 69;
                    //     uVars.fctPerm = 2;
                    //     uVars.fctName = "Cock and Balls";
                    //     uVars.charTitle = "Despacito";
                    // } else {
                        uVars.fctId = 0;
                        uVars.fctPerm = 0;
                        uVars.fctName = "";
                        uVars.charTitle = "";
                    // }
                }

                // if (this.maximumAmountOfTomfoolery) {
                //     for (let i in this.maximumAmountOfTomfoolery) {
                //         if (Array.isArray(this.maximumAmountOfTomfoolery[i])) {
                //             uVars[i] = this.maximumAmountOfTomfoolery[i];
                //             delete this.maximumAmountOfTomfoolery[i];
                //         } else uVars[i] = this.maximumAmountOfTomfoolery[i];
                //     }
                // }

                this.user._firstAvatarSetup = false;
            } else {
                uVars.px = this.user._arrivalX || 450 + Math.ceil(Math.random() * 70) - 70;
                uVars.py = this.user._arrivalY || 450;
                uVars.charScaleX = this.user._myCharScaleX;
                uVars.warp = this.user._warpIn;
                uVars.mv = 0;
                uVars.charHp = myUser.charMaxHp;
                uVars.charMp = myUser.charMaxMp;
                // uVars.charHp = (troll) ? 2147483648 : myUser.charMaxHp;//myUser.charMaxHp;//2147483648;//myUser.charMaxHp + 1000000;
                // uVars.charMp = (troll) ? 691337 : myUser.charMaxMp;

                // if (this.moderateAmountOfTomfoolery) {
                //     for (let i in this.moderateAmountOfTomfoolery) {
                //         if (Array.isArray(this.moderateAmountOfTomfoolery[i])) {
                //             uVars[i] = this.moderateAmountOfTomfoolery[i];
                //             delete this.moderateAmountOfTomfoolery[i];
                //         } else uVars[i] = this.moderateAmountOfTomfoolery[i];
                //     }
                // }
            }

            this.setVars("new", uVars);
        }

        return;
    }

    // vars(type: number, vars: Variables, eCmd="new") {
    //     let isTypeZero = type === 0;
    //     if (typeof type !== "number") { vars = type; isTypeZero = true; }

    //     let uVars = {} as Variables;

    //     for (let i in vars) {
    //         uVars[i] = vars[i];
    //     }

    //     switch (type) {
    //         case 0: this.setVars(eCmd, uVars); return [eCmd, uVars];
    //         case 1: this.minusculeAmountOfTomfoolery = !this.minusculeAmountOfTomfoolery; return ["minuscule", this.minusculeAmountOfTomfoolery];
    //         case 2: this.moderateAmountOfTomfoolery = uVars; return ["moderate", uVars]
    //         case 3: this.maximumAmountOfTomfoolery = uVars; return ["maximum", uVars];
    //         default: if (isTypeZero) { this.setVars(eCmd, uVars); return [eCmd, uVars]; }
    //         else throw Error("Unknown type");
    //     }
    // }

    // /**
    //  * @param {{battleType: number, targetUserId: number?, counts: boolean, reward: boolean}} obj All must be passed in. NOTE: this is a passthrough!
    //  */
    // reinitEPB(obj) {
    //     /*
    //             bp.battleType = Constants.BATTLE_TYPE_1V1_CHAL;
    //             bp.targetUserId = targetId;
    //             bp.counts = false;
    //             bp.reward = false;*/
        
    //     if (this.battle.epbattle) {
    //         this.battle.epbattle.client = null;
    //         //this.battle.epbattle = null;
    //     }
    //     this.battle.epbattle = new EpicBattle(this, obj);
    // }

    /**
     * Unlinks all of the instances and modules, hopefully to allow GC to clear things up.
     * Boxes will remain intact! This is due to the fact they're unlinked and separate, does not keep client so can be refreshed at ease.
     * @returns {boolean[][]}
     */
    selfDestruct(skipTimer = false) {
        let successes:boolean[][] = [[], [], [], [], [], [], [], [], []];

        const modKeys = Object.keys(this.modules) as Array<keyof Client["modules"]>;

        for (let i = 0, len = modKeys.length; i < len; i++) {
            const module = this.modules[modKeys[i]];

            if ("selfDestruct" in module) module["selfDestruct"]();

            // The operand of a 'delete' operator must be optional my ass
            //@ts-expect-error
            successes[0].push(delete this.modules[modKeys[i]].client);
            successes[1].push(delete this.modules[modKeys[i]]);
        }

        // // For standalone/client with battle mode
        // if (this.battle) {
        //     for (let idk in this.battle) {
        //         if (idk === "actionBtns" || idk === "battleActors" || idk === "battleTabs") continue;
        //         if (!this.battle[idk]) continue;

        //         if (this.battle[idk].selfDestruct) this.battle[idk].selfDestruct();
                
        //         successes[2].push(delete this.battle[idk].client);
        //         successes[3].push(delete this.battle[idk]);
        //     }

        //     for (let x = 0; x < this.battle.actionBtns.length; x++) {
        //         for (let y = 0; y < this.battle.actionBtns[x].length; y++) {
        //             if (this.battle.actionBtns[x][y]) {
        //                 this.battle.actionBtns[x][y].client = null;
        //                 successes[4].push(delete this.battle.actionBtns[x][y]);
        //             }
        //         }
        //     }

        //     for (let x = 0; x < this.battle.battleActors.length; x++) {
        //         if (this.battle.battleActors[x]) this.battle.battleActors[x].selfDestruct();

        //         successes[5].push(delete this.battle.battleActors[x]);
        //     }

        //     for (let x = 0; x < this.battle.battleTabs.length; x++) {
        //         //if (this.battle.battleTabs[x]) this.battle.battleTabs[x].selfDestruct();
        //         if (!this.battle.battleTabs[x]) continue;
        //         if (this.battle.battleTabs[x].linkedActor) delete this.battle.battleTabs[x].linkedActor; // Can't be possible as battleActors are destroyed, so no need for successes.

        //         successes[6].push(delete this.battle.battleTabs[x]);
        //     }
        // }

        const timerKeys = Object.keys(this.timer) as Array<keyof Client["timer"]>;

        for (let i = 0, len = timerKeys.length; i < len; i++) {
            const timer = this.timer[timerKeys[i]];

            timer["stop"]();
            // timer["callback"] = () => {};
            if (!skipTimer) {
                //@ts-expect-error
                successes[7].push(delete this.timer[timerKeys[i]].callback);
                //@ts-expect-error
                successes[8].push(delete this.timer[timerKeys[i]]);
            }
        }

        // idk just a precaution cos memory leak goes brrrr when too many restarts weeee
        if (this.smartFox) {
            delete this.smartFox.socket;
        }
        
        // delete this.smartFox.client;
        //@ts-ignore
        delete this.smartFox;

        this.initialised = false;

        return successes;
    }

    /**
     * @param {string|number} nameOrID Strict type check, if number then used as ID, otherwise name.
     */
    getMerchRecord(nameOrID: string | number) : MerchantRecord | null {
        if (typeof nameOrID === "number") {
            return this.boxes.merchant.objMap.get(nameOrID) ?? null;
        } else if (typeof nameOrID === "string") {
            return this.boxes.merchant.objMap.find(v => v.mercName === nameOrID) ?? null
        } return null;
    }

    // /**
    //  * NOTE: legendary/nightmare/alternative fights can't work, adapt code if needed.
    //  * @param {0|1|2} variant 0 for normal, 1 for legendary, 2 for nightmare
    //  * @param {string|number} nameOrID Strict type check, if number then used as ID, otherwise name.
    //  * @param {boolean} auto If set to true, the bot will farm the NPC. If string (of any value, although empty string won't work), auto won't be used but setupIfUnset will be set to true.
    //  * @returns {[-5, "Variant provided doesn't exist!", string[], number]|[-4, "Avatar not set!"]|[-3, "Merchant don't have an npcId!"]|[-2, {t: number, v: string}]|[-1, "Merchant record not found."]|[1, null]}
    //  */
    // challengeNPC(nameOrID, auto=false, setupIfUnset=false, variant=0) {
    //     let mercRecord = this.getMerchRecord(nameOrID);

    //     if (this.user._firstAvatarSetup) {
    //         if (setupIfUnset === false && !(auto && typeof auto === "string")) return [-4, "Avatar not set!"];
    //         this.setupMyAvatar();
    //     }

    //     if (!mercRecord) {
    //         return [-1, "Merchant record not found."];
    //     }

    //     if (mercRecord.npcId < 1) return [-3, "Merchant don't have an npcId!"];

    //     let chal = {
    //         // NpcOptionChallenge.js
    //         npcId: mercRecord.npcId
    //     };

    //     if (variant !== 0) {
    //         let opts = mercRecord.mercOpts.split(",");
    //         let opt = opts.find(v => v.startsWith("9#" + (variant*100)));

    //         if (!opt) return [-5, "Variant provided doesn't exist!", opts, variant*100];

    //         chal.npcId = parseInt(opt.split(":")[1]);
    //     }

    //     this.active.merchRecord = mercRecord;

    //     let myUser = this.getMyUser();
    //     //if (!myUser.allPointsApplied(this)) return [-2, {t: 1, v: "Apply Stat Points!"}];
    //     if (this.user._forceRetrain == true) return [-2, {t: 2, v: "Force retrain!"}];
    //     if (!myUser.hasPrimaryWeapon()) return [-2, {t: 3, v: "Equip a primary weapon!"}];
    //     //if (myUser.hasLevelUp()) return [-2, {t: 4, v: "You've just levelled up, add some points."}]; 1107
    //     if (mercRecord.mercAlign > 0) {
    //         if (myUser.charWarAlign == 0) return [-2, {t: 5, v: "Can't fight an NPC if you're neutral?"}];
    //         if (myUser.charWarAlign == mercRecord.mercAlign) return [-2, {t: 6, v: "Can't fight one that's on your side"}];
    //     }
    //     if (mercRecord.mercBoss == Constants.NPC_2V1BOSS && this.user._allyCharId == -1) return [-2, {t: 7, v: "You need an ally!"}];

    //     if (auto && typeof auto === "boolean") {
    //         this.autoBattle = {
    //             mode: true, npc: mercRecord.merchantId, left: -2
    //         }
    //     }

    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_NPC_CHALLENGE_CHECK, chal, 3, "json");
    //     return [1, chal];
    // }

    // sendChallengeRequest(sfsUserId=-1, bypassRestrictions=false) {
    //     let [user01, user02] = [this.getMyUser(), this.smartFox.getActiveRoom().userList.find(v => v.id === sfsUserId || v.charId === sfsUserId || v.name === sfsUserId)];

    //     if (!user02) return "challenged no exists";
    //     if (this.user._isMoving) return "stop moving";
    //     if (user01.iWpn < 1) return "no weapon on";
    //     if (!bypassRestrictions && user01.hasLevelUp()) return "you need to use your stat points. BP";
    //     if (!bypassRestrictions && user02.hasLevelUp()) return "the other player needs to use their stat points. BP";
    //     if (!bypassRestrictions && this.user._forceRetrain === true) return "you're forced to retrain. BP"
    //     if (!bypassRestrictions && !user01.allPointsApplied(this)) return "apply your stat points pls. BP";

    //     this.createPlayerChallenge({ battleType: Constants.BATTLE_TYPE_1V1_CHAL, targetId: user02.id });
    // }

    // createPlayerChallenge(obj) {
    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_CHALLENGE_CHECK, { targetId: obj.targetId }, 2, "json");
    // }

    // /**
    //  * This will only work for those in the room
    //  * @param {number} charId
    //  */
    // addFriend(charId, isSfs=false) {
    //     let user = this.smartFox.getActiveRoom().userList.find(v => v.charId === charId);

    //     if (!user && !isSfs) return { type: -1, v: "No user found with the character ID." };

    //     this.modules.Buddy.addBuddy({ sfsUserId: (isSfs) ? charId : user.id, charId: (isSfs) ? null : user.charId });
    //     return { type: 1, v: "Sending to sfs id: " + (isSfs) ? charId : user.id };
    // }

    // /**
    //  * This will only work for buddies.
    //  * @param {number} sfsUserId If string, will be used for msg and the sfsUserId to be substituted by the first active chat. WARNING, do not substitute in case of a force PM by a mod.
    //  * @param {string} msg
    //  */
    // sendChatMsg(sfsUserId, msg) {
    //     if (typeof sfsUserId === "string") {
    //         msg = sfsUserId;
    //         sfsUserId = this.modules.Chat.list[0]?.userId;//this.modules.Chat.list[0].;
    //     }

    //     if (!this.modules.Chat.list.some(v => v.userId === sfsUserId)) return { type: -1, val: "No user found." };

    //     this.modules.Chat.list.find(v => v.userId === sfsUserId).sendPM(msg);
    //     return { type: 1, val: "Message sent." };
    // }

    /**
     * @param {0|1} bool if boolean, gets converted to number
     */
    setDnd(bool: number | boolean) {
        let myUser = this.getMyUserFr();

        if (typeof bool === "boolean") bool = bool === true ? 1 : 0;

        if (bool === undefined) bool = !myUser.getVariable("dnd");

        this.setVars("dnd", { dnd: bool });
    }

    fameAll() {
        this.smartFox.sendXtMessage("main", Requests.REQUEST_FAME_ALL, {}, 1, "json");
    }

    openAllGifts() {
        this.smartFox.sendXtMessage("main", Requests.REQUEST_OPEN_ALL_GIFTS, {}, 1, "json");
    }

    // jumpToPlayerRequest(charName) {
    //     if (typeof charName === "number") return this.modules.Buddy.jumpToBuddyRequest(charName);
    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_JUMP_TO_BUDDY, { charName }, 1, "json");
    // }

    // /**
    //  * @param {number} classId 
    //  * @returns {[SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject, SkillObject]}
    //  */
    // getSkillsByClassId(classId: number | undefined, whole=false) {
    //     if (classId === undefined) classId = this.getMyUser()?.charClassId;
    //     if (classId === undefined) throw Error("No class id was given, and getMyUser gives null.");

    //     let tree = this.boxes.skills.objList.tree.filter(v => v.classId === classId);
    //     //.map(v => this.manager.getSkillInfoById(v.skillId));

    //     tree.sort((a, b) => { return a.treeRow - b.treeRow || a.treeColumn - b.treeColumn; });

    //     if (whole) return tree.map(v => this.manager.getSkillInfoById(v.skillId));

    //     let list = [[], [], [], []]; let y = 0;

    //     for (let i = 0; i < tree.length; i++) {
    //         if (i % 3 === 0 && i != 0) y++;

    //         list[y].push(this.manager.getSkillInfoById(tree[i].skillId));
    //     }

    //     return list;
    // }

    // /**
    //  * @param {number} classId
    //  * @param {[number, number][]} obj 0th is the no. of the skill in the tree (from top left to right, to bottom right). There are 12 (last index would be 11). 1st is the level
    //  */
    // templateSkills(obj, classId=this.getMyUser().charClassId) {
    //     let skills = this.getSkillsByClassId(classId, true);
    //     let val = [];

    //     for (let i = 0; i < obj.length; i++) {
    //         let [index, level] = obj[i];

    //         if (level < 1) continue;
    //         if (index < 0 && index > 11) throw Error(obj[i]);

    //         val.push([skills[index].skill.skillId, level]);
    //     }; return val;
    // }

    /**
     * @param {number} userId
     * @param {boolean} screwBattle
     * @returns {Promise<{ id: number, lvl: number }[]>}
     */
    async getUserSkills(userId: number, screwBattle=false) : Promise<{ id: number, lvl: number }[]> {
        if (userId === this.smartFox.myUserId && this.user._mySkills != null && Object.keys(this.user._mySkills).length) {
            return [];//this.user._mySkills.skills;
        } else {
            let playerSkills = this.swarm.resources.skills[userId];

            if (!this.battleOver && playerSkills != null && playerSkills && !screwBattle) {
                return playerSkills;
            } else {
                /**
                 * @type {Array}
                 */
                let skills = waitFor(this.smartFox, "user_skills", [1, userId], 3500);//.catch(err => { return {error: err} });

                //if (leaders == null || !Array.isArray(leaders)) return Promise.reject(new Error("Errored trying to fetch leaderboard", leaders));
                this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_USER_SKILLS, { userId }, 1, "json");

                return skills.then(v => {
                    if (v.success) return v.value;
                    else return [];
                })
            }
        }
    }

    /**
     * @param {number} userId
     * @param {boolean} screwBattle
     * @returns {Promise<{user: number, b1: number, b2: number, bj: number, w1: number, w2: number, wj: number, wn: number, fresh: boolean}>}
     */
    async getUserRecord(userId: number, screwBattle=true) : Promise<WaitForResult<Omit<IUserRecord, "char_id">>> {
        // if (this.user._myRecord != null && userId == this.smartFox.myUserId) return this.user._myRecord;

        // let loadFresh = screwBattle || (this.battleOver && !this.smartFox.getActiveRoom().isBattle);

        // if (!loadFresh) {
        //     let playerRecord = this.user._playerRecords[userId];

        //     if (playerRecord != null) return this.user._playerRecords[userId];
        //     else loadFresh = true;
        // }

        let urr = this.swarm.resources.records[userId];
        if (urr) {
            // 1 hour cache
            if ((urr.last_fetched.getTime() + 60000*60) > Date.now()) return { success: true, value: urr };//{...urr[1], fresh: false};
        }

        const wait = waitFor(this.smartFox, "user_record", [1, userId], 3500);

        //if (leaders == null || !Array.isArray(leaders)) return Promise.reject(new Error("Errored trying to fetch leaderboard", leaders));
        this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_USER_RECORD, { userId }, 1, "json");

        return wait;
    }
      

    // /**
    //  * NOT TO BE CONFUSED WITH THE TOURNAMENT!
    //  * @param {number} index Refer to static indexes please
    //  */
    // async fetchLeaders(index=1) {
    //     let cache = this.cache['leader_' + index];

    //     if (cache != null) {
    //         if ([1, 2, 16, 11, 14, 13, 8, 9, 19, 7, 10, 12, 21, 22].some(a => a === index)) {
    //             if (cache[0] + (1000 * 60 * 5) > Date.now()) {
    //                 return cache[1];
    //             }
    //         } else if (cache[0] + (60 * 1000) > Date.now()) {
    //             return cache[1];
    //             //return cache[1];
    //         }
    //     }

    //     this.debug("Fetching leaders...");
    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_GET_LEADERS, {v: index}, 1, "json");
    //     /**
    //      * @type {Array}
    //      */
    //     let leaders = (await WaitForStream(this.smartFox, "get_leaders", [2, index], [""], 3500));

    //     if (leaders == null || !Array.isArray(leaders)) return Promise.reject(new Error("Errored trying to fetch leaderboard", leaders));

    //     if (leaders.length <= 3) return [];

    //     const version = parseInt(leaders[2], "$");
    //     let splitIndex = getIndexesOf(leaders, "$")[0];

    //     let result = [];
    //     let brags = leaders.slice(3, splitIndex);
    //     let smalls = leaders.slice(splitIndex + 1); 
    //     let name = '';

    //     switch (version) {
    //         case 1: case 2: case 16:
    //             // ["charName","charWins1","charBat1","charExp","charLvl","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"]
    //             for (let i = 0; i < brags.length; i++) {
    //                 result.push({
    //                     name: brags[i],
    //                     wins: parseInt(brags[++i]),
    //                     bat: parseInt(brags[++i]),
    //                     exp: parseInt(brags[++i]),
    //                     misc: {
    //                         lvl: parseInt(brags[++i]),
    //                         gender: (brags[++i]),
    //                         classId: parseInt(brags[++i]),
    //                         pri: (brags[++i]),
    //                         sec: (brags[++i]),
    //                         hair: (brags[++i]),
    //                         skin: (brags[++i]),
    //                         accnt: (brags[++i]),
    //                         accnt2: (brags[++i]),
    //                         eye: (brags[++i]),
    //                         arm: parseInt(brags[++i]),
    //                         hairS: parseInt(brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 result.push({
    //                     name: smalls[i],
    //                     wins: parseInt(smalls[++i]),
    //                     bat: parseInt(smalls[++i]),
    //                     exp: parseInt(smalls[++i]),
    //                     misc: {}
    //                 });
    //             }

    //             break;
    //         case 3: case 4: case 17:
    //             // ["dailyWins1","dailyBat1","charName","charExp","charLvl","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"]

    //             for (let i = 0; i < brags.length; i++) {
    //                 result.push({
    //                     wins: parseInt(brags[i]),
    //                     bat: parseInt(brags[++i]),
    //                     name: brags[++i],
    //                     exp: parseInt(brags[++i]),
    //                     misc: {
    //                         lvl: parseInt(brags[++i]),
    //                         gender: (brags[++i]),
    //                         classId: parseInt(brags[++i]),
    //                         pri: (brags[++i]),
    //                         sec: (brags[++i]),
    //                         hair: (brags[++i]),
    //                         skin: (brags[++i]),
    //                         accnt: (brags[++i]),
    //                         accnt2: (brags[++i]),
    //                         eye: (brags[++i]),
    //                         arm: parseInt(brags[++i]),
    //                         hairS: parseInt(brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 result.push({
    //                     wins: parseInt(smalls[i]),
    //                     bat: parseInt(smalls[++i]),
    //                     name: smalls[++i],
    //                     exp: parseInt(smalls[++i]),
    //                     misc: {}
    //                 });
    //             }

    //             break;
    //         case 5: case 6: case 18:
    //             // ["dailyWins1","dailyBat1","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
    //             // ["dailyWins1","dailyBat1","fctName"]

    //             for (let i = 0; i < brags.length; i++) {
    //                 result.push({
    //                     wins: parseInt(brags[i]),
    //                     bat: parseInt(brags[++i]),
    //                     name: brags[++i],
    //                     misc: {
    //                         align: (brags[++i] === "1") ? "Exile" : "Legion",
    //                         symb: (brags[++i]),
    //                         symbClr: (brags[++i]),
    //                         back: (brags[++i]),
    //                         backClr: (brags[++i]),
    //                         flagClr: (brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 result.push({
    //                     wins: parseInt(smalls[i]),
    //                     bat: parseInt(smalls[++i]),
    //                     name: smalls[++i],
    //                     misc: {}
    //                 });
    //             }

    //             break;
    //         case 7:
    //             // ["fctDom","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
    //             // ["fctDom","fctName"]

    //             for (let i = 0; i < brags.length; i++) {
    //                 result.push({
    //                     dom: parseInt(brags[i]),
    //                     name: brags[++i],
    //                     misc: {
    //                         align: (brags[++i] === "1") ? "Exile" : "Legion",
    //                         symb: (brags[++i]),
    //                         symbClr: (brags[++i]),
    //                         back: (brags[++i]),
    //                         backClr: (brags[++i]),
    //                         flagClr: (brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 result.push({
    //                     dom: parseInt(smalls[i]),
    //                     name: smalls[++i],
    //                     misc: {}
    //                 });
    //             }
    //             break;
    //         case 8: case 9: case 19:
    //             // ["fctLead1","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
    //             // ["fctLead1","fctName"]

    //             for (let i = 0; i < brags.length; i++) {
    //                 result.push({
    //                     lead: parseInt(brags[i]),
    //                     name: brags[++i],
    //                     misc: {
    //                         align: (brags[++i] === "1") ? "Exile" : "Legion",
    //                         symb: (brags[++i]),
    //                         symbClr: (brags[++i]),
    //                         back: (brags[++i]),
    //                         backClr: (brags[++i]),
    //                         flagClr: (brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 result.push({
    //                     lead: parseInt(smalls[i]),
    //                     name: smalls[++i],
    //                     misc: {}
    //                 });
    //             }
    //             break;
    //         case 10: case 12:
    //             // ["fctFlagCap","fctName","fctAlign","fctSymb","fctSymbClr","fctBack","fctBackClr","fctFlagClr"]
    //             // ["fctFlagCap","fctName"]
    //             name = (version === 10) ? "cap" : "influence";

    //             for (let i = 0; i < brags.length; i++) {
    //                 let obj = {};

    //                 obj[name] = brags[i];
    //                 obj['name'] = (brags[++i]);

    //                 result.push({
    //                     ...obj,
    //                     misc: {
    //                         align: (brags[++i] === "1") ? "Exile" : "Legion",
    //                         symb: (brags[++i]),
    //                         symbClr: (brags[++i]),
    //                         back: (brags[++i]),
    //                         backClr: (brags[++i]),
    //                         flagClr: (brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 let obj = {};

    //                 obj[name] = smalls[i];
    //                 obj['name'] = (smalls[++i]);

    //                 result.push({
    //                     ...obj,
    //                     misc: {}
    //                 });
    //             }

    //             break;
    //         case 11: case 13: case 14: case 15: case 20: case 21: case 22:
    //             // "charName","charTotalInfluence","charLvl","charExp","charGender","charClassId","charPri","charSec","charHair","charSkin","charAccnt","charAccnt2","charEye","charArm","charHairS"
    //             // "charName","charTotalInfluence"

    //             name = (version === 11) ? "influence" : (version === 13) ? "rarity" : (version === 14 || version === 15) ? "fame" : (version === 20 || version === 21) ? "redeems" : (version === 22) ? "rating" : "";

    //             for (let i = 0; i < brags.length; i++) {
    //                 let obj = {};

    //                 obj['name'] = brags[i];
    //                 obj[name] = parseInt(brags[++i]);

    //                 result.push({
    //                     ...obj,
    //                     misc: {
    //                         lvl: parseInt(brags[++i]),
    //                         exp: parseInt(brags[++i]),
    //                         gender: (brags[++i]),
    //                         classId: parseInt(brags[++i]),
    //                         pri: (brags[++i]),
    //                         sec: (brags[++i]),
    //                         hair: (brags[++i]),
    //                         skin: (brags[++i]),
    //                         accnt: (brags[++i]),
    //                         accnt2: (brags[++i]),
    //                         eye: (brags[++i]),
    //                         arm: parseInt(brags[++i]),
    //                         hairS: parseInt(brags[++i])
    //                     }
    //                 });
    //             }

    //             for (let i = 0; i < smalls.length; i++) {
    //                 let obj = {};

    //                 obj['name'] = smalls[i];
    //                 obj[name] = parseInt(smalls[++i]);

    //                 result.push({
    //                     ...obj,
    //                     misc: {}
    //                 });
    //             }

    //             break;
    //     }

    //     this.cache["leader_" + index] = [Date.now(), result];

    //     return result;
    // }

    // /**
    //  * Note that ED for some reason doesn't keep a list of tournament, so when you request a tournament detail and stuff, you'd only receive the recent.
    //  * @returns {Promise<{}>}
    //  */
    // async fetchTournament() {
    //     let cache = [this.cache['tournament_details'], this.cache['tournament_leaders']];

    //     /*if (cache[0] && cache[1] && cache[0][0] + (1000 * 5) > Date.now()) {

    //     }*/

    //     if (cache[0] != null && cache[1] != null) {
    //         if (Array.isArray(cache[1]) && (cache[0][0] + (1000 * 5) > Date.now() || (cache[0][1].fetchedAt + (cache[0][1].minsTilStart * 60000)) > Date.now())) {
    //             //console.log(Array.isArray(cache[0]), Array.isArray(cache[1]), cache[0][0] + (1000 * 5) > Date.now(), (cache[0][1].fetchedAt + cache[0][1].minsTilStart) > Date.now());
    //             return {details: cache[0][1], leaders: cache[1][1]};
    //         }
    //     }

    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_LEADERS, {}, 1, "json");
    //     this.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_DETAILS, {}, 1, "json");

    //     let leaders = WaitForStream(this.smartFox, "tournament_leaders", undefined, [""], 3000).catch((err) => {/* do smth about error */ return null;});
    //     let details = await WaitForStream(this.smartFox, "tournament_details", undefined, [""], 3000).catch((err) => {/* do smth about error */ return null;});
    //     leaders = await leaders;

    //     // yes im aware of promise.all, but i cba

    //     if (leaders === null || details === null) return Promise.reject(new Error("Could not fetch tournament data"));
    //     if (!(Array.isArray(leaders) && Array.isArray(details))) return Promise.reject(new Error("Tournament data received in unexpected format."));

    //     leaders = leaders.slice(2);
    //     details = details;

    //     let result = {
    //         details: {
    //             name: details[2],
    //             active: details[3] === "1",
    //             minsTilStart: parseInt(details[4]),
    //             minsTilEnd: parseInt(details[5]),
    //             fetchedAt: Date.now()
    //         },
    //         leaders: []
    //     };

    //     for (let i = 0; i <= leaders.length - 2; i++) {
    //         result.leaders.push({
    //             name: leaders[i],
    //             score: parseInt(leaders[++i])
    //         });
    //     }

    //     this.cache['tournament_details'] = [Date.now(), result.details];
    //     this.cache['tournament_leaders'] = [Date.now(), result.leaders];

    //     return result;
    // }

    async redeemCode(code: string) : Promise<{ status: true, prizes: RedeemedPrizes}|{ status: false, details: "Invalid code"|"Expired code"|"Level too high"|"Level too low"|"Already redeemed"|"Timeout" }> {

        const waited = waitFor(this.smartFox, "redeem_code", undefined, 3000);
        this.smartFox.sendXtMessage("main", Requests.REQUEST_SUBMIT_CODE, {code: code}, 1, "json");

        return waited.then(v => {
            if (v.success) {
                const val = v.value;

                if (val.ok < 0) {
                    let errorMsg = '';
        
                    switch (val.ok) {
                        case -1: errorMsg = "Invalid code"; break;
                        case -2: errorMsg = "Expired code"; break;
                        case -3: errorMsg = "Level too high"; break;
                        case -4: errorMsg = "Level too low"; break;
                        case -5: errorMsg = "Already redeemed"; break;
                    }
        
                    return { details: errorMsg as "Invalid code", status: false } as { details: "Invalid code", status: false };//Promise.reject((errorMsg));
                }

                let prizes:RedeemedPrizes = [];

                loop: for (let i = 0, len = val.prizeList.length; i < len; i++) {
                    const obj = val.prizeList[i];

                    switch (obj.type) {
                        case Constants.REDEEM_PRIZE_TYPE_ITEM:
                            prizes.push({ type: "item", item: this.boxes.item.objMap.get(obj.id) as AnyItemRecordsExceptSelf });
                            continue loop;
                        case Constants.REDEEM_PRIZE_TYPE_HOME_ITEM:
                            prizes.push({ type: "home", id: obj.id });
                            continue loop;
                        case Constants.REDEEM_PRIZE_TYPE_CREDITS:
                            prizes.push({ type: "credits", amount: obj.id });
                            continue loop;
                        
                    }
                }

                return { status: true, prizes } as { status: true, prizes: RedeemedPrizes };
            } else return { status: false, details: v.reason } as { status: false, details: "Invalid code" };
        });
    }

    /**
     * If in standalone mode, the database check will be prohibited, so there won't be a fallback to database if the id given is a name and the character is not in the room.
     * @param {number|string} id 
     * @param {boolean} isName Exact name, caps sensitive (despite there being no caps in the game)
     * @param {boolean} fallbackToDb only if isName is provided
     */
    async fameCharacter(id: number | string, isName=false, fallbackToDb=true) : Promise<WaitForResult<{ success: number, name: string }>> {
        let charId = id;

        // if (this.manager.standalone) fallbackToDb = false;
        if (isName) {
            let room = this.smartFox.getActiveRoom();

            if (room == null && !fallbackToDb) {
                return Promise.reject(new Error("Character cannot be found as fallback is false, and you're not in a room."));
            } else if (room == null && fallbackToDb === true) {
                let char = await DatabaseManager.cli.query<{ id: number }>(`SELECT id FROM character WHERE name = $1`, [id])//this.manager._database.cli.query(`SELECT id FROM character WHERE name = $1`, [id])
                    .then(v => v.rows).catch((err) => { Logger.getLogger("Fame").error(err); return null; });//this.manager._logger.error(err); return null;});

                if (!char || !char.length) return Promise.reject(new Error("Character not found in database."));

                charId = char[0].id;
            } else if (room) {
                let sfsUser = find(room.getUserList(), v => v.charName === id);

                if (!sfsUser && !fallbackToDb) return Promise.reject(new Error("Character not found in room."));
                if (!sfsUser) { 
                    let char = await await DatabaseManager.cli.query<{ id: number }>(`SELECT id FROM character WHERE name = $1`, [id])//this.manager._database.cli.query(`SELECT id FROM character WHERE name = $1`, [id])
                        .then(v => v.rows).catch((err) => { Logger.getLogger("Fame").error(err); return null; });//this.manager._logger.error(err); return null;});

                    if (!char || !char.length) return Promise.reject(new Error("Character not found in database."));

                    charId = char[0].id;
                } else charId = sfsUser.charId;
            } else {
                return Promise.reject(new Error("idk how."));
            }
        }

        if (typeof charId === "string") return { success: false, reason: "Non existent character." };

        const waited = waitFor(this.smartFox, "fame", undefined, 3500);
        this.smartFox.sendXtMessage("main", Requests.REQUEST_GIVE_FAME, { charId }, 2, "json");

        return waited;
    }
}

export type RedeemedPrizes = Array<{ type: "item", item: AnyItemRecordsExceptSelf }|{ type: "home", id: number }|{ type: "credits", amount: number }>;