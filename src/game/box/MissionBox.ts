import { Collection } from "oceanic.js";
import MissionGroupRecord from "../record/mission/GroupRecord.js";
import MissionRecord from "../record/mission/SelfRecord.js";
import { SharedMultipleBox } from "./SharedBox.js";

export default class MissionSBox extends SharedMultipleBox<{ self: MissionRecord, group: MissionGroupRecord }> {
    static objMap = {
        self: new Collection<number, MissionRecord>(),
        group: new Collection<number, MissionGroupRecord>(),
    }

    constructor() {
        super({
            self: ["missionId", "missionName", "missionType", "missionTgt", "missionQty", "missionRwdDesc", "missionRwdType", "missionRwdRef", "missionReqLvl", "missionReqAlign", "missionReqClass", "merchantId", "itemReqToAccept", "rwdCreditValue", "rwdVariumValue", "missionCutscene", "groupId", "missionOrder"],
            group: ["groupId", "groupName", "categoryId", "isActive", "groupOrder", "groupIdReq"]    
        }, {
            self: MissionRecord,
            group: MissionGroupRecord
        }, MissionSBox.objMap);
        // super(["merchantId", "mercName", "mercLink", "mercScale", "mercX", "mercY", "mercOpts", "mercChat", "npcId", "merchLvl", "reqItems", "mercBoss", "mercAlign", "mercCanJump"], MerchantRecord);
    }

    reset = false;
    status:[0|1,0|1] = [0, 0];

    static GROUP_A_NEW_WORLD = 48;
    static LOYALTY_PLEDGE_EXILE = 49;
    static LOYALTY_PLEDGE_LEGION = 50;
    static MISSION_TAKE_OUT_THE_TRASH = 384;
    static CRUEL_COLLECTION = 385;
    static FOR_FREEDOM = 388;
    static FOR_ORDER = 389;

    static getMissionsByGroupId(groupId: number, list?: MissionRecord[]) : MissionRecord[] {
        if (list === undefined) list = this.objMap.self.toArray();

        const result = [];

        for (let i = 0, len = list.length; i < len; i++) {
            if (list[i].groupId === groupId) result[list[i].missionOrder - 1] = list[i]
        }

        return result;
    }

    getMissionsByGroupId(groupId: number, list?: MissionRecord[]) : MissionRecord[] {
        if (list === undefined) list = this.objMap.self.toArray();

        const result = [];

        for (let i = 0, len = list.length; i < len; i++) {
            if (list[i].groupId === groupId) result[list[i].missionOrder - 1] = list[i]
        }

        return result;
    }
}