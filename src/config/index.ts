//import pkg from ".." assert { type: "json" };
import { type ClientOptions, Permissions, type UpdatePresenceOptions, ActivityTypes } from "oceanic.js";
import { access, readFile } from "node:fs/promises";

const isDocker = await access("/.dockerenv").then(() => true, () => false) || await readFile("/proc/1/cgroup", "utf8").then(contents => contents.includes("docker"), () => false);

let debugLogging: boolean;
const baseDir = decodeURIComponent(new URL("../../", import.meta.url).pathname.slice(0, -1));
export default class Config {
    static get isDevelopment() {
        return !isDocker || process.env.NODE_ENV?.toLowerCase() !== "production";
    }

    static get isDocker() {
        return isDocker;
    }

    static get debugLogging() {
        return debugLogging ?? this.isDevelopment;
    }

    static set debugLogging(val: boolean) {
        debugLogging = val;
    }

    // Discord Bot
    static get botToken() {
        return process.env.BOT_TOKEN;
    }

    // Api keys

    // Database
    static get dbHost() {
        return this.isDevelopment ? "localhost" : "postgres.containers.local";
    }
    static get dbPort() {
        return 5432;
    }
    static get dbUser() {
        return "vendie";
    }
    static get dbPassword() {
        return undefined;
    }
    static get dbSSL() {
        return false;
    }
    static get dbDatabase() {
        return "vendie";
    }

    /* Directories */
    static get baseDir() {
        return baseDir;
    }

    static get svgDir() {
        return this.isDocker ? "/svgs" : `${this.baseDir}/data/svgs`;
    }

    static get dataDir() {
        return this.isDocker ? "/data" : `${this.baseDir}/data/bot`;
    }

    static get logsDirectory() {
        return `${this.dataDir}/logs`;
    }

    static get eventsDirectory() {
        return decodeURIComponent(new URL("../events", import.meta.url).pathname);
    }

    static get commandsDirectory() {
        return decodeURIComponent(new URL("../interactions", import.meta.url).pathname);
    }

    static get cacheDirectory() {
        return decodeURIComponent(new URL("../../cache", import.meta.url).pathname);
    }

    static get queuesDirectory() {
        return decodeURIComponent(new URL("../structures/queue", import.meta.url).pathname);
    }

    // ED
    static get edBotEmail() {
        return process.env.ED_EMAIL;
    }

    static get edBotPass() {
        return process.env.ED_PASS;
    }

    static get edPuppetPass() {
        return process.env.BULK_PASS;
    }

    static readonly webhooks = {
        spyChat: {
            id: process.env.SPY_CHAT_WEBHOOK_ID as string,
            token: process.env.SPY_CHAT_WEBHOOK_TOKEN as string,
        },
        updateTracker: {
            id: process.env.UPDATE_TRACKER_WEBHOOK_ID as string,
            token: process.env.UPDATE_TRACKER_WEBHOOK_TOKEN as string,
        },
        entryTracker: {
            id: process.env.ENTRY_TRACKER_WEBHOOK_ID as string,
            token: process.env.ENTRY_TRACKER_WEBHOOK_TOKEN as string,
        },
    }
}