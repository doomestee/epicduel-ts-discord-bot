import { decodeEntities, reserialize } from "../../../util/XML.js";
import type SmartFoxClient from "../SFSClient.js";
import SFSEvent from "../SFSEvent.js";
import Room from "../data/Room.js";
import User from "../data/User.js";

type GenericFunc = (this: SysHandler, o: any) => void;

// I wanted to kill myself after typing this by hand
interface HandlersTable {
    apiOK: GenericFunc;
    apiKO: GenericFunc;
    logOK: GenericFunc;
    logKO: GenericFunc;
    logout: GenericFunc;
    rmList: GenericFunc;
    uCount: GenericFunc;
    joinOK: GenericFunc;
    joinKO: GenericFunc;
    uER: GenericFunc;
    userGone: GenericFunc;
    pubMsg: GenericFunc;
    prvMsg: GenericFunc;
    dmnMsg: GenericFunc;
    modMsg: GenericFunc;
    dataObj: GenericFunc;
    rVarsUpdate: GenericFunc;
    roomAdd: GenericFunc;
    roomDel: GenericFunc;
    rndK: GenericFunc;
    roundTripRes: GenericFunc;
    uVarsUpdate: GenericFunc;
    createRmKO: GenericFunc;
    leaveRoom: GenericFunc;
}

type EventType = keyof HandlersTable;

export default class SysHandler {
    client: SmartFoxClient;
    handlersTable!: HandlersTable;

    constructor(cli: SmartFoxClient) {
        this.client = cli;
        this.handlersTable = {
            "apiOK": this.handleApiOK,
            "apiKO": this.handleApiKO,
            "logOK": this.handleLoginOk,
            "logKO": this.handleLoginKo,
            "logout": this.handleLogout,
            "rmList": this.handleRoomList,
            "uCount": this.handleUserCountChange,
            "joinOK": this.handleJoinOk,
            "joinKO": this.handleJoinKo,
            "uER": this.handleUserEnterRoom,
            "userGone": this.handleUserLeaveRoom,
            "pubMsg": this.handlePublicMessage,
            "prvMsg": this.handlePrivateMessage,
            "dmnMsg": this.handleAdminMessage,
            "modMsg": this.handleModMessage,
            "dataObj": this.handleASObject,
            "rVarsUpdate": this.handleRoomVarsUpdate,
            "roomAdd": this.handleRoomAdded,
            "roomDel": this.handleRoomDeleted,
            "rndK": this.handleRandomKey,
            "roundTripRes": this.handleRoundTripBench,
            "uVarsUpdate": this.handleUserVarsUpdate,
            "createRmKO": this.handleCreateRoomError,
            "leaveRoom": this.handleLeaveRoom,
        };
    }

    handleMessage(msgObj: any, type: string) {
        const fn = this.handlersTable[msgObj.body['@action'] as EventType];

        if (fn) {
            // console.debug(msgObj);
            fn.apply(this, [msgObj]);
        }
    }

    handleApiOK(o: any) {
        this.client.connected = true;
        this.client.emit("onConnection", { success: true });
        // this.client.emit(SFSEvent.onConnection, new SFSEvent(SFSEvent.onConnection, { success: true }));
    }

    handleApiKO(o: any) {
        this.client.emit("onConnection", { success: false, error: "API are obsolete, please upgrade" });
        // this.client.emit(SFSEvent.onConnection, new SFSEvent(SFSEvent.onConnection, {success: false, error: "API are obsolete, please upgrade"}));
    }

    handleLoginOk(o: any) {
        const [uid, mod, name] = [Number(o.body.login['@id']), Number(o.body.login['@mod']), o.body.login['@n']];
        this.client.amIModerator = mod == 1;
        this.client.myUserId = uid;
        this.client.myUserName = name;
        this.client.playerId = -1;

        this.client.emit("onLogin", { success: true, name, error: "" });
        // this.client.emit(SFSEvent.onLogin, new SFSEvent(SFSEvent.onLogin, {success: true, name: name, error: ""}));
    }

    handleLoginKo(o: any) {
        this.client.emit("onLogin", { success: false, error: o.body.login["@e"] });
        // this.client.emit(SFSEvent.onLogin, new SFSEvent(SFSEvent.onLogin, {success: false, error: o.body.login['@e']}));
    }

    handleLogout(o: any) {
        this.client.initialize(true);
        this.client.emit("onLogout", {});
        // this.client.emit(SFSEvent.onLogout, new SFSEvent(SFSEvent.onLogout, {}));
    }

    handleRoomList(o: any) {
        let roomList = this.client.roomList;
        let count = {delete: 0, room: 0};

        // for (let i = 0, len = roomList.size; i < len; i++) {
        //     roomList.delete[i];
        //     count.delete++;
        // }
        roomList.clear();

        //let keys = Object.keys(o.body.rmList["rm"]);
        //for (let i = 0; i < keys.length; i++) {
        //if (o.body.rmList && !Array.isArray(o.body.rmList)) o.body.rmList = [o.body.rmList];

        // console.debug(o.body.rmList);

        for (let i in o.body.rmList) {
            //let xml = o.body.rmList["rm"][keys[i]];
            let xml = o.body.rmList[i];
            // console.debug(xml);
            //console.log(xml);

            let roomId = Number(xml['@id']);
            let room = new Room(roomId, xml.n,Number(xml['@maxu']),Number(xml['@maxs']),xml['@temp'] == "1",xml['@game'] == "1",xml['@priv'] == "1",xml['@lmb'] == "1",Number(xml['@ucnt']),Number(xml['@scnt']))

            if (xml.vars && xml.vars.toString().length > 0) {
                this.populateVariables(room.variables, xml);
            }

            // roomList[xml['@id']] = room;
            roomList.set(roomId, room);
        }

        count.room = roomList.size;

        //keys = Object.keys(roomList);
        //for (let i in roomList) {
            
        //}

        this.client.emit("onRoomListUpdate", { roomList: Array.from(this.client.roomList.values()) });
        // this.client.emit(SFSEvent.onRoomListUpdate, new SFSEvent(SFSEvent.onRoomListUpdate, {roomList: roomList}));
    }

    handleUserCountChange(o: any) {
        const [uCount, sCount, roomId] = [o.body['@u'], o.body['@s'], o.body['@r']].map((x) => { return Number(x); });
        const room = this.client.roomList.get(roomId);

        if (room != null) {
            room.setUserCount(uCount);
            room.setSpectatorCount(sCount);

            this.client.emit("onUserCountChange", { room });
            // this.client.emit(SFSEvent.onUserCountChange, new SFSEvent(SFSEvent.onUserCountChange, {room: room}));
        }
    }

    handleJoinOk(o: any) {
        const [roomId, roomVarsXml, playerId] = [Number(o.body['@r']), o.body, Number(o.body.pid['@id'])];
        let [userListXml] = [o.body.uLs.u];
        this.client.activeRoomId = roomId;
        // const joinedAt = new Date();

        const currRoom = this.client.getRoom(roomId);
        const roomList = Array.from(this.client.roomList.values());

        for (let i = 0; i < roomList.length; i++) {
            roomList[i].clearUserList();
        }

        this.client.playerId = playerId;
        currRoom?.setMyPlayerIndex(playerId);

        if (currRoom && roomVarsXml.vars && roomVarsXml.vars.toString().length > 0) {
            currRoom.clearVariables();
            this.populateVariables(currRoom.variables, roomVarsXml);
        }

        let looped = false;

        if (userListXml && userListXml['@i']) {
            userListXml = [userListXml];
        }

        for (let usra in userListXml) {
            const usr = userListXml[usra];

            const [name, id, isMod, isSpec, pId] = [usr.n, Number(usr['@i']), usr['@m'] == "1", usr['@s'] == "1", usr['@p'] == null ? -1 : Number(usr['@p'])];
            const user = new User(id, name ?? ""); // shit ass ed server not sending name sometimes

            user.setModerator(isMod);//.setModerator(isMod);
            user.setIsSpectator(isSpec);
            user.setPlayerId(pId);

            if (usr.vars && usr.vars.toString().length > 0) {
                this.populateVariables(user.variables, usr);
            }

            if (user.charId === undefined && user.npcId === -1) {
                // if (!looped) //Logger.getLoggerP(this.settings.id).debug(dataObj);
                // if (!looped) this.client.client.manager._logger.error(o.body);

                looped = true;
            } else { 
                currRoom?.addUser(user);
                // this.client.client.manager.logEmit("epicduel_userlist_update", 1, {length: userListXml.length}, user, true);
            }

            if (user.name === "") {
                user.name = "u" + user.userId;
            }
        }

        // this.client.client.manager.logEmit("epicduel_join_room", currRoom, joinedAt);

        this.client.changingRoom = false;

        this.client.emit("onJoinRoom", { room: currRoom });
        // this.client.emit(SFSEvent.onJoinRoom, new SFSEvent(SFSEvent.onJoinRoom, {room: currRoom}));
    }

    handleJoinKo(o: any) {
        this.client.changingRoom = false;
        this.client.emit("onJoinRoomError", { error: o.body.error['@msg'] });
        // this.client.emit(SFSEvent.onJoinRoomError, new SFSEvent(SFSEvent.onJoinRoomError, {error: o.body.error['@msg']}));
    }

    handleUserEnterRoom(o: any) {
        const [roomId, usrId, usrName, isMod, isSpec, pid] = [Number(o.body['@r']), Number(o.body.u['@i']), o.body.u.n, o.body.u['@m'] == "1", o.body.u['@s'] == "1", o.body.u['@p'] == null ? -1 : Number(o.body.u['@p'])];

        const currRoom = this.client.getRoom(roomId);
        const newUser = new User(usrId, usrName);
        newUser.setModerator(isMod);
        newUser.setIsSpectator(isSpec);
        newUser.setPlayerId(pid);
        currRoom?.addUser(newUser);
        if (o.body.u.vars && o.body.u.vars.toString().length > 0) {
            this.populateVariables(newUser.variables, o.body.u);
        }

        // this.client.client.manager.logEmit("epicduel_userlist_update", 1, currRoom.userList, newUser, false);
        this.client.emit("onUserEnterRoom", { roomId: roomId, user: newUser });
        // this.client.emit(SFSEvent.onUserEnterRoom, new SFSEvent(SFSEvent.onUserEnterRoom, {roomId: roomId, user: newUser}));
    }

    handleUserLeaveRoom(o: any) {
        const [userId, roomId] = [Number(o.body.user['@id']), Number(o.body['@r'])];
        const theRoom = this.client.getRoom(roomId);

        if (theRoom == null) return; // idk rip

        let uName = theRoom.getUser(userId)?.getName();
        
        // this.client.client.manager.logEmit("epicduel_userlist_update", 2, theRoom.userList, theRoom.getUser(userId));

        let user = theRoom.getUser(userId);

        if (theRoom != null) {
            theRoom.removeUser(userId);
        }
        
        this.client.emit("onUserLeaveRoom", { roomId, userId, userName: uName, user });
        // this.client.emit(SFSEvent.onUserLeaveRoom, new SFSEvent(SFSEvent.onUserLeaveRoom, {roomId: roomId, userId: userId, userName: uName}));
    }

    handlePublicMessage(o: any) {
        const [roomId, userId] = [Number(o.body['@r']), Number(o.body.user['@id'])];
        let message = o.body.txt;
        const sender = this.client.getRoom(roomId)?.getUser(userId);

        if (typeof (message) == "object" || Array.isArray(message)) message = JSON.stringify(message);

        // this.client.client.manager.logEmit("epicduel_chat", message, sender);

        this.client.emit("onPublicMessage", { roomId, userId: userId, message });
        // this.client.emit(SFSEvent.onPublicMessage, new SFSEvent(SFSEvent.onPublicMessage, {roomId: roomId, sender: sender, message: message}));
    }

    handlePrivateMessage(o: any) {
        const [roomId, userId, message] = [Number(o.body['@r']), Number(o.body.user['@id']), o.body.txt];

        this.client.emit("onPublicMessage", { roomId, userId: userId, message: decodeEntities(message) });
        // this.client.emit(SFSEvent.onPrivateMessage, new SFSEvent(SFSEvent.onPrivateMessage, {roomId: roomId, userId: userId, message: decodeEntities(message)}));
    }

    handleAdminMessage(o: any) {
        const [roomId, userId, message] = [Number(o.body['@r']), Number(o.body.user['@id']), o.body.txt];

        this.client.emit("onAdminMessage", { roomId, userId: userId, message: decodeEntities(message) });
        // this.client.emit(SFSEvent.onAdminMessage, new SFSEvent(SFSEvent.onAdminMessage, {roomId: roomId, userId: userId, message: decodeEntities(message)}));
    }

    handleModMessage(o: any) {
        const [roomId, userId, message] = [Number(o.body['@r']), Number(o.body.user['@id']), o.body.txt];
        const room = this.client.getRoom(roomId);

        // const params = {message: decodeEntities(message)};

        // if (room != null) {
        //     params.sender = room.getUser(userId);
        // }

        this.client.emit("onModeratorMessage", { message: decodeEntities(message), sender: room?.getUser(userId) ?? null });
        // this.client.emit(SFSEvent.onModeratorMessage, new SFSEvent(SFSEvent.onModeratorMessage, params));
    }

    handleASObject(o: any) {
        const [roomId, userId, xmlStr] = [Number(o.body['@r']), Number(o.body.user['@id']), o.body.dataObj];
        const sender = this.client.getRoom(roomId)?.getUser(userId);

        const asObj = reserialize(xmlStr);

        this.client.emit("onObjectReceived", { sender: sender ?? null, obj: asObj });
        // this.client.emit(SFSEvent.onObjectReceived, new SFSEvent(SFSEvent.onObjectReceived, {sender: sender, obj: asObj}));
    }

    handleRoomVarsUpdate(o: any) {
        const [roomId] = [Number(o.body['@r'])];
        const currRoom = this.client.getRoom(roomId);

        if (!currRoom) return;

        let changedVars = {} as { [x: string]: boolean };
        if (o.body.vars && o.body.vars.toString().length > 0) {
            this.populateVariables(currRoom.variables, o.body, changedVars);
        }

        this.client.emit("onRoomVariablesUpdate", { room: currRoom, changedVars: changedVars })
        // this.client.emit(SFSEvent.onRoomVariablesUpdate, new SFSEvent(SFSEvent.onRoomVariablesUpdate, {room: currRoom, changedVars: changedVars}));
    }

    handleUserVarsUpdate(o: any) {
        const [userId] = [Number(o.body.user['@id'])];

        let returnUser: User | null = null;
        let changedVars = {} as { [x: string]: boolean };

        if (o.body.vars && o.body.vars.toString().length > 0) {
            const rooms = this.client.getRoomList();

            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];

                if (room == null) continue;

                let varOwner = room.getUser(userId);
                if (varOwner != null) {
                    if (returnUser === null) {
                        returnUser = varOwner;
                    }

                    changedVars = {};
                    this.populateVariables(varOwner.variables, o.body, changedVars);
                }
            }

            if (returnUser) this.client.emit("onUserVariablesUpdate", { user: returnUser, changedVars });
            // this.client.emit(SFSEvent.onUserVariablesUpdate, new SFSEvent(SFSEvent.onUserVariablesUpdate, {user: returnUser, changedVars: changedVars}));
        }
    }

    handleRoomAdded(o: any) {
        const [rId, rName, rMax, rSpec, isTemp, isGame, isPriv, isLimbo] = [Number(o.body.rm['@id']), o.body.rm.name as string, Number(o.body.rm['@max']), Number(o.body.rm['@spec']), o.body.rm['@temp'] == "1", o.body.rm['@game'] == "1", o.body.rm['@priv'] == "1", o.body.rm['@limbo'] == "1"];

        const newRoom = new Room(rId, rName, rMax, rSpec, isTemp, isGame, isPriv, isLimbo);

        const rList = this.client.roomList;

        rList.set(rId, newRoom);

        // rList[rId] = newRoom;
        if (o.body.rm.vars && o.body.rm.vars.toString().length > 0) {
            this.populateVariables(newRoom.variables, o.body.rm);
        }

        this.client.emit("onRoomAdded", { room: newRoom });
        // this.client.emit(SFSEvent.onRoomAdded, new SFSEvent(SFSEvent.onRoomAdded, {room: newRoom}));
    }

    handleRoomDeleted(o: any) {
        const [roomId] = [Number(o.body.rm['@id'])];
        const roomList = this.client.roomList;

        const room = roomList.get(roomId);

        roomList.delete(roomId);

        // const params = {room: roomList[roomId]};

        // delete roomList[roomId];
        if (room) this.client.emit("onRoomDeleted", { room: room });
        // this.client.emit(SFSEvent.onRoomDeleted, new SFSEvent(SFSEvent.onRoomDeleted, params)); 
    }

    handleRandomKey(o: any) {
        let key = o.body.k.toString() as string;

        this.client.emit("onRandomKey", { key });
        // this.client.emit(SFSEvent.onRandomKey, new SFSEvent(SFSEvent.onRandomKey, {key: key}));
    }

    handleRoundTripBench(o: any) {
        const now = Date.now();
        const res = now - this.client.getBenchStartTime();

        this.client.emit("onRoundTripResponse", { elapsed: res });
        // this.client.emit(SFSEvent.onRoundTripResponse, new SFSEvent(SFSEvent.onRoundTripResponse, {elapsed: res}));
    }

    handleCreateRoomError(o: any) {
        const [errMsg] = [o.body.room['@e']];

        this.client.emit("onCreateRoomError", { error: errMsg });
        // this.client.emit(SFSEvent.onCreateRoomError, new SFSEvent(SFSEvent.onCreateRoomError, {error: errMsg}));
    }

    handleLeaveRoom(o: any) {
        const [roomLeft] = [Number(o.body.rm['@id'])];

        this.client.emit("onRoomLeft", { roomId: roomLeft });
        // this.client.emit(SFSEvent.onRoomLeft, new SFSEvent(SFSEvent.onRoomLeft, {roomId: roomLeft}));
    }

    /**
     * @param {Array} changedVars 
     */
    populateVariables(variables: any, xmlData: any, changedVars: {[x: string]: boolean } | null =null) {
        let keys = Object.keys(xmlData.vars[0]["var"]);
        for (let i = 0; i < keys.length; i++) {
            let v = xmlData.vars[0]["var"][keys[i]];

            let [vName, vType, vValue] = [v['@n'], v['@t'], v['__cdata']];

            if (changedVars != null) {
                // changedVars.push(vName);
                changedVars[vName] = true;
            }
            if (vType == "b") variables[vName] = vValue == "1" ? true : false;
            else if (vType == "n") variables[vName] = Number(vValue);
            else if (vType == "s") variables[vName] = vValue;
            else if (vType == "x") delete variables[vName];

        }
    }

    dispatchDisconnection(dp=null) {
        this.client.emit("onConnectionLost", { discParams: dp });
        // this.client.emit(SFSEvent.onConnectionLost, new SFSEvent(SFSEvent.onConnectionLost, {discParams: dp}));
    }
}