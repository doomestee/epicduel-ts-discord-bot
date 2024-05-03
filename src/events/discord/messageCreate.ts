import { Embed, File, MessageTypes } from "oceanic.js";
import ClientEvent from "../../util/events/ClientEvent.js";
import Logger from "../../manager/logger.js";
import { filter, map, sleep } from "../../util/Misc.js";
import { AnyItemRecordsExceptSelf } from "../../game/box/ItemBox.js";
import Swarm from "../../manager/epicduel.js";
import { Item } from "../../Models/Item.js";

export default new ClientEvent("messageCreate", async function (msg) {
    // Jaja
    if (msg.channelID === "1106617499291746445" && msg.type === MessageTypes.THREAD_CREATED && msg.author.id === this.user.id) return this.rest.channels.deleteMessage(msg.channelID, msg.id, "pls remove this announcement discord");

    if (msg.channelID !== "1106617499291746445") return; //&& msg.webhookID !== "1106621206658040001") return;

    const criteria = msg.webhookID === "1106621206658040001" || (msg.content.startsWith("twit ") && this.isMaintainer(msg.author.id));

    // Not from a tweetshift webhook or from a maintainer authorised intervention.
    if (!criteria) return;

    let message = msg;
    if (msg.content.startsWith("twit ")) {
        await this.rest.channels.getMessage("1106617499291746445", msg.content.slice(5))
            .then(m => message = m)
            .catch(e => Logger.getLogger("Twitter").error(e));//msg.channel?.createMessage({ content: "a" }));
    }

    if (!message.embeds.length) return;
    if (!message.embeds[0].author?.name.includes("Nightwraith")) return;

    const txt = message.embeds[0].description?.replace(/\n/g, " ").split(" ");

    if (!txt || !txt.some(v => v.toLowerCase().includes("edcodes"))) return;

    const codes = map(filter(txt, v => v.length && v === v.toUpperCase()), v => v.trim());

    let cantRedeem = codes.length === 0;

    // if (epicduel.client.smartFox === undefined || (epicduel.client.smartFox && !epicduel.client.smartFox.connected)) cantRedeem = true;
    // if (!cantRedeem && codes.length === 0) cantRedeem = true;

    let embeds:Embed[] = [];
    let creditIndex = -1;
    let accumCredits = 0;

    let tries = 0;

    let files:File[] = [];

    let prevCliId = -1;

    if (!cantRedeem) {
        for (let i = 0, len = codes.length; i < len; i++) {
            const cli = Swarm.getClient(v => v.connected && v.lobbyInit);

            if (!cli) {
                tries++; cantRedeem = true;

                break; // For now, this is somehow inducing the most, MASSIVE memory leak every 4pm GMT when a first star saber of the day drops... just... what?

                // Theory: await asleep is probably blocking the call, as there wouldn't be any console log or anything when a client restarts.

                /*// Too many tries, the code will stop as it assumes it can't be in game.
                if (tries > 5) { cantRedeem = true; break; }

                i--; await sleep(10000); continue;*/
            }

            // The previous client disconnected, this happens when the previous client is half dead so will be retrying.
            if (prevCliId !== -1 && prevCliId !== cli.settings.id) i--;
            // else {
                prevCliId = cli.settings.id;
            // }

            const code = await cli.redeemCode(codes[i]);

            if (code.status) {
                for (let prize of code.prizes) {
                    switch (prize.type) {
                        case "credits":
                            accumCredits += prize.amount;

                            if (creditIndex !== -1) {
                                embeds[creditIndex].description = "The code(s) grants %" + accumCredits + "% credits."
                                //@ts-expect-error
                                embeds[creditIndex].fields[0].value += ", " + codes[i]
                            } else {
                                embeds = [{
                                    title: "Credits", color: 0xfff88f,
                                    description: "The code(s) grants %" + accumCredits + "% credits.",
                                    fields: [{
                                        name: "Code(s)",
                                        value: codes[i]
                                    }]
                                }, ...embeds]; creditIndex = 0;
                            }
                            break;
                        case "home":
                            embeds.push({
                                title: "Home Item", color: 0x733400,
                                description: "ID: " + prize.id,
                                fields: [{
                                    name: "Code",
                                        value: codes[i]
                                    }],
                                footer: {
                                    text: "Yes, that's it."
                                }
                            });
                            break;
                        case "item":
                            {
                                let { embeds: mmmbeds, files: files2 } = await Item.resultify(prize.item);

                                mmmbeds[0].fields?.push({
                                    name: "Code",
                                    value: codes[i],
                                    inline: false
                                });

                                if (files2.length) files = files.concat(files2);

                                embeds = embeds.concat(mmmbeds);
                            }
                            break;
                    }
                }
            }

            // TODO: replace the stupid sleep thing which no doubt will have blocked synchronous crap.
            if ((i + 1) !== len) await sleep(5000);
        }
    }

    let thread = await this.rest.channels.startThreadFromMessage(message.channelID, message.id, {
        name: "Prize Code(s) Analysis", //(codes.length) ? codes.length + " Codes Analysed" : "No Codes Found",
        reason: "Automatic Code Analysis", autoArchiveDuration: 1440
    });//.catch(err => { return { error: err }});

    // if (thread.error) return logger.error(thread.error);

    await this.rest.channels.createMessage(thread.id, {
        content: ((cantRedeem && embeds.length === 0) || embeds.length === 0) ? "Analysis Failed" : codes.length + " Code" + (codes.length > 1 ? "s" : "") + " Analysed",
        embeds: (embeds.length) ? embeds : [], files
    }).catch(err => { Logger.getLogger("Twitter").error(err); })

    // Personal send to ED Community's #vendbot

    if (embeds.length && !cantRedeem) {
        return this.rest.channels.createMessage("1091045429367558154", {
            content: codes.length + " code" + (codes.length > 1 ? "s" : "") + " analysed.\n*The code(s) are from Nightwraith's twitter post.",
            embeds: embeds,
            files: files,
        })
    } else {
        return this.rest.channels.createMessage("1091045429367558154", {
            content: "The bot couldn't redeem the code(s).",
            embeds: [{
                color: 0xFF0000,
                fields: [{
                    name: "Code", value: codes.join(", ")
                }]
            }]
        })
    }
})