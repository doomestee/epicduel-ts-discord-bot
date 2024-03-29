import Server from "./Server.js";
import CharacterRecord from "./record/CharacterRecord.js";

export default class User {
    charRecord!: CharacterRecord;

    loggedIn: boolean;
    session: string;
    userid: number;
    playerid: number;
    username: string;
    password: string;
    userPriv: number;
    userAge: number;
    gameStarted: boolean;
    _startRoom: string;
    _myCharId: number;
    _myInvLimit: number;
    _myBankLimit: number;
    _charGender: string;
    _initCharWarAlign: number;
    _loginWinRatio: number;
    _loginBattleTotal: number;
    _chatBlock: boolean;
    initialisedAt: number;
    connectedAt: number;
    _activeServer: string;
    _showNew: boolean;
    _myBattleCount: number;
    _inBattle: boolean;
    _myBattleSlot: number;
    _myBattleActor: null;
    _levelingUp: boolean;
    _warpIn: boolean;
    _isMoving: boolean;
    _forceRetrain: boolean;
    _buddyListSize: number;
    _playerSkills: never[];
    _playerRecords: never[];
    _mySkills: {};
    _myRecord: {};
    _worldIndex: number;
    _lastRoom: string;
    _currentRoomFullName: string;
    _currentRoomFileName: string;
    _currentRoomBaseName: string;
    _returnFromBattleRoomName: string;
    _returnFromHomeRoomName: string;
    _returnFromHomeX: number;
    _returnFromHomeY: number;
    _savedX: number;
    _savedY: number;
    _arrivalX: number;
    _arrivalY: number;
    _ignoreUsers: never[];
    _allySfsId: number;
    _allyCharId: number;
    _challengeTargetId: number;
    _myCharScaleX: number;
    _onHotSpot: boolean;
    _firstAvatarSetup: boolean;
    _firstLaunch: boolean;
    _gameStarted: boolean;
    _cleanShutdown: boolean;
    servers: Server[];
    userRecord: any;
    userId: any;

    constructor(obj: { [x: string]: string }) {
        this.loggedIn = Boolean(obj.loggedIn) || false;
        this.session = obj.session;
        this.userid = parseInt(obj.userid);
        this.playerid = parseInt(obj.playerid);
        this.username = obj.username;
        this.password = obj.password;
        this.userPriv = parseInt(obj.userPriv);
        this.userAge = parseInt(obj.userAge);

        /* Custom */
        this.gameStarted = false;
        this._startRoom = "";
        this._myCharId = -1;
        this._myInvLimit = -1;
        this._myBankLimit = -1;
        this._charGender = '';
        this._loginWinRatio = 0;
        this._loginBattleTotal = 0;
        this._chatBlock = false;
        this.initialisedAt = Date.now();
        this.connectedAt = -1;

        this._activeServer = "";
      
        this._showNew = false;
        
        this._loginWinRatio = 0;
        
        this._loginBattleTotal = -1;
        
        this._myBattleCount = 0;
        
        this._inBattle = false;
        
        this._myBattleSlot = -1;
        
        /**
         * @type {import("../battle/BattleActor")}
         */
        this._myBattleActor = null;
        
        this._levelingUp = false;
        
        this._warpIn = true;
        
        this._isMoving = false;
        
        this._chatBlock = false;
        
        this._forceRetrain = false;
        
        this._myInvLimit = - 1;
        
        this._buddyListSize = -1;
        
        this._myBankLimit = -1;
        
        this._playerSkills = [];
        
        this._playerRecords = [];
        
        this._mySkills = {};
        
        this._myRecord = {};
        
        this._worldIndex = 0;
        
        this._lastRoom= "";
        
        this._currentRoomFullName= "";
        
        this._currentRoomFileName= "";
        
        this._currentRoomBaseName= "";
        
        this._returnFromBattleRoomName= "";
        
        this._returnFromHomeRoomName= "";
        
        this._returnFromHomeX = 0;
        
        this._returnFromHomeY = 0;
        
        this._savedX = 0;
        
        this._savedY = 0;
        
        this._arrivalX = 0;
        
        this._arrivalY = 0;
        
        this._ignoreUsers = [];
        
        this._allySfsId = -1;
        
        this._allyCharId = -1;
        
        //this._lastPoint:Point;
        
        this._challengeTargetId = -1;
        
        this._myCharScaleX = 0;
        
        this._onHotSpot = false;
        
        this._firstAvatarSetup = true;
        
        this._firstLaunch = true;
        
        this._gameStarted = false;
        
        this._cleanShutdown = false;
        
        this._initCharWarAlign = -1;
  
        this.servers = [];
    }
}