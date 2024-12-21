// I don't know this code anymore, I made it like 2 years going 
// with what actionscript3 specification with timer would be like,
// then I decided to screw it halfway through.

type TimerCallback<T> = (args: T) => void | Promise<void>;

/**
 * Note that the timer must be started manually.
 * Please do not edit ms after it's set unless you stop the timer.
 * Args must have reference variables passed.
 */
export default class Timer<T> {
    protected _scatterMs: number = 0;

    /**
     * Date number, last time a _run was called.
     */
    protected lastLoop = [0, 0] as [number, number];

    loop?: NodeJS.Timeout;

    created = Date.now();
    started = 0;
    running = false;
    stopping = false;

    _turnDone = 0;

    isPromise: boolean;
    waitForPromise: boolean;

    args!: T;

    turns?: number;

    /**
     * @param turns DO NOT PASS INFINITY IF YOU INTEND FOR THIS TO GO FOREVER
     */
    constructor(public ms: number, public callback: TimerCallback<T>, isPromise?:boolean, waitForPromise?:boolean, args?: T, turns?:number) {
        let ignorePromise = false;
        if (typeof isPromise != "boolean") { ignorePromise = true; args = isPromise; };

        this.isPromise = (!ignorePromise) ? isPromise ?? false : false;
        this.waitForPromise = (!ignorePromise) ? waitForPromise ?? false : false;

        //@ts-ignore
        this.args = args;
        this.turns = turns;
    }

    
    start(startFirstLoop: boolean) : void;
    start(ms?: number, startFirstLoop?: boolean) : void;
    start(ms?: number | boolean, startFirstLoop=false) {
        if (this.running) return false;
        if (this.stopping) return false;
        if (!this.callback) throw Error("Timer callback is not defined");

        if (typeof ms === "number" && ms) this.ms = ms;
        //this.running = true;
        this.started = Date.now();

        this._run(typeof ms === "boolean" ? ms : startFirstLoop);
    }

    /**
     * If ms is passed, it will restart the timer. If ms is boolean, it will restart, bypassing checking.
     * If the timer has turns, the turns done will be reset to 0 unless ms has "ABC" passed, specifically in caps.
     * @param {number} ms
     * @param {boolean} executeLastLoop If true, the callback will be executed at the next loop before stopping.
     */
    async stop(ms?: number | "ABC", executeLastLoop=false) {
        if (!this.running) return false;
        if (this.stopping) return false;
        this.stopping = true;

        clearTimeout(this.loop);
        if (executeLastLoop) {
            let a = this.callback(this.args);

            if (this.isPromise) await a;
        }

        if (typeof ms == "boolean") {
            this.running = false; this.stopping = false; return this._run();
        }

        if (ms !== "ABC" && this.turns) {
            this._turnDone = 0;
        } else if (ms) {// && (ms !== true && ms !== false)) {
            this.lastLoop = [0, 0];
            if (typeof ms === "number") this.ms = ms;
            this.running = false;
            this.stopping = false;

            return this._run(false);
        }

        this.lastLoop = [0, 0];
        this.running = false;
        this.stopping = false;
    }

    /**
     * @protected
     */
    _run(startFirstLoop=false) {
        if (this.running) return false;
        this.running = true;
        this.started = Date.now();

        if (this.ms > 30000 && !this.turns) {
            this._scatterMs = ((this.ms - 10000) / 5) - 1000;

            if (this._scatterMs > 10000) this._scatterMs = 10000;
        }

        this.lastLoop[0] = Date.now();
        this.lastLoop[1] = 0;

        let loopCheck = () : any => {
            //console.log(this);
            if (!this.running) return clearTimeout(this.loop);

            if (this.turns) {
                if (((this._turnDone + 1) > this.turns) || this.stopping) {
                    clearTimeout(this.loop); this.lastLoop = [0, 0];
                    this.running = false; this.stopping = false; return;
                }

                this._turnDone++;//this.lastLoop[1]++;

                if (this.isPromise) {
                    return this.callback(this.args)?.then(() => {
                        this.loop = setTimeout(loopCheck, this.ms);
                    });
                }
    
                this.callback(this.args);
            } else if (this.ms > 30000 && !this.stopping) {
                this.lastLoop[1] = Date.now();
    
                if ((this.lastLoop[1] - this.lastLoop[0]) > this.ms) {
                    this.lastLoop[0] = Date.now();
    
                    if (this.isPromise) {
                        return this.callback(this.args)?.then(() => {
                            this.loop = setTimeout(loopCheck, (this.ms > 30000) ? this._scatterMs : this.ms);
                        });
                    }
    
                    this.callback(this.args);
                } else return this.loop = setTimeout(loopCheck, (this.ms > 30000) ? this._scatterMs : this.ms);
            } else {
                if (this.stopping) {
                    clearTimeout(this.loop);
                    this.running = false; this.stopping = false; return;
                }
    
                if (this.isPromise) {
                    return this.callback(this.args)?.then(() => {
                        this.loop = setTimeout(loopCheck, (this.ms > 30000) ? this._scatterMs : this.ms);
                    });
                }
    
                this.callback(this.args);
            }
    
            this.loop = setTimeout(loopCheck, (this.ms > 30000 && this.turns != undefined) ? this._scatterMs : this.ms);
        }

        if (startFirstLoop) {
            if (this.isPromise) {
                return this.callback(this.args)?.then(() => {
                    this.loop = setTimeout(loopCheck, (this.ms > 30000 && this.turns != undefined) ? this._scatterMs : this.ms);
                });
            }

            return this.callback(this.args);
        }

        this.loop = setTimeout(loopCheck, (this.ms > 30000 && this.turns != undefined) ? this._scatterMs : this.ms);
    }
}