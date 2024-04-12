import { IFaction } from "../Models/Faction.ts";
import { Cheevo } from "../game/module/Achievements.ts";
import { Faction } from "../game/module/FactionManager.ts";
import { LeaderTypeToStruct } from "../game/module/Leader.ts";
import { Shop } from "../game/module/Merchant.ts";
import { TournamentLeader } from "../game/module/Tournament.ts";
import { WarSide, WarSideGFX } from "../game/module/WarManager.ts";
import SFSEvent from "../game/sfs/SFSEvent.ts";
import Room from "../game/sfs/data/Room.ts";
import User from "../game/sfs/data/User.ts";

type XtResData = { dataObj: any, type: "xml" | "json" } | { dataObj: string[], type: "str" };

export interface SFSClientEvents {
    onAdminMessage: [event: { roomId: number, userId: number, message: string }];
    onConnection: [event: { success: true } | { success: boolean, error: string }];//"onConnection";
    onConnectionLost: [event: { error?: boolean, discParams: string | null }];
    onCreateRoomError: [event: { error: string }];

    // oh god
    onExtensionResponse: [event: XtResData];

    onJoinRoom: [event: { room: Room | null }];
    onJoinRoomError: [event: { error: string }];
    onLogin: [event: { success: true, name: string, error: "" } | { success: false, error: string }];
    onLogout: [event: {}];
    onModeratorMessage: [event: { message: string, sender: User | null }];
    onObjectReceived: [event: { sender: User | null, obj: any }];
    onPrivateMessage: [event: { roomId: number, userId: number, message: string }];
    onPublicMessage: [event: { roomId: number, userId: number, message: string }];
    onRandomKey: [event: { key: string }];
    onRoomAdded: [event: { room: Room }];
    onRoomDeleted: [event: { room: Room }];
    onRoomLeft: [event: { roomId: number }];
    onRoomListUpdate: [event: { roomList: Room[] }];
    onRoomVariablesUpdate: [event: { room: Room, changedVars: { [x: string]: boolean } }];
    onRoundTripResponse: [event: { elapsed: number }];
    // onSpectatorSwitched: [event: {  }];
    // onPlayerSwitched: [event: {}];
    onUserCountChange: [event: { room: Room }];
    onUserEnterRoom: [event: { roomId: number, user: User }];
    onUserLeaveRoom: [event: { roomId: number, userId: number, userName?: string }];
    onUserVariablesUpdate: [event: { user: User, changedVars: { [x: string]: boolean } }];
};

export interface CustomSFSClientEvents {
    achieve_data: [result: Cheevo[], id: number],
    leader_lb: [result: (CacheTypings.AnyLeaders)[], type: number],
    faction_data: [result: (Faction), id: number],
    merch_item: [result: Shop, id: number];
    war_status: [result: { type: "rally", align: number, status: "ongoing" | "start" | "end" } | { type: "char_used", name: string, influence: number, usedItemId: number } | {  type: "end", align: number }],
    leader_war: [result: WarSide, type: "overall" | "daily"],
    leader_war_gfx: [result: WarSideGFX],
    advent_gift: [result: { status: number, prize: number, value: number, credits: number }],
    leader_gift: [result: CacheTypings.GiftingLeader];

    tourney_leader: [result: TournamentLeader[]];
}

/**
 * This is for the centralised events/epicduel/ stuff
 */
export interface MainEDEvents {
    onAdminMessage: [event: { roomId: number, userId: number, message: string }];

    onPrivateMessage: [event: { userId: number, userName: string, message: string, isFromMe: boolean }];
    onPublicMessage: [event: { roomId: number, user: User, message: string }];

    onUserListUpdate: [event: { type: 1 | 2, list: User[], user: User }];

    onFactionEncounter: [event: { fact: IFaction }];

    onFriendStatus: [event: { charId: number, isOnline: boolean, sfsUserId: number, link: boolean, isMuted: boolean }];

    onWarStatusChange: [event: { type: "rally", alignment: 1 | 2, status: "start"|"ongoing"|"end" } | { type: "start" } | { type: "end", alignment: 1 | 2 } | { type: "char_used", name: string, influence: number, usedItemId: number }];

    onJoinRoom: [event: { room: Room | null }];

    onComparisonUpdate: [];
}

export type BothSFSClientEvents = SFSClientEvents & CustomSFSClientEvents;