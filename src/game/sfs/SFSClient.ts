import { Socket } from "net";
import ByteArray from "../../util/ByteArray.js";
import Room from "./data/Room.js";
import { TypedEmitter } from "oceanic.js";
import { BothSFSClientEvents, SFSClientEvents } from "../../types/events.js";
import SysHandler from "./handlers/SysHandler.js";
import fastq from "fastq";
import { Requests, Responses } from "../Constants.js";
import { deserialize, encodeEntities, serialize } from "../../util/XML.js";
import ExtHandler from "./handlers/ExtHandler.js";
import Logger from "../../manager/logger.js";
import SwarmResources from "../../util/game/SwarmResources.js";

type SendHeader = { t: HandlerType };
type HandlerType = "sys" | "xt";

async function workerProcessData(this: SmartFoxClient, evt: Buffer) {
    let b = 0; let byteLength = evt.byteLength;

    //console.log(client.socket.readableLength);

    let loop = 0;

    //console.log("--------------")
    //console.log(evt.toString());
    //console.log("--------------");

    let bytes = []; let stop = false;
    let byteToAdd = 0;

    while (--byteLength >= 0) {
        b = evt.readUInt8(loop++);
        byteToAdd++;

        //console.log(b.toString(16));
        if (b != 0 && b != null) {
            if (byteLength < 2 && !stop) {
                // Not using buffer.writebytes because that's a lot more awful than I realised.
                this.buffer.hashexpand(byteToAdd);
    
                for (let i = 0; i < byteToAdd; i++) {
                    this.buffer.buffer.writeInt8(this.buffer.signedOverflow(bytes[i], 8), this.buffer.hashposition++);
                    //client.buffer.buffer[i + client.buffer.hashposition] = bytes.buffer[i + offset]
                }
    
                bytes = []; byteToAdd = 0; stop = true;
            }

            if (stop) {
                this.buffer.writeByte(b);
            } else {
                bytes.push(b);
            }
            //client.buffer.writeByte(b);
        } else {
            if (!stop) {
                this.buffer.hashexpand(byteToAdd - 1);

                for (let i = 0; i < (byteToAdd - 1); i++) {
                    this.buffer.buffer.writeInt8(this.buffer.signedOverflow(bytes[i], 8), this.buffer.hashposition++);
                    //this.buffer.buffer[i + this.buffer.hashposition] = bytes.buffer[i + offset]
                }

                bytes = []; byteToAdd = 0;
            }

            try {
                //console.log(this.buffer.toString());
                this.handleMessage.bind(this)(this.buffer.toString().split('\x00').join(''));
                //@ts-ignore
                delete this.buffer.buffer;
                this.buffer.clear();
            } catch (e) {
                Logger.getLogger("Puppet").error(e);
                // this.this.manager._logger.error("Errored trying to handle message: ");
                // this.this.manager._logger.error(e);
            }
            //client.buffer.clear();
        }
    }
}

export default class SmartFoxClient<E extends BothSFSClientEvents = BothSFSClientEvents> extends TypedEmitter<E> {
    startTime = Date.now();
    /**
     * THIS IS MEANT TO RETURN THE TIME IT'S BEEN PLAYING, so use the getter for 
     */
    benchStartTime = Date.now();

    ipAddress = '';
    port = 9339;
    connected = false;
    changingRoom = false;
    playerId = -1;
    activeRoomId = -1;
    myUserId = -1;
    myUserName = "";
    amIModerator = false;

    // roomList: Map<number, Room> = new Map();

    handlers = {
        message: {
            sys: new SysHandler(this),
            xt: new ExtHandler(this),
        } as { sys: SysHandler, xt: ExtHandler }
    }

    queue: fastq.queueAsPromised<Buffer> = fastq.promise(workerProcessData.bind(this), 1);

    socket?: Socket;

    buffer: ByteArray;

    constructor() {
        super();

        // let quawe = fastq.promise(async ({ok, sike}) => { return true; }, 1);

        // this.setupMessageHandlers();

        this.socket = new Socket();

        this.socket.on("connect", this.handleSocketConnection.bind(this));
        this.socket.on("close", this.handleSocketDisconnection.bind(this));
        // this.socket.on("error", this.handleSocketError.bind(this));
        this.socket.on("data", this.handleSocketData.bind(this));

        this.buffer = new ByteArray();
    }

    /**
     * Writes to socket automatically.
     * @param {Object} header 
     * @param {string} action 
     * @param {number} fromRoom 
     * @param {string} message 
     * @returns 
     */
    send(header: SendHeader, action: string, fromRoom: number, message: string) {
        let b = "<msg", c = header;
        const entries = Object.entries(header);

        for (let i = 0, len = entries.length; i < len; i++) {
            const entry = entries[i];

            b += (" " + entry[0] + "='" + entry[1] + "'");
        }
    
        //console.log((`${b}><body action='${action}' r='${r}'>${bodyMsg}</body></msg>`));//, 'utf-8'));
        return this.writeToSocket(`${b}><body action='${action}' r='${fromRoom}'>${message}</body></msg>`);
    }

    /**
     * @param {string} xtName 
     * @param {string} cmd 
     * @param {*} paramObj 
     * @param {number} frequency 
     * @param {string} type 
     * @param {number} roomId 
     */
    sendXtMessage(xtName: string, cmd: Requests | Responses, paramObj: Record<string, any>, frequency=1, type: "xml" | "json" | "str", roomId=-1) {
        //console.log(xtName, cmd, paramObj, frequency, type, roomId);

        if (paramObj) {
            paramObj.fq = frequency;
            paramObj.cmdInt = Number.parseInt(cmd.slice(1));
        }

        if (!this.checkRoomList()) return;
        if (roomId == -1) roomId = this.activeRoomId;
        if (type === SmartFoxClient.XTMSG_TYPE_XML) {
            let header = {"t": "xt"} satisfies SendHeader;
            let xtReq = {
                name: xtName,
                cmd: String(cmd),
                param: paramObj
            };

            let xmlmsg = "<![CDATA[" + serialize(xtReq) + "]]>";
            return this.send(header, "xtReq", roomId, xmlmsg);
        } else if (type === SmartFoxClient.XTMSG_TYPE_STR) {
            let hdr = SmartFoxClient.MSG_STR + 'xt' + SmartFoxClient.MSG_STR + xtName + SmartFoxClient.MSG_STR + cmd + SmartFoxClient.MSG_STR + roomId + SmartFoxClient.MSG_STR;
            for (let i = 0; i < paramObj.length; i++) {
                hdr += paramObj[i].toString() + SmartFoxClient.MSG_STR;
            }

            return this.writeToSocket(hdr);
        } else if (type === SmartFoxClient.XTMSG_TYPE_JSON) {
            let body = {
                x: xtName,
                c: String(cmd),
                r: roomId,
                p: paramObj
            };

            let obj = {
                t: "xt",
                b: body
            }

            return this.writeToSocket(JSON.stringify(obj));
        }
    }

    writeToSocket(msg='', addOne=true) {
        // this.debug("Sending: " + msg);
        //console.log(msg);
        //console.log(this.socket.write);

        //return;

        // if (global.ohmysussybaka) {
        //     if (!global.ohnice) global.ohnice = [];
        //     global.ohnice.push(msg);
        //     console.log("Wrote socket hit: #" + global.ohnice.length);
        // }

        const a = Buffer.from(msg);
        if (addOne) {
            const b = Buffer.alloc(1);
            b.writeInt8(0);
    
            //@ts-expect-error
            this.socket?.write(Buffer.concat([a, b]), 'utf-8');
        } else {
            //@ts-expect-error
            this.socket?.write(a);
        }
    }

    sendPrivateMessage(message: string, recipientId: number, roomId=-1) {
        if (!this.checkRoomList() || !this.checkRoomList(roomId)) return;
        if (roomId === -1) roomId = this.activeRoomId;

        this.send({"t": "sys"}, "prvMsg", roomId, "<txt rcp=\'" + recipientId + "\'><![CDATA[" + encodeEntities(message) + "]]></txt>");
    }

    sendModeratorMessage(message: string, type: number, id=-1) {
        if (!this.checkRoomList()) return;

        this.send({"t": "sys"}, "modMsg", this.activeRoomId, "<txt t=\'" + type + "\' id=\'" + id + "\'><![CDATA[" + encodeEntities(message) + "]]></txt>");
    }

    sendObject(obj: Record<string, any>, roomId: number) {
        if (!this.checkRoomList() || !this.checkRoomList(roomId)) return;
        if (roomId === -1) roomId = this.activeRoomId;

        this.send({"t": "sys"}, "asObj", roomId, "<![CDATA[" + serialize(obj) + "]]>");
    }

    sendObjectToGroup(obj: Record<string, any>, userList: number[], roomId=-1) {
        if (!this.checkRoomList() || !this.checkRoomList(roomId)) return;
        if (roomId === -1) roomId = this.activeRoomId;

        let strList = '';
        for (let i in userList) {
            if (!isNaN(userList[i])) strList += userList[i] + ',';
        }

        strList = strList.substring(0, strList.length - 1);

        //const objParams = {
        //    '_$$_': strList
        //};
        obj['_$$_'] = strList;

        this.send({"t": "sys"}, "asObjG", roomId, "<![CDATA[" + serialize(obj) + "]]>");
    }

    initialize(isLogOut=false) {
        this.changingRoom = false;
        this.amIModerator = false;
        this.playerId = -1;
        this.activeRoomId = -1;
        this.myUserId = -1;
        this.myUserName = "";
        if (!isLogOut) {
            this.connected = false;
        }
        // this.roomList.clear();
    }

    getRandomKey() {
        this.send({"t": "sys"}, "rndK", -1, "");
    }

    login(zone: string, name: string, pass: string) {
        this.send({t: "sys"}, "login", 0, "<login z=\'" + zone + "\'><nick><![CDATA[" + name + "]]></nick><pword><![CDATA[" + pass + "]]></pword></login>");
    }

    logout() {
        this.send({"t": "sys"}, "logout", -1, "");
    }

    disconnect(dp=null) {
        this.connected = false;
        this.socket?.removeAllListeners();
        this.socket?.destroy();
        this.handlers.message.sys.dispatchDisconnection(dp);
        this.removeAllListeners();
    }

    connect(ipAddr: string, port=9339) {
        // this.debug("Connecting to " + ipAddr + ":" + port);
        //console.log(this);

        if (!this.connected) {
            this.initialize();
            this.ipAddress = ipAddr;
            this.port = port;
            this.socket?.connect({
                host: ipAddr,
                port: port
            });
        }
    }

    //#region Handling Events (Main)

    handleSocketConnection() {
        this.send({t: 'sys'}, 'verChk', 0, "<ver v='165' />");
        this.connected = true;
    }

    handleSocketDisconnection(hadError: boolean | { discParams: string }) {
        this.initialize();
        this.emit("onConnectionLost", { error: typeof hadError === "boolean" ? hadError : false, discParams: typeof hadError === "boolean" ? null : hadError.discParams });
        // if (hadError === true) this.emit("onConnectionLost", { error: true });
        // else if (!(hadError && hadError.discParams)) this.emit("onConnectionLost", { error: hadError });
        this.connected = false;
    }

    // handleSocketError(ev) {
    //     // console.log("SOCKET ERRROROROROROROROROROROROROROROROR");
    //     // console.error(ev);
    //     /*
        
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]Error: read ECONNRESET
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]    at TCP.onStreamRead (node:internal/stream_base_commons:217:20) {
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]  errno: -104,
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]  code: 'ECONNRESET',
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]  syscall: 'read'
    //     2023-04-05T02:38:07Z app[19ee6bf9] lhr [info]}
    //     */
    // }

    async handleMessage(msg='') {
        const type = msg.charAt(0);

        // this.debug("Received message from server", msg);
        //console.log("---- message received ----")
        //if (msg.length > 1000) console.log("Message's too big.");
        //else console.log(msg);

        //console.log(type);

        if (type == SmartFoxClient.MSG_XML) {
            this.xmlReceived(msg);
        } else if (type == SmartFoxClient.MSG_STR) {
            this.strReceived(msg);
        } else if (type == SmartFoxClient.MSG_JSON) {
            this.jsonReceived(msg);
        }
    }

    handleSocketData(evt: Buffer) {
        this.queue.push(evt);

        return;
    }

    //#endregion

    //#region Handling Events (Message)

    async strReceived(msg: string) {
        //client.debug("Received string from server", msg);
        const params = msg.substring(1, (msg.endsWith("^") ? msg.length - 1 : msg.length - 2)).split(SmartFoxClient.MSG_STR);
        const handlerId = params[0] as HandlerType;
        const handler = this.handlers.message[handlerId];
        if (handler != null) {
            // Idk, but somehow, for some reason, there was something about circular dependency.
            const giveout = params.slice(1);//.splice(1, params.length-1);

            // if (global.storeSissy === true && handlerId === "sys") {
            //     if (global.storedSissy === undefined) global.storedSissy = [];

            //     global.storedSissy.push(msg);
            // }

            handler.handleMessage(giveout, SmartFoxClient.XTMSG_TYPE_STR);
        } else {
            // this.debug("No handler found for message (STR)", msg);
        }
    }

    async jsonReceived(msg: string) {
        //console.log(msg);
        const jso = JSON.parse(msg);
        const handlerId = jso['t'] as HandlerType;
        const handler = this.handlers.message[handlerId];
        if (handler != null) {
            // if (global.storeSissy === true && handlerId === "sys") {
            //     if (global.storedSissy === undefined) global.storedSissy = [];

            //     global.storedSissy.push(jso);
            // }
            handler.handleMessage(jso['b'], SmartFoxClient.XTMSG_TYPE_JSON);
        } else {
            // this.debug("No handler found for message (JSON)", msg);
        }
    }

    async xmlReceived(msg: string, skip=false) {
        let xmlData = (skip) ? msg : deserialize(msg)?.['msg'];

        if (xmlData === undefined) return;

        if (Array.isArray(xmlData)) {
            for (let i = 0; i < xmlData.length; i++) {
                this.xmlReceived(xmlData[i], true);
            }
        }

        //console.log(xmlData);

        //const [handlerId/*, action, roomId*/] = [xmlData['@t']];//, xmlData.body['@action'], xmlData.body['@r']];
        const handler = this.handlers.message[xmlData['@t'] as HandlerType];//handlerId];

        if (handler != null) {
            // if (global.storeSissy === true && xmlData['@t'] === "sys") {
            //     if (global.storedSissy === undefined) global.storedSissy = [];

            //     global.storedSissy.push(xmlData);
            // }
            handler.handleMessage(xmlData, SmartFoxClient.XTMSG_TYPE_XML);
        } else {
            // this.debug("No handler found for message (XML)", xmlData);
        }
    }

    //#endregion

    setupMessageHandlers()
    {
        //const client = (this.socket) ? this : this.client;

        // const SysHandler = require('./handlers/SysHandler');

        // this.sysHandler = new SysHandler(this);
        // this.extHandler = new ExtHandler(this);
        // this.addMessageHandler("sys",this.sysHandler);
        // this.addMessageHandler("xt",this.extHandler);
    }

    addMessageHandler(key: string, handler: HandlerType)
    {
        //console.log(key, handler);
        //const client = (this.socket) ? this : this.client;

        // if(this.handlers.message[key] == null)
        // {
        //     this.handlers.message[key] = handler;
        // }
        // else
        // {
        //     //client.debugMessage("Warning, message handler called: " + key + " already exist!");
        // }
    }

    /**
     * Keeping this for backward compatibility, use SwarmResources.rooms.get(roomId);
     */
    getRoom(roomId: number) {
        if(!this.checkRoomList()) return null;
        return SwarmResources.rooms.get(roomId);//this.roomList.get(roomId) ?? null;//[roomId];
    }

    //#region Garbage that idk how to categorize

    // setRoomVariables(varList, roomId=-1, setOwnership=true) {
    //     let xmlMsg = null;
    //     let rv = null;




    // }

    //#endregion

    // No, that's literally what it is in the swf. But I cba having to memorise to put true instead of calling this.
    checkRoomList(roomId?: number) {
        return true;
    }

    roundTripBench() {
        this.benchStartTime = Date.now() - this.startTime;
        this.send({"t": "sys"}, "roundTrip", this.activeRoomId, "");
    }

    getBenchStartTime() {
        return this.benchStartTime;
    }

    checkJoin() {
        let success = true;
        if (this.activeRoomId < 0) {
            success = false;
            // TODO: warn that the room is not joined.
        }

        return success;
    }

    getActiveRoom() {
        if (!this.checkRoomList() || !this.checkJoin()) return null;

        return SwarmResources.rooms.get(this.activeRoomId) ?? null;

        // return this.roomList.get(this.activeRoomId) ?? null;
    }

    getActiveRoomFr() {
        if (!this.checkRoomList() || !this.checkJoin()) throw Error("Empty rooms, or didnt join?");

        const room = SwarmResources.rooms.get(this.activeRoomId);//roomList.get(this.activeRoomId);

        if (room === undefined) throw Error("Undefined room");

        return room;
    }

    getRoomList() {
        return Array.from(SwarmResources.rooms.values());//this.roomList.values());
    }

    static EOM = 0;
      
    static MSG_XML = "<" as const;
    
    static MSG_JSON = "{" as const;
    
    static MSG_STR = "^" as const;
    
    static MIN_POLL_SPEED = 0;
    
    static DEFAULT_POLL_SPEED = 750;
    
    static MAX_POLL_SPEED = 10000;
    
    static HTTP_POLL_REQUEST = "poll";
    
    static MODMSG_TO_USER = "u";
    
    static MODMSG_TO_ROOM = "r";
    
    static MODMSG_TO_ZONE = "z";
    
    static XTMSG_TYPE_XML = "xml" as const;
    
    static XTMSG_TYPE_STR = "str" as const;
    
    static XTMSG_TYPE_JSON = "json" as const;
    
    static CONNECTION_MODE_DISCONNECTED = "disconnected";
    
    static CONNECTION_MODE_SOCKET = "socket";
    
    static CONNECTION_MODE_HTTP = "http";
}