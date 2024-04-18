// Is a type, due to circular dependency.
import chalk from "chalk";
import Config from "../config/index.js";
import type Swarm from "../manager/epicduel.js";
import Logger from "../manager/logger.js";
import { SwarmError } from "./errors/index.js";

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

    timer!: NodeJS.Timeout;

    debug = false;

    constructor(swarm: typeof Swarm) {
        this.#swarm = swarm;
        // this.timer = setTimeout(this.checkForChanges.bind(this), this.interval).unref();

        // clearTimeout fucking destroys the timer object, making it non refreshable.
        // clearTimeout(this.timer);
    }

    async checkForChanges() {
        if (this.debug) console.debug(chalk.yellowBright("Cycle check: " + new Date().toISOString()));
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
            if (Date.now() < this.delayUntil) return this.reassignTimer();
        }

        if (this.#swarm.probing) {
            try {
                const attempt = await this.#swarm["login"](Config.edBotEmail, Config.edBotEmail, true);

                if (attempt.servers.length === 0 || attempt.servers.length) {
                    if (this.debug) Logger.getLogger("Cycler").debug("Probing attempt - no servers.");
                    // Still nothing, waiting another 3 minutes.
                    return this.reassignTimer();
                }

                if (this.debug) Logger.getLogger("Cycler").debug("Probing attempt - servers online!");

                // For now since it's the same account
                // this.#swarm.create(attempt);
                
                const central = this.#swarm.getClientById(1);//?.["regenerate"]

                if (central) {
                    central.selfDestruct(true);
                    central.user.regenerate(attempt);
                    central["init"](); central["connect"]();
                }

                // It is ready.
                this.#swarm.probing = false;
            } catch (err) {
                if (err instanceof SwarmError) {
                    switch (err.type) {
                        case "RATELIMITED":
                            Logger.getLogger("Swarm").error("Ratelimited, delaying probing by an hour.");
                            this.delayUntil = Date.now() + 1000*60*60;
                            break;
                    }
                }
            }
        } else {
            // Look at the first few clients available, currently will do 1 client at a time.

            const purgs = this.#swarm["purgatory"];

            let count = 0;

            for (let i = 0, len = purgs.length; i < len; i++) {
                const purg = purgs[i];

                if (count > 0) continue;
                if (!purg.settings.reconnectable) continue;
                if (purg["isFresh"]) continue;

                // if smartfox is connected, it may still be connecting.
                // TODO: add "connecting" to check.
                if (purg.connected || purg.smartFox?.connected) {
                    // Move it to clients section.
                    this.#swarm["clients"].push(purgs[i]);
                    this.#swarm["purgatory"].splice(i--, 1); len--;
                    continue;
                }

                // Doesn't matter if successfully logged in or not, ed login asp ratelimits ip.
                count++;

                const bool = await purg.initialise()
                    .catch(err => {
                        if (err instanceof SwarmError) {
                            if (err.type === "RATELIMITED") {
                                Logger.getLogger("Swarm").error("Ratelimited, delaying logging by an hour.");
                                this.delayUntil = Date.now() + 1000*60*60;
                                return false;
                            }
                        }
                        Logger.getLogger("Cycler").error(err);
                        return false;
                    });

                // Logger.getLogger("Cycler").debug(bool);
                
                if (!bool) return this.reassignTimer();

                if (purg.user.servers[0]?.online === true) {
                    purg["connect"]();
                }
            }
        }

        this.reassignTimer();
    }

    private reassignTimer() {
        // clearTimeout(this.timer);

        if (this.mode === 0 && this.#swarm.probing) {
            Logger.getLogger("Cycler").debug("Probing activated");

            clearTimeout(this.timer);
            this.timer = setTimeout(this.checkForChanges.bind(this), this.probing_interval).unref();
            this.mode = 1;
        } else if (this.mode === 1 && !this.#swarm.probing) {
            Logger.getLogger("Cycler").debug("Probing deactivated");

            clearTimeout(this.timer);
            this.timer = setTimeout(this.checkForChanges.bind(this), this.interval).unref();
            this.mode = 0;
        } else {
            if (this.timer === undefined) this.timer = setTimeout(this.checkForChanges.bind(this), this.mode === 0 ? this.interval : this.probing_interval).unref();
            else this.timer.refresh();
        }
    }
}