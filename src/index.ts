import "dotenv/config";

import Config from "./config/index.js";
import Logger from "./manager/logger.js";
import DatabaseManager  from "./manager/database.js";
import Hydra from "./manager/discord.js";
import { readFile } from "fs/promises";

Logger._saveToRotatingFile(Config.logsDirectory);

const bot = new Hydra();

Logger.getLogger("Launch").info(`Mode: ${Config.isDevelopment ? "BETA" : "PROD"}`);
Logger.getLogger("Launch").info(`Node Version: ${process.version}`);
Logger.getLogger("Launch").info(`OS: ${process.platform} (Is On Docker: ${Config.isDocker})`);

process
    .on("uncaughtException", err => Logger.getLogger("Uncaught Exception").error(err))
    .on("unhandledRejection", (r, p) => {
        console.error(r, p);
        Logger.getLogger("Unhandled Rejection | Reason").error(r);
        Logger.getLogger("Unhandled Rejection | Promise").error(p);
    })
    .once("SIGINT", () => {
        process.kill(process.pid, "SIGINT");
    })
    .once("SIGTERM", () => {
        process.kill(process.pid, "SIGTERM");
    });

await DatabaseManager.initialise();

// console.log(await readFile(Config.baseDir + "/migrations/vendie_2024-03-23_164614.sql").then(v => DatabaseManager.cli.query(v.toString())));

await bot.launch();