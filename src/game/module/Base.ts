import { inspect } from "util";

export default class BaseModule {
    debug = false;

    constructor(public utilIgnore=["client"]) {
        if (utilIgnore === undefined) this.utilIgnore = ["client"];
        else if (utilIgnore === null) this.utilIgnore = [];
        else if (!Array.isArray(utilIgnore)) this.utilIgnore = [utilIgnore];
    }

    [inspect.custom]() {
        const obj = { ...this };

        if (this.utilIgnore == null) return obj;

        for (let i = 0, len = this.utilIgnore.length; i < len; i++) {
            //@ts-expect-error
            delete obj[this.utilIgnore[i]];
        }

        //@ts-expect-error
        delete obj["utilIgnore"];

        return obj;
    }
}