// Yes this is cursed, but I do not want to revamp.
// And also this was created couple years ago.

import EventEmitter from "events";
import SmartFoxClient from "../game/sfs/SFSClient.js";

type ExtractFirstType<T> = T extends SmartFoxClient<infer K> ? keyof K : never;
type ExtractFirstVal<T> = T extends SmartFoxClient<infer K> ? K : never;

export type WaitForResult<T> = { value: T, success: true } | { success: false, reason: any };

class Streamie {
    
    // static waitForSF<O extends object, T extends EventEmitter>(events: T, name: ExtractFirstType<T>, identifier: [string | number, string | number] | undefined, timeout?: number) : Promise<{ value: O, success: boolean } | { success: false, reason: any }>;
    // static waitForSF<O extends object, T extends EventEmitter>(events: T, name: ExtractFirstType<T> | ExtractFirstType<T>[], identifier: undefined, timeout?: number) : Promise<{ value: O, success: boolean } | { success: false, reason: any }>;
    // static waitForSF<O extends object, T extends EventEmitter>(events: T, name: ExtractFirstType<T> | ExtractFirstType<T>[], identifier: [string | number, string | number] | undefined, timeout = 20000) {
    //     //@ts-expect-error
    //     return this.waitFor.apply(this, [events, name, identifier, timeout]);
    // }
    
    static waitFor<T extends EventEmitter, M extends ExtractFirstType<T>>(events: T, name: M, identifier: [string | number, string | number] | undefined, timeout?: number) : Promise<WaitForResult<ExtractFirstVal<T>[M][0]>>;
    static waitFor<T extends EventEmitter, M extends ExtractFirstType<T>>(events: T, name: M | M[], identifier: undefined, timeout?: number) : Promise<WaitForResult<ExtractFirstVal<T>[M][0]>>;
    static waitFor<T extends EventEmitter, M extends ExtractFirstType<T>>(events: T, name: M | M[], identifier: [string | number, string | number] | undefined, timeout = 20000) {
        if (identifier && Array.isArray(name) && name.length > 1) name = name[0];

        let time: NodeJS.Timeout;
        let rand = Date.now();

        return new Promise((res, rej) => {
            const error = (...args: any[]) => {
                rand;
                clearTimeout(time);
                res({ success: false, reason: args[0] });
            }

            const result = (...args: any[]) => {
                rand;
                if (identifier) {
                    if (typeof identifier[0] === "number") {
                        if (args[0] !== undefined && args[identifier[0]] == identifier[1]) {
                            events.removeListener("error", error);
                            events.removeListener(name as string, result);
                            clearTimeout(time);

                            return res({ value: args[0], success: true });
                        }
                    //@ts-expect-error
                    } else if (args[0].hasOwnProperty(identifier[0]) && args[identifier[0]] === identifier[1]) {
                        events.removeListener("error", error);
                        events.removeListener(name as string, result);
                        clearTimeout(time);

                        return res({ value: args[0], success: true });
                    }
                } else {
                    events.removeListener("error", error);
                    events.removeListener(name as string, result);
                    clearTimeout(time);

                    return res({ value: args[0], success: true });
                }
            }

            if (Array.isArray(name)) {
                for (let i = 0; i < name.length; i++) {
                    // The more i look back to this particular part, YIKES.
                    events.once(name[i], (...args) => {
                        clearTimeout(time);
                        res({ value: args[0], success: true });
                    })
                }
            } else {
                events.on(name, result);
            }
            
            events.once("error", error);

            time = setTimeout(() => {
                events.removeListener("error", error);
                events.removeListener(name as string, result);

                res({ success: false, reason: ("Timeout") });
                // rej(new Error("Timeout"));
            }, timeout);
        })
    }
}

export const waitFor = Streamie.waitFor;