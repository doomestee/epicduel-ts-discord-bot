import "dotenv/config";

import Config from "./config/index.js";
import Logger from "./manager/logger.js";
import DatabaseManager  from "./manager/database.js";
import Hydra from "./manager/discord.js";
import Swarm from "./manager/epicduel.js";
import DesignNoteManager from "./manager/designnote.js";

// This will just let the image manager load.
import "./manager/image.js";
import { SwarmError } from "./util/errors/index.js";

Logger._saveToRotatingFile(Config.logsDirectory);

const bot = new Hydra();

DesignNoteManager.discord = bot;
Swarm.discord = bot;

Logger.getLogger("Launch").info(`Mode: ${Config.isDevelopment ? "BETA" : "PROD"}`);
Logger.getLogger("Launch").info(`Node Version: ${process.version}`);
Logger.getLogger("Launch").info(`OS: ${process.platform} (Is On Docker: ${Config.isDocker})`);

if (!Config.isDevelopment) {
    DesignNoteManager.run();
    Logger.getLogger("DNote").debug("Scraper is running.");
} else Logger.getLogger("DNote").debug("Scraper is not running.");

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
    Logger.getLogger("Swarm").debug("Connected, as user Id: " + cli.user.userid);
    cli.settings.reconnectable = true;
    cli["connect"]();
}).catch(sike => {
    if (sike instanceof SwarmError) {
        if (sike.type === "NO_SERVER") {
            Swarm.probing = true;
        }
    }
    Swarm.getClientById(1, true)?.selfDestruct(false);
    Logger.getLogger("Swarm").error(sike);
});

// console.log(await readFile(Config.baseDir + "/migrations/vendie_2024-03-23_164614.sql").then(v => DatabaseManager.cli.query(v.toString())));

await bot.launch();
Swarm.cycler.checkForChanges();

// setTimeout(() => {
//     Swarm["clients"][0].smartFox.disconnect();
// }, 60000);