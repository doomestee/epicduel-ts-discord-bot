import { fetch } from "undici";

/**
 * This is effectively a wrapper to the proxy service
 */
export default class ProxyManager {
    static readonly PROXY_URL = "http://crimson.containers.local:8000";

    static stat() {
        return fetch(this.PROXY_URL + "/stat")
            .then(r => r.json() as unknown as StatResult);
    }

    static async login(email: string, password: string) : Promise<ProxyFetchResult<"Missing email"|"Missing password"|"Ratelimited"|"Artix_blocked"|"Exhausted Requests">> {
        if (typeof email !== "string") return { success: false, value: "Missing email" };
        if (typeof password !== "string") return { success: false, value: "Missing password" };

        return fetch(this.PROXY_URL + "/login", {
            method: "POST",
            body: JSON.stringify({
                email, password
            }),
            headers: {
                "content-type": "application/json"
            }
        }).then(r => r.json() as unknown as ProxyFetchResult<"Ratelimited"|"Artix_blocked"|"Exhausted Requests">)
    }

    /**
     * FOR NOW THIS IS ADDED BUT DOESN'T DO ANYTHING, THIS WILL BE ADDED IN THE FUTURE IF NEEDED
     */
    private static fetch() {

    }
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
    }
}

/**
 * Value and reason the same cos laziness
 */
export type ProxyFetchResult<T extends string = string> = { success: false, value: T } | { success: true, value: Response };