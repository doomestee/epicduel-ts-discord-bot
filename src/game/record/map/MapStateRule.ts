import type MapObjectGroup from "./MapObject.js";

export class MapStateRule {
    constructor(public state: number) {
    }

    get ruleMet() {
        return false;
    }
};

export class MapStateRuleSet {
    groups: MapObjectGroup[]

    constructor(...groupList: MapObjectGroup[]) {
        this.groups = groupList;
    }
}

export class MSR_DoesNotOwnItemAndMissionIncomplete extends MapStateRule {
    constructor(state: number, public itemId: number, public missionId: number) {
        super(state);
    }

    override get ruleMet() {
        // return !InventoryModule.instance.clientAlreadyOwnsItem(this._itemId) && !MissionManager.isMissionComplete(this._missionId);
        return false;
    }
}

export class MSR_HasAlignmentAndAnyMissionCompleteInSet extends MapStateRule {
    constructor(state: number, public missionIdList: number[]) {
        super(state);
    }

    override get ruleMet() {
        // var missionId:int = 0;
        // var anyMissionCompleteInSet:Boolean = false;
        // for(var m:int = 0; m < this._missionIdList.length; m++)
        // {
        //    missionId = int(this._missionIdList[m]);
        //    if(MissionManager.isMissionComplete(missionId))
        //    {
        //       anyMissionCompleteInSet = true;
        //       break;
        //    }
        // }
        // return EpicDuel.getMyUser().charWarAlign > 0 && anyMissionCompleteInSet;
        return false;
    }
}

export class MSR_MissionComplete extends MapStateRule {
    constructor(state: number, public missionId: number) {
        super(state);
        this.missionId = missionId;
    }

    override get ruleMet() {
        // return MissionManager.isMissionComplete(this._missionId);
        return false;
    }
}

export class MSR_MissionNotComplete extends MapStateRule {
    constructor(state: number, public missionId: number) {
        super(state);
    }

    override get ruleMet() {
        // return !MissionManager.isMissionComplete(this._missionId);
        return false;
    }
}

export class MSR_NoAlignment extends MapStateRule {
    constructor(state: number) {
        super(state);
    }

    override get ruleMet() {
        return false;
        // return EpicDuel.getMyUser().charWarAlign == 0;
    }
}

export class MSR_NoAlignmentOrNoMissionCompleteInSet extends MapStateRule {
    constructor(state: number, public missionIdList: number[]) {
        super(state);
    }

    override get ruleMet() {
        // var missionId:int = 0;
        // var noMissionCompleteInSet:Boolean = true;
        // for(var m:int = 0; m < this._missionIdList.length; m++)
        // {
        //    missionId = int(this._missionIdList[m]);
        //    if(MissionManager.isMissionComplete(missionId))
        //    {
        //       noMissionCompleteInSet = false;
        //       break;
        //    }
        // }
        // return EpicDuel.getMyUser().charWarAlign == 0 || noMissionCompleteInSet;
        return false;
    }
}

export class MSR_OwnItemOrMissionComplete extends MapStateRule {
    constructor(state: number, public itemId: number, public missionId: number) {
        super(state);
    }

    override get ruleMet() {
        // return InventoryModule.instance.clientAlreadyOwnsItem(this._itemId) || MissionManager.isMissionComplete(this._missionId);
        return false;
    }
}