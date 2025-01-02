import "dotenv/config";

import Config from "./config/index.js";
import Logger from "./manager/logger.js";
import DatabaseManager  from "./manager/database.js";
import Hydra from "./manager/discord.js";
import Swarm from "./manager/epicduel.js";
import DesignNoteManager from "./manager/designnote.js";

import pg from "pg";

// This will just let the image manager load.
import "./manager/image.js";
import { SwarmError } from "./util/errors/index.js";
import SwarmResources from "./util/game/SwarmResources.js";
import ProxyManager from "./manager/proxy.js";

Logger._saveToRotatingFile(Config.logsDirectory);

const bot = new Hydra();

DesignNoteManager.discord = bot;
Swarm.discord = bot;

Logger.getLogger("Launch").info(`Mode: ${Config.isDevelopment ? "BETA" : "PROD"}`);
Logger.getLogger("Launch").info(`Node Version: ${process.version}`);
Logger.getLogger("Launch").info(`OS: ${process.platform} (Is On Docker: ${Config.isDocker})`);

process
    .on("uncaughtException", err => {
        Logger.getLogger("Uncaught Exception").error(err)

        if (err instanceof pg.DatabaseError) {
            const { length, severity, code, file, routine } = err;

            Logger.getLogger("Uncaught Database Error").info({ length, severity, code, file, routine });
        }
    })
    .on("unhandledRejection", (r, p) => {
        console.error(r, p);
        Logger.getLogger("Unhandled Rejection | Reason").error(r);

        if (r instanceof pg.DatabaseError) {
            const { length, severity, code, file, routine } = r;

            console.log({ length, severity, code, file, routine });

            Logger.getLogger("Uncaught Database Error").info({ length, severity, code, file, routine });
        }
        // Logger.getLogger("Unhandled Rejection | Promise").error(p);
        // p.catch(v => Logger.getLogger("Unhandled Rejection | Promise").error(v));
    })
    .once("SIGINT", async () => {
        try {
            let promises: Promise<any>[] = [];

            if (bot.queues.gift) {// && cli && cli.modules.Advent.status >= 0) {
                bot.queues.gift.ignore = true;
                promises.push(bot.queues.gift._elapsed(true));
            }

            if (bot.queues.spy) {
                bot.queues.spy.ignore = true;
                promises.push(bot.queues.spy._elapsed());
            }

            promises.push(bot.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                content: "The bot has received a signal to terminate. It'll shut down."
            }));

            await Promise.all(promises);

            const edClis = Swarm.clients.concat(Swarm.purgatory);


            for (let i = 0, len = edClis.length; i < len; i++) {
                const ed = edClis[i];

                ed.settings.reconnectable = false;
                ed.smartFox?.disconnect?.();
            }
            
            for (let timer of Object.values(bot.timer)) {
                timer.stop();
            }

            bot.disconnect(false);
            DatabaseManager.cli.end();
            ProxyManager.timer.stop();
        } catch (err) {
            Logger.getLogger("Process").error(err);

            process.exit();
        } finally {
            process.kill(process.pid, "SIGINT");
        }
    })
    .once("SIGTERM", (signal) => {
        bot.rest.channels.createMessage("988216659665903647", { content: "SIGINT - " + signal })
            .then(() => process.kill(process.pid, "SIGTERM"), () => process.kill(process.pid, "SIGTERM"));

        // process.kill(process.pid, "SIGTERM");
    })
    .on("exit", (code) => {
        console.error(code);
    })

await DatabaseManager.initialise();

await ProxyManager.timer.start(true);
Swarm.cycler.checkForChanges();

await Swarm["create"](Config.edBotEmail, Config.edBotPass).then(cli => {
    Logger.getLogger("Swarm").debug("Connected, as user Id: " + cli.user.userid);
    cli.settings.reconnectable = true;

    SwarmResources.tracker.war.activate();
    // SwarmResources.tracker.gift.activate();
    // cli["connect"]();
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

// setTimeout(() => {
//     Swarm["clients"][0].smartFox.disconnect();
// }, 60000);

await bot.launch();