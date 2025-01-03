import { encode } from "querystring";
import Config from "../../config/index.js";
import RoomManager from "../../game/module/RoomManager.js";
import DatabaseManager from "../../manager/database.js";
import ImageManager from "../../manager/image.js";
import Logger from "../../manager/logger.js";
import { countCommonStrings, filter, findIndex } from "../../util/Misc.js";
import { CharToGen } from "../../util/SvgGen.js";
import EDEvent from "../../util/events/EDEvent.js";
import SwarmResources from "../../util/game/SwarmResources.js";

interface LastChatter {
    sfsId: number;
    time: number;
    msg: string;
    roomId: number;
}

const lastChatters:LastChatter[] = [];

export default new EDEvent("onPublicMessage", function (hydra, { message, user: author, roomId }) {
    if (Config.isDevelopment && this.smartFox.getActiveRoom()?.name === "TrainHubRight_0") return;

    const time = Date.now();

    for (let i = 0, len = lastChatters.length; i < len; i++) {
        const chatter = lastChatters[i];

        if ((chatter.time + 250) > time && chatter.sfsId === author.id && chatter.msg === message && chatter.roomId === roomId) {
            return;
        }
    }

    lastChatters.push({ time, sfsId: author.id, msg: message, roomId });
    if (lastChatters.length > 9) lastChatters.splice(0, 1);

    // let puppetNTxt = `Puppet ID: ${this.settings.id}`;

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
        DatabaseManager.helper.incrementFameCounter(author.charId, author.charName, 1, time).catch(err => { Logger.getLogger("Database").error(err) });
    }

    const edChat = hydra.cache.edChat[author.charId];
    if (edChat) {
        if (edChat.ignores.includes(content)) return;
        if (edChat.mutedUntil && edChat.mutedUntil > time) return;

        if (edChat.msg.length > 5) edChat.msg.splice(0, 1);
        edChat.msg.push({ c: content, t: time });

        if (edChat.msg.length >= 3 && (countCommonStrings(edChat.msg) || (edChat.msg.every(a => a.c === content) && edChat.msg.every(v => (v.t + (1000*150)) > time)))) /*//highestOccurence(edChat.msg)// && edChat.every(v => (v + (1000*30)) > time)) */{
            let punishTime = time;
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
                cc += "'s message will be filtered (content: `" + content + "`) from now on during the bot's run."
            }

            // Non queue
            return hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                wait: false, content: cc,
            }).catch(e => {console.log(e)});
        }

    } else hydra.cache.edChat[author.charId] = { msg: [{c: content, t: time }], mutedUntil: undefined, repeats: 0, ignores: [] };

    const roomRecord = RoomManager.getRoomRecord2(this.smartFox.getActiveRoomFr().name);

    let webGuy = {
        username: undefined,
        avatarURL: undefined
    } as Record<"username" | "avatarURL", string|undefined>;

    if (roomRecord) {
        // The room record exists so we'll check for a merchant, and use it instead of default profile.

        if (roomRecord.merchants.length) {
            const uniqueMerc = filter(RoomManager.unique_merchants, v => roomRecord.merchants.includes(v));

            if (uniqueMerc.length > 0 && roomRecord.roomName !== "TrainHubRight") {
                for (let i = 0, len = uniqueMerc.length; i < len; i++) {
                    const npc = this.boxes.merchant.objMap.get(uniqueMerc[i]);

                    if (npc && ImageManager.has("avatars", npc.mercLink + ".png")) {
                        const wId = SwarmResources.rooms.get(roomId)?.name.slice(-1);
    
                        webGuy.username = wId ? npc.mercName + " (World " + wId + ")" : npc.mercName + " at " + RoomManager.getRegionNameById(roomRecord.regionId);
                        webGuy.avatarURL = "https://i.doomester.one/ed/avatars/" + npc.mercLink + ".png";
                    }
                }
            } else {
                for (let i = 0, len = roomRecord.merchants.length; i < len; i++) {
                    const merc = roomRecord.merchants[i];

                    const npc = this.boxes.merchant.objMap.get(merc);

                    // Lionhart soldiers are goddamn everywhere
                    if (len > 1 && npc && npc.mercName === "Lionhart Soldier") continue;

                    if (npc && ImageManager.has("avatars", npc.mercLink + ".png")) {
                        webGuy.username = npc.mercName + " at " + RoomManager.getRegionNameById(roomRecord.regionId);
                        webGuy.avatarURL = "https://i.doomester.one/ed/avatars/" + npc.mercLink + ".png";

                        if (npc.mercName === "VendBot") {
                            if (roomRecord.regionId === RoomManager.REGION_CENTRAL_STATION_ID) {
                                const wId = this.smartFox.getActiveRoomFr().name.slice(-1);

                                if (wId !== "0") webGuy.username = "VendBot (World " + wId + ")";//= "VendBot at " + this.smartFox.getActiveRoomFr().name.slice(-1);
                                // else webGuy.username = "VendBot";
                            }
                            break;
                        }

                        // Let's stick with a bot!
                        if (npc.mercName.toLowerCase().includes("bot")) break;
                    }
                }
            }
        } else {
            if (this.settings.id !== 1) {
                if (roomRecord.objectiveId > 0) {
                    const obj = this.boxes.war.getObjectiveById(roomRecord.objectiveId);

                    if (obj) {
                        const region = this.boxes.war.getRegionById(obj?.regionId);

                        if (region) {
                            webGuy.username = obj.objTitle;
                            webGuy.avatarURL = "https://i.doomester.one/ed/war/IconWarObjItem" + region.defenseSuperItemId + ".png";

                        } // how tf
                    }
                }
            }
        }

        // Still undefined?
        if (webGuy.username === undefined && webGuy.avatarURL === undefined) {
            webGuy.avatarURL = "https://i.doomester.one/ed/cores/RegionOverlordFacility.png";
            webGuy.username = "At Unknown Area";
        }
    }

    if (this.swarm.settings.test1) {
        const armor = this.boxes.item.getItemById(author.charArm, true);
        const style = this.boxes.style.getStyleRecord(author.charClassId, author.charHairS, author.charGender as "M" | "F");//.objMap.find(v => v.styleIndex === char.misc.hairS && v.styleClassId === adj);
        
        if (armor && armor.isArmorItemRecord() && style) {
            const obj:Omit<CharToGen, "bypass"> & Record<"flip", string> = {
                charAccnt: author.charAccnt,
                charAccnt2: author.charAccnt2,
                charArm: author.charArm,
                charClassId: author.charClassId,
                charEye: author.charEye,
                charGender: author.charGender as "M" | "F",
                charHair: author.charHair,
                charHairS: author.charHairS,
                charPri: author.charPri,
                charSec: author.charSec,
                charSkin: author.charSkin,
                customHeadLink: armor.customHeadLink,
                noHead: armor.noHead ? "1" : "0",
                // bypass: {
                //     body: armor.getAssetPool(author.charClassId, { g: author.charGender }).body.slice("assets/body/".length),
                //     bicepR: armor.defaultLimbs ? null : armor.getAssetPool(author.charClassId, { g: author.charGender }).bicepR.slice("assets/body/".length)
                // },
                styleHasAbove: style ? style.styleHasAbove : false,
                armClass: armor.itemClass as 0 | 1 | 2 | 3,
                armGender: armor.itemSexReq as "M" | "F",
                armMutate: armor.itemLinkage === "Mutate" ? "1" : "0",
                defaultLimbs: armor.defaultLimbs ? "1" : "0",

                flip: "0",
            }

            //@ts-expect-error
            if (global.oklogtime) console.log("https://ei.doomester.one/char?" + encode(obj));

            return hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                wait: true, content: message,
                username: author.charName + " (ID: " + author.charId + ", " + webGuy.username + ")",
                avatarURL: "https://ei.doomester.one/char?" + encode(obj)
            }).catch(err => Logger.getLogger("SpyChat").error(err));
        }
    }
    
    // Non queue
    hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
        wait: false, content: "**" + ((author.charName) ? author.charName + "**" + ' (**' + author.charId + '**)' : author.charId + "**") + ': ' + message,
        username: webGuy.username,
        avatarURL: webGuy.avatarURL,
    }).catch(e => {console.log(e)});
}, {
    lastChatters
})
// default.lastChatters = lastChatters;