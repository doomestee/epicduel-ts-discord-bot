import MerchantSBox from "../../../game/box/MerchantBox.js";
import RoomManager from "../../../game/module/RoomManager.js";
import type MerchantRecord from "../../../game/record/MerchantRecord.js";
import type RoomManagerRecord from "../../../game/record/RoomManagerRecord.js";
import Swarm from "../../../manager/epicduel.js";
import ImageManager from "../../../manager/image.js";
import Command, { CommandType } from "../../../util/Command.js";
import { filter, find, getHighestTime } from "../../../util/Misc.js";
import { generatePhrase } from "../../../util/Phrase.js";

export default new Command(CommandType.Component, { custom_id: "character_link" })
    .attach('run', async ({ client, interaction, variables }) => {
        const time = process.hrtime.bigint();
        const timeDrop = () => ({ footer: { text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.` } });
    
        const clis = Swarm.clis;//getClient(v => v.connected && v.lobbyInit && v.smartFox.getActiveRoom()?.name?.startsWith("TrainHubRight") === true, true, false);
    
        let vendbot = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
        let junker = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
    
        let count = {
            junker: 0,
            vendbot: 0
        };
    
        let uniques:Array<{ npc: MerchantRecord, room: RoomManagerRecord, world: number }> = [];
    
        for (let i = 0, len = clis.length; i < len; i++) {
            const room = clis[i].smartFox.getActiveRoom();
    
            const world = parseInt(room?.name.slice(-1) ?? "69");
    
            if (world === 69 || !room) continue;
    
            if (room.name.startsWith("TrainHubRight")) {
                if (vendbot[world] === -1) count["vendbot"]++;
    
                vendbot[world] = world;
                continue;
            } else if (room.name.startsWith("TrainHubBLeft")) {
                if (junker[world] === -1) count["junker"]++;
    
                junker[world] = world;
                continue;
            }
    
            const roomRecord = RoomManager.getRoomRecord2(room.name);
    
            if (roomRecord?.merchants.length) {
                const uniqueMercs = filter(RoomManager.unique_merchants, v=> roomRecord.merchants.includes(v));
    
                for (let u = 0, uen = uniqueMercs.length; u < uen; u++) {
                    const npc = MerchantSBox.objMap.get(uniqueMercs[u]);
    
                    if (npc && npc.mercName !== "Lionhart Soldier") uniques.push({ npc, world, room: roomRecord });
                }
            }
        }
    
        if (clis.length === 0 || (count.junker === 0 && count.vendbot === 0 && uniques.length === 0)) return interaction.reply({ content: "Sorry, there are no available eligible clients that can respond to your query yet.", flags: 64 });
    
        await interaction.defer(64);
    
        // Check if code already exists for the user, if so then they may need a new code (assuming it has expired)
    
        let roomName = "";
        let world = "";
    
        let avatar = "";
    
        if (count.vendbot || count.junker) {
            // cba to optimise
            if (count.vendbot) {
                roomName = " in Central Station, VendBot";
    
                if (count.vendbot === 1) world += " at World " + find(vendbot, v => v !== -1) + ".";
                else if (count.vendbot === 9) world += ", any world from 0 to 8."  
                else {
                    let cont = false;
    
                    world = ", any world from ";
    
                    for (let i = 0, len = 10; i < len; i++) {
                        const v = vendbot[i];
    
                        if (v !== -1 && v !== undefined) {
                            if (!cont) world += v.toString();
                            cont = true;
                        } else {
                            if (cont) {
                                cont = false;
                                world += "-" + (i - 1).toString() + ", "
                            }
                        }
                    }

                    world = world.slice(0, -2) + ".";
                }
            }
    
            else {
                roomName = " in Central Station, Junker";
    
                if (count.junker === 1) world += " at World " + find(junker, v => v !== -1) + ".";
                else if (count.junker === 9) world += ", any world from 0 to 8."  
                else {
                    let cont = false;
    
                    world = ", any world from ";
    
                    for (let i = 0, len = 10; i < len; i++) {
                        const v = junker[i];
    
                        if (v !== -1 && v !== undefined) {
                            if (!cont) world += v.toString();
                            cont = true;
                        } else {
                            if (cont) {
                                cont = false;
                                world += "-" + (i - 1).toString() + ", "
                            }
                        }
                    }

                    world = world.slice(0, -2) + ".";
                }
            }
        
            avatar = count.vendbot ? "VendBot.png" : "Junker.png";
        }
    
        if (roomName.length === 0 && uniques.length) {
            let merc = find(uniques, v => ImageManager.has("avatars", v.npc.mercLink + ".png"));
    
            if (merc) {
                avatar = merc.npc.mercLink + ".png";
            } else merc = uniques[0];
    
            roomName = "in " + RoomManager.getRegionNameById(merc.room.regionId) + ", " + merc.npc.mercName;
            world = " at World " + world + ".";
        }
    
        if (roomName.length === 0) return interaction.reply({ content: "Sorry, there are no available eligible clients that can respond to your query yet.", flags: 64 });
    
        let instruction = "You must say this code" + roomName + world + "\n\nNote that the bot is invisible (thank EpicDuel's security) so you will receive either a direct message from the bot, or in case the DM fails, you'll receive a response to this interaction."
    
        // let instruction = "You must say this code in **" + room.name.slice(0, -2) + "**, world **" + room.name.slice(-1) + "**.\n\n"
    
        const has = client.cache.codes.findIndex(v => v && v[0] === interaction.user.id);
        if (has !== -1) {
            // Allow for 5 seconds grace, cos this is practically unrealistic for the user to verify when they were reminded of their code just a few seconds before it expires.
            if (Date.now() < (client.cache.codes[has][2] - 5000)) return interaction.reply({embeds: [{ description: `The code is still \`${client.cache.codes[has][1]}\`, this will expire by either when the bot restarts (the code is temporarily cached) or <t:${Math.floor(client.cache.codes[has][2]/1000)}:R>.\n\n` + instruction, ...timeDrop(), thumbnail: { url: avatar !== "" ? "https://i.doomester.one/ed/avatars/" + avatar : "" } }], flags: 64});
            else delete client.cache.codes[has];
        }
    
        const code = generatePhrase(4, 1, ' ');
    
        client.cache.codes.push([interaction.user.id, code, Date.now() + 1000*60*10, interaction.applicationID, interaction.token]);
    
        return interaction.reply({ embeds: [{
            thumbnail: { url: avatar !== "" ? "https://i.doomester.one/ed/avatars/" + avatar : "" },
            description: `Your code: \`${code}\`.\nThe code will expire in **10 minutes**.\n\n` + instruction,
            ...timeDrop()
        }], flags: 64})
    });