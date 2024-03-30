// Is a type, due to circular dependency.
import Config from "../config/index.js";
import type Swarm from "../manager/epicduel.js";

export default class EDCycler {
    #swarm: typeof Swarm;

    /**
     * 0 for regular, 1 for probing.
     */
    mode:0|1 = 0;

    interval = 60_000;
    probing_interval = 180_000;

    /**
     * This will be used in events of ratelimits (should all proxies be exhausted.)
     * It'll typically be one hour after the first time.
     */
    delayUntil = 0;

    /**
     * NOTE: if 
     */
    attempts = 0;

    timer: NodeJS.Timeout;

    constructor(swarm: typeof Swarm) {
        this.#swarm = swarm;
        this.timer = setTimeout(this.checkForChanges.bind(this), this.interval).unref();

        clearTimeout(this.timer);
    }

    checkForChanges() {
        const clients = this.#swarm["clients"];

        // We will just get all of the redundant clients to then dump to purgatory first.
        for (let i = 0, len = clients.length; i < len; i++) {
            if (clients[i].connected || clients[i]["isFresh"]) continue;

            // Was connected, but no longer is, and is not initialised (been self destructed)
            // Let's put it to purgatory.
            if (!clients[i].initialised) {
                this.#swarm["purgatory"].push(clients[i]);
                this.#swarm["clients"].splice(i--, 1); len--;
                continue;
            }
        }

        if (this.delayUntil > 0) {
            if (Date.now() < this.delayUntil) return;
        }

        if (this.#swarm.probing) {
            this.#swarm["login"](Config.dbDatabase)
        } else {

        }

        this.reassignTimer();
    }

    private reassignTimer() {
        clearTimeout(this.timer);

        if (this.mode === 0 && this.#swarm.probing) {
            this.timer = setTimeout(this.checkForChanges.bind(this), this.probing_interval).unref();
            this.mode = 1;
        } else if (this.mode === 1 && !this.#swarm.probing) {
            this.timer = setTimeout(this.checkForChanges.bind(this), this.interval).unref();
            this.mode = 0;
        } else this.timer.refresh();
    }
}