// This is more fleshed out, it makes it so we wouldn't need to use one listener each time if we want to say fetch a user record, of which there may be 50.
// NOTE: This is intentionally designed to not be an event emitter or whatever, due to potential memory leaks, so it'll opt to use callbacks, splicing and looping through.

import type { AnyItemRecordsExceptSelf } from "../game/box/ItemBox.js";

interface Queue<ToSend extends object, ToReceive, ID extends string | number | undefined> {
    id: ID;
    done: boolean;
    respond: (obj: Queueify<ToReceive>) => any;
    timer: NodeJS.Timeout;
}

type Queueify<T> = { type: 0, extra: string, hasTimedOut: boolean } | { type: 1 } & T;

interface TypeToVal {
    redeemCode: [{ code: string }, { item: AnyItemRecordsExceptSelf }, undefined];
}

type StreamType = keyof TypeToVal;

class StreamPool {
    // queues: StreamQueue<any>[];
    queues = {
        redeemCode: [],
    } as { [x in StreamType]: (Queue<TypeToVal[x][0], TypeToVal[x][1], TypeToVal[x][2]> | null)[] }

    // intentionally poorly typed
    private waitForClean = [] as any[];

    protected execute<T extends StreamType, O extends TypeToVal[T][0]>(type: T, params: O) {
        if (this.cleaning) {
            return this.waitForClean.push(type, params);
        }

        const cbs = this.queues[type].splice(0);

        for (let i = 0; i < cbs.length; i++) {
            // becaues of the fuckignnsog  ogdamn inatelisesense
            const cb = cbs[i];

            if (cb === null) continue;

            if (cb.id === undefined) {
                // so just assume it's all of it really,
            } else {

            }
        }
    }

    /**
     * NOTE: THIS IS FOR RETURNING THE RESULT, NOT FOR FETCHING.
     */
    exec = {
        redeemCode: (code: string) => this.execute("redeemCode", { code }),
    } satisfies { [x in StreamType]: any }

    addWait<T extends StreamType>(type: T, identifier: TypeToVal[T][1], timeout = 20000) {
        return new Promise((res, rej) => {
            let obj:Queue<any, any, any> = ({
                id: identifier,
                done: false,
                respond(obj) {
                    clearTimeout(this.timer);
                    this.done = true;

                    return res(obj);
                },
                timer: setTimeout(() => {
                    if (obj.done) return;
                    
                    return obj.respond({ type: 0, extra: "Timed out.", hasTimedOut: true });
                }, timeout)
            });

            this.queues[type].push(obj);

            // this.dispatch
        })
    }

    private cleaning = false;
    
    clean() {
        if (this.cleaning) return;

        const keys = Object.keys(this.queues);

        for (let i = 0, len = keys.length; i < len; i++) {
            const key = keys[i] as StreamType;
    
            let length = this.queues[key].length;
            if (length) {
                // goes backwards from the end of the list
                while (i-- > 0) {
                    if (this.queues[key][i] === null) this.queues[key].splice(i - 1);
                }
            }
        }

        if (this.waitForClean.length) {
            const cbs = this.waitForClean.splice(0);

            for (let i = 0, len = cbs.length; i < len; i++) {
                //@ts-ignore
                this.execute(...cbs[i]);
            }
        }

        this.cleaning = false;
    }

    cleaner: NodeJS.Timeout;

    constructor() {
        this.cleaner = setTimeout(this.clean.bind(this), 120000).unref();
    }
}

export default new StreamPool();