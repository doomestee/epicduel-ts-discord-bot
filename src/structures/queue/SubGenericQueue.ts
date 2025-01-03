import Logger from "../../manager/logger.js";

interface MultQueueItem<T> {
    list: T[];
    timer: NodeJS.Timeout | undefined;
}

/**
 * Difference between this and regular Queue is that this has multiple sub queues.
 */
export default class MultQueue<T> {
    map = new Map<number, MultQueueItem<T>>();

    /**
     * The amount of time to wait for before the timer gets called, until it gets invoked again.
     */
    delayMs: number;
    /**
     * The threshold of the invoke function before it calls the function.
     */
    threshold: number;

    /**
     * This is a temporary measure, it can cause the list to go over the threshold but the invoke will still happen.
     */
    preventTrigger = false;
    
    private count: number = 0;

    /**
     * The trigger function will receive the list immediately, which was spliced immediately upon elapse to avoid the potential disaster from race condition.
     * 
     * isManual is optional, but it will be true if the _elapsed function was manually triggered.
     */
    trigger?: (list: T[], isManual: boolean) => any;

    constructor(delayMs: number, threshold: number) {
        this.delayMs = delayMs;
        this.threshold = threshold;
    }

    ignore = false;

    /**
     * While meant to be private, this allows for earlier invocation.
     * 
     * Please do not pass any parameters lmao
     */
    _elapsed(id: number) : Promise<any>
    _elapsed(forced: true) : Promise<any>;
    _elapsed(id: number | true = true) {
        if (id !== true && this.preventTrigger) return;

        const objs:MultQueueItem<T>[] = [];

        if (id === true) {
            objs.push(...Array.from(this.map.values()));
        } else {
            const obj = this.map.get(id);

            if (!obj) throw Error("The given ID does not exist.");

            objs.push(obj);
        }

        const proms = [];

        for (let i = 0, len = objs.length; i < len; i++) {
            const obj = objs[i];

            const list = obj.list.splice(0);

            clearTimeout(obj.timer);

            if (!this.trigger) return Logger.getLogger("Queue").warn("No function for invocation!");
    
            // if (list.length === 0) return Logger.getLogger("Queue").warn("No items in the queue..?");

            proms.push(Promise.resolve(this.trigger(list, id === true)));
        }

        return Promise.all(proms)
            .then(res => {
                // this.count = 0;
            })
            .catch(res => {
                Logger.getLogger("Queue").error(res);
                // this.count = 0;
            });
    }

    /**
     * Expects to receive the item, which will get added to the list.
     */
    invoke(id: number, item: T) {
        if (this.ignore) return;

        this.count++;

        let obj = this.map.get(id);

        if (obj === undefined) {
            this.map.set(id, obj = {
                list: [], timer: undefined
            })
        }

        clearTimeout(obj.timer);

        if (obj.list.push(item) >= this.threshold) {
            this._elapsed(id);
        } else obj.timer = setTimeout(() => {
            this._elapsed(id);
        }, this.delayMs);
    }
}