export default class AssetPool {
    static POOL_BODY = "Body";
      
    static POOL_HIP = "Hip";
    
    static POOL_FOREARM_L = "ForearmL";
    
    static POOL_FOREARM_R = "ForearmR";
    
    static POOL_BICEP_L = "BicepL";
    
    static POOL_BICEP_R = "BicepR";
    
    static POOL_SHIN_L = "ShinL";
    
    static POOL_SHIN_R = "ShinR";
    
    static POOL_THIGH_L = "ThighL";
    
    static POOL_THIGH_R = "ThighR";
    
    static POOL_FOOT_L = "FootL";
    
    static POOL_FOOT_R = "FootR";
    
    static POOL_HEAD = "Head";
    
    static POOL_HAIR = "Hair";
    
    static POOL_HAIR_ABOVE = "HairAbove";
    
    static POOL_CORE = "Core";
    
    static POOL_STAFF = "Staff";
    
    static POOL_GUN = "Gun";
    
    static POOL_SWORD = "Sword";
    
    static POOL_CLUB = "Club";
    
    static POOL_WRIST_R = "WristR";
    
    static POOL_WRIST_L = "WristL";
    
    static POOL_AUXILIARY = "Auxiliary";
    
    static POOL_CRAFT = "Vehicle";
    
    static POOL_ROBOT = "Robot";
    
    static POOL_MISSION = "Mission";
    
    static POOL_ACHIEVE_CLIENT = "achClient";
    
    static POOL_ACHIEVE_STORE = "achStore";
    
    static POOL_BACKGROUNDS = "backgrounds";
    
    // static _headPool = [];
    
    // static _hairPool = [];
    
    // static _hairAbovePool = [];
    
    // static _bodyPool = [];
    
    // static _hipPool = [];
    
    // static _forearmRPool = [];
    
    // static _forearmLPool = [];
    
    // static _bicepRPool = [];
    
    // static _bicepLPool = [];
    
    // static _shinRPool = [];
    
    // static _shinLPool = [];
    
    // static _thighRPool = [];
    
    // static _thighLPool = [];
    
    // static _footRPool = [];
    
    // static _footLPool = [];
    
    // static _staffPool = [];
    
    // static _gunPool = [];
    
    // static _swordPool = [];
    
    // static _wristLPool = [];
    
    // static _wristRPool = [];
    
    // static _craftPool = [];
    
    // static _corePool = [];
    
    // static _auxiliaryPool = [];
    
    // static _robotPool = [];
    
    // static _missionPool = [];
    
    // static _achievePoolClient = [];
    
    // static _achievePoolStore = [];

    static getDirectoryByPool(assetPool: string) {
        if ([this.POOL_BODY, this.POOL_HIP, this.POOL_FOREARM_L, this.POOL_FOREARM_R, this.POOL_BICEP_L, this.POOL_BICEP_R, this.POOL_SHIN_L, this.POOL_SHIN_R, this.POOL_THIGH_L, this.POOL_THIGH_R, this.POOL_FOOT_L, this.POOL_FOOT_R, this.POOL_HEAD, this.POOL_HAIR, this.POOL_HAIR_ABOVE].some(v => v == assetPool)) return "asset/armors/";
        if (assetPool == this.POOL_STAFF) return "assets/staffs/";
        if (assetPool == this.POOL_GUN) return "assets/guns/";
        if (assetPool == this.POOL_SWORD) return "assets/swords/";
        if (assetPool == this.POOL_CLUB) return "assets/swords/";
        if (assetPool == this.POOL_WRIST_R || assetPool == this.POOL_WRIST_L) return "assets/blades/";
        if (assetPool == this.POOL_CORE) return "assets/cores/";
        if (assetPool == this.POOL_AUXILIARY) return "assets/auxiliary/";
        if (assetPool == this.POOL_CRAFT) return "assets/crafts/";
        if (assetPool == this.POOL_ROBOT) return "assets/robots/";
        if (assetPool == this.POOL_MISSION) return "assets/mission/";
        if (assetPool == this.POOL_ACHIEVE_CLIENT || assetPool == this.POOL_ACHIEVE_STORE) return "assets/achieve/";
        return "";
    }

    // static addAchieve(type: string, link: string, achieve: string) {
    //     // if (type == this.POOL_ACHIEVE_CLIENT) this._achievePoolClient[link] = achieve;
    //     // else this._achievePoolStore[link] = achieve;
    // }
}