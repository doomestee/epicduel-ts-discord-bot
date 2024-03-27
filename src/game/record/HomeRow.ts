import HomeRecord from "./HomeRecord.js";

export default class HomeRow {
    static PERM_PUBLIC = 0;
    static PERM_FRIENDS = 1;
    static PERM_PRIVATE = 2;

    homeRecord: HomeRecord;
    charId: number;
    permission: number;

    myRow: boolean;
    permissionOK: boolean = false;

    name: string;
    enabled: boolean;

    constructor(homeRecord: HomeRecord, charId: number, permission = 0, client: any) {
        this.homeRecord = homeRecord;
        this.charId = charId;
        this.permission = permission;

        this.myRow = client.user._myCharId === charId;
        //this.permissionOK = this.myRow || permission == 0 || (permission == 1 && /* MainInterfaceModule.instance.isCharacterOnBuddyList(this._charId) */ false || client.user.userPriv >= 2 && client._overrideHomeLock);

        this.name = homeRecord.homeName;
        this.enabled = this.permissionOK;
    }
}