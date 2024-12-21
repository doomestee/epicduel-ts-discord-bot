import { ActivityTypes } from "oceanic.js";
import Config from "../../config/index.js";
import DesignNoteManager from "../../manager/designnote.js";
import { MainMessageStorage } from "../../manager/discord.js";
import Swarm from "../../manager/epicduel.js";
import Logger from "../../manager/logger.js";
import ClientEvent from "../../util/events/ClientEvent.js";
import { Dispatcher, request } from "undici";
import SwarmResources from "../../util/game/SwarmResources.js";

let once = false;

export default new ClientEvent("ready", function () {
    Logger.getLogger("Bot").info(`Bot took ${(Date.now() - this.connectedAt)/1000} seconds to connect!`)

    // this.editStatus("invisible", []);

    if (!once) {
        this.timer.status.start();

        once = true;
        this.loadMessage<MainMessageStorage>("937078109751083038", "1071155768201580635").then(v => this.messages[0] = v);

        // Setting Dump
        this.rest.channels.getMessages("937078109751083038", { limit: 5 })
            .then(messages => {
                let checked = [0, 0];
                for (let i = 0; i < messages.length; i++) {
                    if (checked[0] && checked[1]) break;
                    // Find the message we're looking for
                    let message = messages[i];

                    //let message = messages[i].content.startsWith("Recent: ");//messages.find(msg => msg.content.startsWith('Recent: '));

                    if (!message.content.startsWith("Recent: ")) {

                        //message = messages[i].content.startsWith("Stuff: ");//.find(msg => msg.content.startsWith('Stuff: '));

                        if (!message.content.startsWith("Stuff: ")) {
                            continue;
                        }

                        checked[1] = 1;

                        let json = JSON.parse(message.content.slice(7)) as {v: number, c: boolean, cv: boolean, r: string};

                        /*if (json.c === true) {
                            epicduel.connect();
                        }*/

                        if (json.v == undefined) {
                            checked[1] = -1;
                            continue;
                        }

                        // if (json.cv == undefined || json.cv == true) {
                        //     epicduel.compareFiles = true;
                        // } else epicduel.compareFiles = false;

                        // epicduel.langVersion = json.v;
                        SwarmResources.version.lang = json.v;

                        SwarmResources.getNewLang().then(v => {
                            if (this.isBotMain() && v.index && json.v !== v.index && v.index !== -1 && v.success) {
                                message.edit({
                                    content: "Stuff: " + JSON.stringify({
                                        ...json, v: v.index
                                    })
                                });
                            }

                            if (Swarm.centralClient?.["isFresh"]) Swarm.getClientById(1)?.["connect"]();
                            // if (json.c === true) epicduel.connect();
                            // else if (json.r) { epicduel.reconnectable = false; epicduel.reasonForOffline = (json.r) ? json.r : "Reason was not provided." };
                        });
                        continue;
                    }

                    if (!(message.content.startsWith("Recent: ") || message.content.startsWith("Stuff: "))) continue;

                    checked[0] = 1;

                    // This should be "Recent: stuff";
                    let content = JSON.parse(atob(message.content.split('\n')[0].slice("Recent: ".length)));

                    DesignNoteManager.recent.epicduel.date = content.epicduel.date;
                    DesignNoteManager.recent.epicduel.dateObj = new Date(content.epicduel.date);
                    DesignNoteManager.recent.epicduel.title = content.epicduel.title;
                    DesignNoteManager.recent.epicduel.poster.name = content.epicduel.poster.name; 

                    DesignNoteManager.recent.artix.date = content.artix.date;
                    DesignNoteManager.recent.artix.dateObj = new Date(content.artix.date);
                    DesignNoteManager.recent.artix.title = content.artix.title;
                    DesignNoteManager.recent.artix.poster.name = content.artix.poster.name;

                    if (!Config.isDevelopment) {
                        DesignNoteManager.run();
                        Logger.getLogger("DNote").debug("Scraper is running.");
                    } else Logger.getLogger("DNote").debug("Scraper is not running.");
                }

                if (checked[0] < 1) {
                    Logger.getLogger("DNote").error("Missing message in setting_dump vital for design notes.");
                }

                if (checked[1] < 1) {
                    if (checked[1] === -1) {
                        if (Swarm.centralClient?.["isFresh"]) Swarm.getClientById(1)?.["connect"]();
                        // Swarm.getClientById(1)?.["connect"]();//epicduel.connect();
                    }
                    Logger.getLogger("DNote").error("Missing language version for epicduel.");
                }
            });

        this.rest.channels.getMessages("1034498187911774278", {limit: 10}).then((messages) : Promise<true | Dispatcher.ResponseData> => {
            if (!messages.length) return Promise.resolve(true);

            let filtered = messages.filter(v => v.attachments.size);/*/ && v.attachments.some(v => v.filename.endsWith("json")));*/
            if (!filtered.length) return Promise.resolve(true);

            let attachment = filtered[0].attachments.first();
            if (!attachment) return Promise.resolve(true);

            return request(attachment.url, {
                method: "GET"
            });
        }).then((stuff) => {
            if (stuff === true) return false;

            if (!(stuff.statusCode >= 200 && stuff.statusCode < 300)) return false;

            return stuff.body.json();
        }).then((json) => {
            if (json === false) return;

            SwarmResources.comparisonFiles = json as any;

            SwarmResources.comparison.fileRetrieved = true;//checkpoints.comparison[0] = 1;//.emit("epicduel_epicduel_comparison", 0);
            return json;
        }).catch((err) => {
            Logger.getLogger("Comparison").error(err);
            return true;
        });
    }
});