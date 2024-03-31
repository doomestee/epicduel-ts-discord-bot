export default class UserRecord {
    userId: number;
    userDate: number;
    userActive: number;
    userPriv: number;
    userLoginCount: number;
    userActionDate: Date;
    userFailedLogins: number;

    constructor(obj: any) {
        this["userId"] = obj["userId"];
        this["userDate"] = obj["userDate"];
        this["userActive"] = obj["userActive"];
        this["userPriv"] = obj["userPriv"];
        this["userLoginCount"] = obj["userLoginCount"];
        this["userActionDate"] = obj["userActionDate"];
        this["userFailedLogins"] = obj["userFailedLogins"];
    }
}