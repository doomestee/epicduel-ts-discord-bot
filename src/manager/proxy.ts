import { RequestInit, fetch as unFetch } from "undici";
import Logger from "./logger.js";
import { getHighestTime } from "../util/Misc.js";
import Timer from "../game/Timer.js";

/**
 * This is effectively a wrapper to the proxy service
 */
export default class ProxyManager {
    static readonly PROXY_URL = "http://crimson.containers.local:8000";

    static stat() : Promise<StatResult | false> {
        const time = Date.now();

        return this.fetch("/stat")
            .then(r => r.json() as unknown as StatResult)
            .then(r => { r["latency"] = (Date.now() - time); return r; })
            .catch(r => {
                Logger.getLogger("Proxy").error(r);
                return false;
            });
    }

    static async login(email: string, password: string) : Promise<ProxyFetchResult<"Missing email"|"Missing password"|"Ratelimited"|"Artix_blocked"|"Exhausted Requests">> {
        if (typeof email !== "string") return { success: false, value: "Missing email" };
        if (typeof password !== "string") return { success: false, value: "Missing password" };

        return this.fetch("/login", {
            method: "POST",
            body: JSON.stringify({
                email, password
            }),
            headers: {
                "content-type": "application/json"
            }
        }).then(r => r.json() as unknown as ProxyFetchResult<"Ratelimited"|"Artix_blocked"|"Exhausted Requests">)
    }

    private static fetch(path: string, init?: RequestInit) {
        return unFetch(this.PROXY_URL + path, init)
            .then(r => {
                this.available = true;
                return r;
            });
    }

    static #warned = false;

    /**
     * TODO: add a timer for health check.
     */
    static available = false;

    static vocal = false;

    static healthCheck() {
        return this.stat()
            .then(res => {
                if (res === false) {
                    if (this.vocal) Logger.getLogger("Proxy").debug("Healthcheck - server down.");

                    this.available = false;

                    return;
                }

                if (res.latency > 5000) {
                    if (!this.#warned) Logger.getLogger("Proxy").warn("Latency is " + getHighestTime(res.latency));

                    this.#warned = true;
                }

                if (res.proxy.available === 0 || res.proxy.unblocked < 3) {
                    this.available = true;
                } //else this.available = true;

                if (this.vocal) Logger.getLogger("Proxy").debug("Health check - fine.");
            })
            .catch(err => {
                if (!this.#warned) Logger.getLogger("Proxy").error(err);
                if (this.vocal) Logger.getLogger("Proxy").debug("Health check - error.");

                this.available = false;
            });
    }

    static readonly timer = new Timer(10000, this.healthCheck.bind(this), true, true);//setInterval(() => this.healthCheck(), 10000);
}

interface StatResult {
    proxy: {
        total: number;
        available: number;
        blocked: number;
        unblocked: number;
        cooling: number;
    },
    process: {
        time: number,
        memory: [number, number];
    },
    latency: number;
}

/**
 * Value and reason the same cos laziness
 */
export type ProxyFetchResult<T extends string = string> = { success: false, value: T } | { success: true, value: string };