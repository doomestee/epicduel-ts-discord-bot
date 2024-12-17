import Logger from "../../manager/logger.js";

export default class Queue<T> {
    list: T[] = [];

    /**
     * The amount of time to wait for before the timer gets called, until it gets invoked again.
     */
    delayMs: number;
    /**
     * The threshold of the invoke function before it calls the function.
     */
    threshold: number;
    /**
     * Well duh
     */
    timer: NodeJS.Timeout | undefined;
    
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

    /**
     * While meant to be private, this allows for earlier invocation.
     * 
     * Please do not pass any parameters lmao
     */
    _elapsed() : Promise<any>;
    _elapsed(forced=true) {
        const list = this.list.splice(0);

        clearTimeout(this.timer);

        if (!this.trigger) return Logger.getLogger("Queue").warn("No function for invocation!");

        if (list.length === 0) return Logger.getLogger("Queue").warn("No items in the queue..?");

        return Promise.resolve(this.trigger(list, forced))
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
    invoke(item: T) {
        this.count++;

        clearTimeout(this.timer);

        if (this.list.push(item) >= this.threshold) {
            this._elapsed();
        } else this.timer = setTimeout(() => {
            this._elapsed();
        }, this.delayMs);
    }
}