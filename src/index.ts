import "dotenv/config";

import Config from "./config/index.js";
import Logger from "./manager/logger.js";
import DatabaseManager  from "./manager/database.js";
import Hydra from "./manager/discord.js";
import { readFile } from "fs/promises";
import Swarm from "./manager/epicduel.js";

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
await Swarm["create"](Config.edBotEmail, Config.edBotPass).then(cli => {
    Logger.getLogger("SWARM").debug("Connected, as user Id: " + cli.user.userid);
    cli.settings.reconnectable = true;
    cli["connect"]();
});

// console.log(await readFile(Config.baseDir + "/migrations/vendie_2024-03-23_164614.sql").then(v => DatabaseManager.cli.query(v.toString())));

await bot.launch();
Swarm.cycler.checkForChanges();

setTimeout(() => {
    Swarm["clients"][0].smartFox.disconnect();
}, 60000);