import { Entity } from "../../Models/EntityStat.js";
import { IUserRecord } from "../../Models/UserRecord.js";
import Config from "../../config/index.js";
import DatabaseManager from "../../manager/database.js";
import Logger from "../../manager/logger.js";
import EDEvent from "../../util/events/EDEvent.js";

export default new EDEvent("onUserListUpdate", async function (hydra, { list, type, user }) {
    const time = Date.now();

    if (user.charId !== undefined && user.userId !== undefined) {
        // for (let i of Object.entries(epicduel.sfsUsers)) {
        //     if (i[1].charId === user.charId && i[0] != user.id) delete epicduel.sfsUsers[i[0]];
        // }
        
        // epicduel.sfsUsers[user.id] = {
        //     charName: user.charName,
        //     charId: user.charId,
        //     userId: user.userId,
        //     charLvl: user.charLvl,
        //     charExp: user.charExp,
        //     sfsUserId: user.id,
        //     faction: {
        //         title: user.charTitle,
        //         name: user.fctName
        //     }, totalInf: user.charTotalInfluence,
        //     warAlign: user.charWarAlign,
        //     isMod: user.isMod,
        //     hasLeft: type === 2,
        //     lastSeen: new Date()
        // };

        let flags = 0;

        if (user.isLegendary) flags += 1 << 0;
        if (user.isModerator())       flags += 1 << 1;
        if (user.isSpectator())      flags += 1 << 2;

        if (user.isModerator()) {
            hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                wait: false, content: "A moderator (**" + user.charName + "** - [**" + user.charId + "**]" + ") has " + ((type === 1) ? "joined" : "left") + " the room (" + this.smartFox.getActiveRoomFr().name + ")"
            }).catch(e => {console.log(e)});
        }

        let tracked = hydra.messages[0].value.track[user.charId];
        if (tracked !== undefined) {//.includes(user.charId)) {
            if (tracked === 1) {
                hydra.rest.channels.createMessage("988216659665903647", {
                    content: "A user being tracked - 1 - (**" + user.charName + "** - [**" + user.charId + "**]" + ") has " + ((type === 1) ? "joined" : "left") + " the room!"
                })
            } else if (tracked === 2) {
                hydra.rest.webhooks.execute(Config.webhooks.spyChat.id, Config.webhooks.spyChat.token, {
                    wait: false, content: "A user being tracked (**" + user.charName + "** - [**" + user.charId + "**]" + ") has " + ((type === 1) ? "joined" : "left") + " the room!"
                }).catch(e => {console.log(e)});
            }
        }

        const obj = {
            id: user.charId,
            user_id: user.userId,
            name: user.charName || null,
            flags: flags,
            rating: user.rating,
            exp: user.charExp,
            fame: user.charFame,
            faction_id: user.fctId,
            inv_slots: user.variables.charInvSlots,
            bank_slots: user.variables.charBankSlots,
            last_seen: new Date(),
            alignment: (user.charWarAlign >= 0 && user.charWarAlign <= 2) ? user.charWarAlign : null
            //oldNames: JSON.stringify([user.charName, new Date()])
        };

        await Promise.all([
            DatabaseManager.upsert("character", obj, ["id", "user_id"])
                .catch(e => Logger.getLogger("CharTracker").error(e)),//logger.error(e)),

            DatabaseManager.cli.query(`SELECT * FROM character_name WHERE id = $1 ORDER BY last_seen desc LIMIT 1`, [user.charId])
                .then(v => {
                    if (v.rows.length && v.rows[0].name.toLowerCase() === user.charName.toLowerCase()) {
                        return DatabaseManager.cli.query(`UPDATE character_name SET last_seen = $1 WHERE o_id = $2 `, [new Date(), v.rows[0]["o_id"]]);
                    } else return DatabaseManager.cli.query(`INSERT INTO character_name (id, name) VALUES ($1, $2)`, [user.charId as unknown as string, user.charName]);
                }).catch(e => Logger.getLogger("CharTracker").error(e))
        ]);

        if (user.fctId !== 0) {//return;// sleep(1000*randomNumber(10, 31)).then(() => { linkCharCheck() }); // Too expensive for factionless bitches
            const obj2 = {
                id: user.fctId,
                name: user.fctName,
            };

            const f = await DatabaseManager.insert("faction", obj2, true)
                .catch(e => {return {error: e}});
            
            if (f?.error) {
                Logger.getLogger("Faction").error(f.error);
            }
        }
    }

    if (user.name.startsWith("NPC") && !this.user._inBattle) return; // uh oh npc impostors?

    if (this.user._myCharId === user.charId) return;

    let stat = Entity.construct(user).toJSON()//.construct(user).toJSON();

    DatabaseManager.upsert("entity_stat", stat, ["id, type"])
        // .then(() => this.smartFox.emit("battle_stat", true))
        .catch(e => { Logger.getLogger("Database").error(e); });// epicduel.client.smartFox.emit("battle_stat", false); });

    if (user.name.startsWith("NPC")) { // For now, only NPCs gets to be added.
        DatabaseManager.upsert("entity_style", {
                id: user.npcId,
                charName: user.charName,
                charPri: user.charPri,
                charSec: user.charSec,
                charHair: user.charHair,
                charHairS: user.charHairS,
                charAccnt: user.charAccnt,
                charAccnt2: user.charAccnt2,
                charSkin: user.charSkin,
                charEye: user.charEye,
                charGender: user.charGender,
                npcScale: user.npcScale,
                npcHead: user.npcHead,
                last_fetched: new Date(),
                type: user.npcBoss ? 2 : 1
            }, ["id, type"])
            // .then(() => epicduel.client.smartFox.emit("battle_style", true))
            .catch(e => { Logger.getLogger("Database").error(e); });// epicduel.client.smartFox.emit("battle_style", false); });
    }

    // for now i dont want to get the user's skills
    if (false)//user.userId !== undefined || user.charId !== undefined)
    this.getUserSkills(user.id, true).then(v => {
        // if (global.susshe) console.log(v);
        // if (v == undefined || v.error) return; // timeout
        if (v.length === 0) return;

        const obj2 = {
            id: user.charId || user.npcId,
            type: user.charId === undefined ? (user.npcBoss ? 2 : 1) : 0,
            skills: v.map(s => s.id + "|" + s.lvl).join("#"),
            last_fetched: new Date()
        };

        // if (obj2.id < 0) return client.nice = user; // idk

        return DatabaseManager.upsert("entity_skill", obj2, ["id, type"])
            .catch(e => { return { error: e }});
    // }).then((v) => {
    //     if (v == undefined) return;

    //     // epicduel.client.smartFox.emit("battle_skill", true);

    //     // if (v.error) console.log(v.error);
    // }).catch(er => {
    //     // (er.message !== "Timeout") ? logger.error(er) : null;
    //     // epicduel.client.smartFox.emit("battle_skill", false);
    });

    if (user.userId !== undefined || user.charId !== undefined)
    this.getUserRecord(user.id, true).then(v => {
        // if (global.susshi) console.log(v);
        // if (!v.fresh) return false;
        // if (user.charId === undefined || user.userId === undefined) return false;
        if (!v.success) return false;

        /*
        `w1` int,
        `w2` int,
        `wj` int,
        `l1` int,
        `l2` int,
        `lj` int,
        yep, win and loss in the database, i just cba to modify it into battle after i realised.
        */
        
        const obj2 = {
            char_id: user.charId,
            l1: v.value.l1,
            l2: v.value.l2,
            lj: v.value.lj,
            npc: v.value.npc,
            w1: v.value.w1,
            w2: v.value.w2,
            wj: v.value.wj,
            // w1: v.w1,
            // w2: v.w2,
            // wj: v.wj,
            // l1: v.b1 - v.w1,
            // l2: v.b2 - v.w2,
            // lj: v.bj - v.wj,
            // npc: v.wn,
            last_fetched: v.value.last_fetched
        } satisfies IUserRecord;

        DatabaseManager.upsert("user_record", obj2, ["char_id"])
            .catch(e => {return Logger.getLogger("Database").error(e) });
    });

    // return (user.charId) ? sleep(1000*randomNumber(10, 31)).then(() => { linkCharCheck() }) : null;
})