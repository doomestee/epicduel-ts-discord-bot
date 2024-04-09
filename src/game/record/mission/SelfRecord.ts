import AchievementSBox from "../../box/AchievementBox.js";
import ItemSBox from "../../box/ItemBox.js";

export default class MissionRecord {
    static FIELD_missionId = "missionId";
    static FIELD_missionName = "missionName";
    static FIELD_missionType = "missionType";
    static FIELD_missionTgt = "missionTgt";
    static FIELD_missionQty = "missionQty";
    static FIELD_missionRwdDesc = "missionRwdDesc";
    static FIELD_missionRwdType = "missionRwdType";
    static FIELD_missionRwdRef = "missionRwdRef";
    static FIELD_missionReqLvl = "missionReqLvl";
    static FIELD_missionReqAlign = "missionReqAlign";
    static FIELD_missionReqClass = "missionReqClass";
    static FIELD_merchantId = "merchantId";
    static FIELD_itemReqToAccept = "itemReqToAccept";
    static FIELD_rwdCreditValue = "rwdCreditValue";
    static FIELD_rwdVariumValue = "rwdVariumValue";
    static FIELD_missionCutscene = "missionCutscene";
    static FIELD_groupId = "groupId";
    static FIELD_missionOrder = "missionOrder";

    static _template = [this.FIELD_missionId, this.FIELD_missionName, this.FIELD_missionType, this.FIELD_missionTgt, this.FIELD_missionQty, this.FIELD_missionRwdDesc, this.FIELD_missionRwdType, this.FIELD_missionRwdRef, this.FIELD_missionReqLvl, this.FIELD_missionReqAlign, this.FIELD_missionReqClass, this.FIELD_merchantId, this.FIELD_itemReqToAccept, this.FIELD_rwdCreditValue, this.FIELD_rwdVariumValue, this.FIELD_missionCutscene, this.FIELD_groupId, this.FIELD_missionOrder];

    missionId: number;
    missionName: string;
    missionType: number;
    missionTgt: string;
    /**
     * Quantity is a string as multiple quantities can be listed.
     */
    missionQty: string;
    missionRwdDesc: string;
    missionRwdType: string;
    missionRwdRef: string;
    missionReqLvl: number;
    missionReqAlign: number;
    missionReqClass: number;
    merchantId: number;
    itemReqToAccept: number;
    rwdCreditValue: number;
    rwdVariumValue: number;
    missionCutscene: string;
    groupId: number;
    missionOrder: number;

    constructor(obj: any) {
        this.missionId = parseInt(obj[MissionRecord.FIELD_missionId]);
        this.missionName = String(obj[MissionRecord.FIELD_missionName]);
        this.missionType = parseInt(obj[MissionRecord.FIELD_missionType]);
        this.missionTgt = String(obj[MissionRecord.FIELD_missionTgt]);
        /**
         * Quantity is a string as multiple quantities can be listed.
         */
        this.missionQty = String(obj[MissionRecord.FIELD_missionQty]);
        this.missionRwdDesc = String(obj[MissionRecord.FIELD_missionRwdDesc]);
        this.missionRwdType = String(obj[MissionRecord.FIELD_missionRwdType]);
        this.missionRwdRef = String(obj[MissionRecord.FIELD_missionRwdRef]);
        this.missionReqLvl = parseInt(obj[MissionRecord.FIELD_missionReqLvl]);
        this.missionReqAlign = parseInt(obj[MissionRecord.FIELD_missionReqAlign]);
        this.missionReqClass = parseInt(obj[MissionRecord.FIELD_missionReqClass]);
        this.merchantId = parseInt(obj[MissionRecord.FIELD_merchantId]);
        this.itemReqToAccept = parseInt(obj[MissionRecord.FIELD_itemReqToAccept]);
        this.rwdCreditValue = parseInt(obj[MissionRecord.FIELD_rwdCreditValue]);
        this.rwdVariumValue = parseInt(obj[MissionRecord.FIELD_rwdVariumValue]);
        this.missionCutscene = String(obj[MissionRecord.FIELD_missionCutscene]);
        this.groupId = parseInt(obj[MissionRecord.FIELD_groupId]);
        this.missionOrder = parseInt(obj[MissionRecord.FIELD_missionOrder]);
    }

    get reward() {
        let types = this.missionRwdType.split(",");
        let refs = this.missionRwdRef.split(",");

        let result = [];

        for (let i = 0; i < types.length; i++) {
            let type = parseInt(types[i]);
            let ref = parseInt(refs[i]);

            result.push({ t: type, v: ref });
        }

        return result;
    }

    rewardFull() {
        let types = this.missionRwdType.split(",");
        let refs = this.missionRwdRef.split(",");

        /**
         * 1 - Achievement
         * 2 - Credits
         * 3 - Home Item (lmao)
         * 4 - Item
         * 5 - XP
         */

        let result = [];

        for (let i = 0; i < types.length; i++) {
            let type = parseInt(types[i]);
            let ref = parseInt(refs[i]);

            switch (type) {
                case 1: result.push({ t: type, v: AchievementSBox.objMap.get(ref) }); break;
                case 2: case 3: case 5: result.push({ t: type, v: ref }); break;
                case 4: result.push({ t: type, v: ItemSBox.getItemById(ref, true) }); break;
            }
        }

        return result;
    }
}