import { SFSClientEvents } from "../../types/events.js";

export default class SFSEvent<P extends object> extends Event {
    static onAdminMessage = "onAdminMessage";
    static onBuddyList = "onBuddyList";
    static onBuddyListError = "onBuddyListError";
    static onBuddyListUpdate = "onBuddyListUpdate";
    static onBuddyPermissionRequest = "onBuddyPermissionRequest";
    static onBuddyRoom = "onBuddyRoom";
    static onConfigLoadFailure = "onConfigLoadFailure";
    static onConfigLoadSuccess = "onConfigLoadSuccess";
    static onConnection = "onConnection";
    static onConnectionLost = "onConnectionLost";
    static onCreateRoomError = "onCreateRoomError";
    static onDebugMessage = "onDebugMessage";
    static onExtensionResponse = "onExtensionResponse";
    static onJoinRoom = "onJoinRoom";
    static onJoinRoomError = "onJoinRoomError";
    static onLogin = "onLogin";
    static onLogout = "onLogout";
    static onModeratorMessage = "onModMessage";
    static onObjectReceived = "onObjectReceived";
    static onPrivateMessage = "onPrivateMessage";
    static onPublicMessage = "onPublicMessage";
    static onRandomKey = "onRandomKey";
    static onRoomAdded = "onRoomAdded";
    static onRoomDeleted = "onRoomDeleted";
    static onRoomLeft = "onRoomLeft";
    static onRoomListUpdate = "onRoomListUpdate";
    static onRoomVariablesUpdate = "onRoomVariablesUpdate";
    static onRoundTripResponse = "onRoundTripResponse";
    static onSpectatorSwitched = "onSpectatorSwitched";
    static onPlayerSwitched = "onPlayerSwitched";
    static onUserCountChange = "onUserCountChange";
    static onUserEnterRoom = "onUserEnterRoom";
    static onUserLeaveRoom = "onUserLeaveRoom";
    static onUserVariablesUpdate = "onUserVariablesUpdate";

    params: P;

    constructor(type: keyof SFSClientEvents, params: P) {
        super(type);
        this.params = params;
    }
}