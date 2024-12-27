import { inspect } from "node:util";

export default class UserRecord {
    userId: number;
    userDate: Date;
    userActive: number;
    userPriv: number;
    userLoginCount: number;
    userActionDate: Date;
    userFailedLogins: number;

    constructor(obj: any) {
        this["userId"] = Number(obj["userId"]);
        this["userDate"] = new Date(obj["userDate"]);
        this["userActive"] = Number(obj["userActive"]);
        this["userPriv"] = Number(obj["userPriv"]);
        this["userLoginCount"] = Number(obj["userLoginCount"]);
        this["userActionDate"] = new Date(obj["userActionDate"]);
        this["userFailedLogins"] = Number(obj["userFailedLogins"]);
    }

    [inspect.custom]() {
        return {
            id: this.userId,
            priv: this.userPriv,
            active: this.userActive,
            loginCount: this.userLoginCount
        }
    }
}