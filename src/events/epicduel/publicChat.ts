import Config from "../../config/index.js";
import DatabaseManager from "../../manager/database.js";
import Logger from "../../manager/logger.js";
import { countCommonStrings, findIndex } from "../../util/Misc.js";
import EDEvent from "../../util/events/EDEvent.js";

export default new EDEvent("onPublicMessage", function (hydra, { message, user: author }) {
    if (Config.isDevelopment && this.smartFox.getActiveRoom()?.name === "TrainHubRight_0") return;

    const time = Date.now();

    const spaced = message.split(" ");

    if (hydra.cache.codes.length && spaced.length > 3) {
        const index = findIndex(hydra.cache.codes, v => v != undefined && v[1] === message);

        if (index !== -1) {
            const cche = hydra.cache.codes[index];

            // Code hasn't expired yet
            if (time < cche[2]) {
                // First step, add to database.

                let flags = 0;

                if (author.isLegendary)   flags += 1 << 0;
                if (author.isModerator()) flags += 1 << 1;
                if (author.isSpectator()) flags += 1 << 2;

                DatabaseManager.helper.linkCharacter(cche[0], author.userId, author.charId, { flags }).then((val) => {
                    console.log(val);
                    if (val.success) {
                        hydra.rest.users.createDM(cche[0]).then((t) => {
                            t.createMessage({
                                content: `Successfully linked!\nYour new linked character: **${author.charName}** (Lvl ${author.charLvl}).`
                            }).then(() => { delete hydra.cache.codes[index]; }).catch((err) => {
                                Logger.getLogger("Linker").error(err);
                                hydra.rest.webhooks.execute(cche[3], cche[4], {
                                    flags: 64, content: "<@" + cche[0] + ">\nYour character has been linked, new character in question: " + `**${author.charName}** (Lvl ${author.charLvl})`, wait: true
                                }).catch(() => {});

                                delete hydra.cache.codes[index];
                            });


                        }, (err) => {
                            hydra.rest.webhooks.execute(cche[3], cche[4], {
                                flags: 64, content: "<@" + cche[0] + ">\nYour character has been linked, new character in question: " + `**${author.charName}** (Lvl ${author.charLvl})`, wait: true
                            }).catch(() => {});

                            delete hydra.cache.codes[index];
                        })
                    } else {
                        hydra.rest.users.createDM(cche[0]).then((t) => {
                            //hydra.cache.codes[v] = null;

                            t.createMessage({
                                content: "The character linking has failed, a problem has occurred trying to add to the database.\n\nNote: linking a character that's already been linked won't work, make sure to unlink that if you haven't.\nContact developer if the problem persists.",
                            }).then(() => { delete hydra.cache.codes[index]; }).catch((err) => {
                                hydra.rest.webhooks.execute(cche[3], cche[4], {
                                    flags: 64, content: "<@"+ cche[0] + ">\nThere's been a problem trying to add the entry to the database, the character linking is unsuccessful.\nNote: linking a character that's already been linked won't work, make sure to unlink that if you haven't.\nContact developer if the problem persists.", wait: true,
                                }).catch(() => {});

                                delete hydra.cache.codes[index];
                            });

                        }, (err) => {
                            hydra.rest.webhooks.execute(cche[3], cche[4], {
                                flags: 64, content: "<@"+ cche[0] + ">\nThere's been a problem trying to add the entry to the database, the character linking is unsuccessful.\nNote: linking a character that's already been linked won't work, make sure to unlink that if you haven't.\nContact developer if the problem persists.", wait: true,
                            }).catch(() => {});

                            delete hydra.cache.codes[index];
                        });
                    }
                });
            }
        }
    }

    // Check for f4f
    const content = message.toLowerCase();

    let list = [["f4f", "fame me", "fame pls", "fame plz", "fame for", "fame back", "fame all", "fameme", "famepls", "fameback", "famebck", "fame y'all"],
                    ["fame", "fme", "you fame", "famed all", "frame bak", "fame bak", "frame me", "frame all", "frame pls", "fr4m3", "fr4me", "frame back"]];

    // if (hydra.messages[0].value.fames?.inc.length) list[0] = [...list[0], ...hydra.messages[0].value.fames.inc];
    // if (hydra.messages[0].value.fames?.all.length) list[1] = [...list[1], ...hydra.messages[0].value.fames.all];

    if (list[0].some(v => content.includes(v)) || list[1].some(v => v === content)) {
        DatabaseManager.helper.incrementFameCounter(author.charId, author.charName, 1, Date.now()).catch(err => { Logger.getLogger("Database").error(err) });
    }

    const edChat = hydra.cache.edChat[author.charId];
    if (edChat) {

        if (edChat.ignores.includes(content)) return;
        if (edChat.mutedUntil && edChat.mutedUntil > time) return;

        if (edChat.msg.length > 5) edChat.msg.splice(0, 1);
        edChat.msg.push({ c: content, t: time });

        if (edChat.msg.length >= 3 && (countCommonStrings(edChat.msg) || (edChat.msg.every(a => a.c === content) && edChat.msg.every(v => (v.t + (1000*150)) > time)))) /*//highestOccurence(edChat.msg)// && edChat.every(v => (v + (1000*30)) > time)) */{
            let punishTime = Date.now();
            let cc = "🔇 **" + ((author.charName) ? author.charName + "**" + ' (**' + author.charId + '**)' : author.charId + "**");

            if (!(author.charName.toLowerCase().includes("voxry") || content.includes("voxry"))) {
                //else punishTime += 1000*5;

                if (edChat.repeats > 0) {
                    // 10 minutes, 30 minutes, 1 hour, 2 hour, 1 day, 1 year (impossible as bot restarts usually every day or two on its own)
                    let extension = [1000*60*10, 1000*60*30, 1000*60*60, 1000*60*60*2, 1000*60*60*24, 1000*60*60*24*364];

                    if (author.charName.toLowerCase().includes("voxry")) punishTime += 1000*60*60*23;

                    punishTime += extension[edChat.repeats - 1];
                } else punishTime += 1000*60*5;

                edChat.mutedUntil = punishTime;

                cc += ' has been automatically muted by the bot for spamming, their messages won\'t show up in that period. The mute will expire/have expired ' + "<t:" + Math.round(punishTime/1000) + ":R>" + '. Offence(s) committed: ' + ++edChat.repeats;
            } else {
                edChat.ignores.push(content);
                cc += "'s one of the message will be filtered (content: `" + content + "`) from now on during the bot's run."
            }

            return hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                wait: false, content: cc,
            }).catch(e => {console.log(e)});
        }

    } else hydra.cache.edChat[author.charId] = { msg: [{c: content, t: time }], mutedUntil: undefined, repeats: 0, ignores: [] };

    hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
        wait: false, content: "**" + ((author.charName) ? author.charName + "**" + ' (**' + author.charId + '**)' : author.charId + "**") + ': ' + message,
    }).catch(e => {console.log(e)});
})