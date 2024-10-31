import DatabaseManager from "../../manager/database.js";
import EDEvent from "../../util/events/EDEvent.js";
import Logger from "../../manager/logger.js";
import { IRally } from "../../Models/Rally.js";
import { INotification } from "../../Models/Notification.js";
import { IWar } from "../../Models/War.js";
import Config from "../../config/index.js";
import { filter } from "../../util/Misc.js";

let lastTimeSince = {
    rally: 0,
    end: 0,
    start: 0,
    bomb: 0,
}
let lastBomber = {
    name: "",
    inf: 0
}
let lastRally = {
    status: ""
}
let lastWar = {
    id: -1,
    regionId: -1,
    points: 0,
}
// let lastUsed
// let lastType:number = 0;

function checkTime(type: "bomb", date: Date, name: string, inf: number) : boolean
function checkTime(type: "end"|"start", date: Date) : boolean
function checkTime(type: "rally", date: Date, status: "end"|"start"|"ongoing") : boolean
function checkTime(type: "rally"|"end"|"start"|"bomb", date: Date, name?: string | number, inf?: number) {
    const time = date.getTime();

    const gap = type === "bomb" ? 2 : (typeof name === "number" ? name : 50);

    if (
        (type === "bomb" && (lastTimeSince[type] + gap) > time && lastBomber.name === name && lastBomber.inf === inf)
     || (type === "rally" && (lastTimeSince[type] + gap) > time && lastRally.status === name)
     || (type !== "bomb" && (lastTimeSince[type] + gap) > time)
    ) return false;
    else {
        if (type === "bomb" && typeof name === "string" && inf) {
            lastBomber.name = name;
            lastBomber.inf = inf;
        }
        lastTimeSince[type] = time;
        return true;
    }
}

export default new EDEvent("onWarStatusChange", async function (hydra, obj) {
    const time = new Date();

    let activeWar;

    switch (obj.type) {
        case "rally":
            if (!checkTime(obj.type, time, obj.status)) return;
            console.log("rally - " + obj.status);

            let isNew = false;

            if ((this.modules.WarManager.cooldownHours) > 0) return; // War is on cooldown.

            if (obj.status === "ongoing" || obj.status === "start") {
                let timeSinceLastRally = await DatabaseManager.cli.query<IRally>(`SELECT * FROM rallies ORDER BY triggered_at desc LIMIT 1`)
                    .then(v => v.rows)
                    // .catch(error => ({ error }));

                // If it's still within the 60 minutes since the last rally set by the bot, plus 
                if (timeSinceLastRally.length && (timeSinceLastRally[0]['triggered_at'].getTime() + 1000*60*60) > Date.now()) return;

                // NOPE NEW RALLY!
                isNew = true;
            } else if (obj.status === "end") {
                return hydra.rest.channels.createMessage("876417348930797598", {content: "Rally has ended."});
            } else {
                return hydra.rest.channels.createMessage("988216659665903647", {content: "Unknown type:\n\n```json\n" + JSON.stringify(obj, undefined, 2) + "```"});
            }

            if (!isNew) return;

            let notifications = await DatabaseManager.cli.query<INotification>("SELECT id, guild_id, channel_id, message, creator_id FROM notification WHERE type = $1", [obj.alignment]).then(v => v.rows);

            if (Config.isDevelopment) notifications = filter(notifications, s => s.channel_id === "988216659665903647");/* = await DatabaseManager.cli.query<INotification>("SELECT id, guild_id, channel_id, message, creator_id FROM notification WHERE type = $1", [obj.alignment])
                .then(v => v.rows)*/
            //     .catch((err) => { return {error: err} });

            // if (notifications.error) {
            //     logger.error(notifications.error); return;
            // }

            let failed:INotification[] = [];
            let deletes:INotification[] = [];
            //let creators = {};
            
            let currObjs = this.modules.WarManager.currentObjectives();
            let points = this.modules.WarManager.warPoints(true);

            activeWar = await this.swarm.getActiveWar(true);

            DatabaseManager.insert("rallies", { alignment: obj.alignment, triggered_at: time, war_id: activeWar.type === 1 ? activeWar.result.id : activeWar.type === 0 ? activeWar.prev.id + 1 : -2 })
                .catch((err) => Logger.getLogger("War").error(err));

            console.log(points);

            const gapInf = String(Math.abs(parseInt(points.remaining[0]) - parseInt(points.remaining[1])));

            // yes i'm awaiting them one by one, for the sake of ratelimits at least. Plus the bot isn't large scale so will be fine for now as it'll loop through like 10 channels at max.
            for (let i = 0; i < notifications.length; i++) {
                let message = notifications[i].message;

                if (!message) continue;

                if (message.includes("%")) {
                    message = message
                        .replace(/\\n/g, "\n")
                        .replace(/%currPtE%/g, points.current[1])
                        .replace(/%currPtL%/g, points.current[0])
                        .replace(/%maxPtE%/g, points.max[1])
                        .replace(/%maxPtL%/g, points.max[0])
                        .replace(/%remainPtE%/g, points.remaining[1])
                        .replace(/%remainPtL%/g, points.remaining[0])
                        .replace(/%currentPcE%/g, points.currentPercent[1])
                        .replace(/%currentPcL%/g, points.currentPercent[0])
                        .replace(/%gapAlign%/g, (points.remaining[0] >= points.remaining[1]) ? "Exile" : "Legion")
                        .replace(/%gapPt%/g, points.gapPt)//Math.abs(points.remaining[0] - points.remaining[1]))
                        .replace(/%gapInf%/g, gapInf)
                        .replace(/%warRegion%/g, this.modules.WarManager.activeRegion?.warTitle.slice(0, -4) ?? "unknown region");
                }

                await hydra.rest.channels.createMessage(notifications[i].channel_id, {
                    content: message
                }).catch((err) => {
                    if (err) {
                        Logger.getLogger("Notification").error(err);
                        // 10003 is unknown channel, meaning it no longer exists.
                        if (err.code === 10003) {
                            deletes.push(notifications[i]);
                        // 50001 is missing access, meaning bot can't send there anymore
                        } else if (err.code === 50001) {
                            deletes.push(notifications[i]);
                            return hydra.rest.channels.createDM(notifications[i].creator_id)
                                .then((chnl) => chnl.createMessage({ content: `WARNING!\n\nThe bot can't send rally notifications to the channel <#${notifications[i].channel_id}> due to **missing permissions**.\nPlease fix this, or delete the notification (the notification ID is ${notifications[i].id}) via /notification rally delete in the server.` }))
                                .catch((err) => {
                                    console.log(err);
                                    deletes.push(notifications[i]);
                                })
                        } else console.log(err);
                    }
                })
            }

            if (deletes.length) {
                DatabaseManager.cli.query(`DELETE FROM notification WHERE id IN (${deletes.map((v, i) => "$" + (i + 1))})`, deletes.map(v => v.id))
                    .catch((err) => Logger.getLogger("Notification").error(err));
            }
            break;
        case "start":
            if (!checkTime(obj.type, time)) return;
            // if (this.modules.WarManager.activeRegionId < 1) return;

            if (lastWar.regionId === this.modules.WarManager.activeRegionId) return Logger.getLoggerP(this).debug(`Client sent a start event, but war is already ongoing`);

            lastWar.regionId = this.modules.WarManager.activeRegionId;

            setTimeout(() => {
                this.swarm.scaleFor("war");
            }, 60000);

            // DatabaseManager.insert("war", { created_at: time, ended_at: null, max_points: this.modules.WarManager.warPoints().max[0], region_id: this.modules.WarManager.activeRegionId } satisfies Omit<IWar, "id">);
            break;
        case "end":
            if (!checkTime(obj.type, time)) return;
            activeWar = await this.swarm.getActiveWar();

            {
                const endedDate = (activeWar.type === 1 ? activeWar.result.ended_at : activeWar.type === 0 ? activeWar.prev.ended_at : null);
                
                if (endedDate !== null) {
                    Logger.getLogger("War").debug("Received an end event, despite the recent war object already having ended.");
                    return;
                }
            }

            let ss = DatabaseManager.cli.query(`UPDATE war SET ended_at = $1 WHERE id = $2`, [time, activeWar.type === 1 ? activeWar.result.id : -1] as unknown as [string, string]) // why is pg lib being bitchy about this
                // .catch(e => {return {error: e}});

            // if (ss.error) {
            //     logger.error(ss.error);
            // }

            this.swarm.activeWar["done"] = true;
            this.swarm.getActiveWar(true);
            if (!Config.isDevelopment) this.swarm.scaleFor("vendbot");

            console.log("War has ended! Ended at " + time);
            break;
        case "char_used":
            if (!checkTime("bomb", time, obj.name, obj.influence)) return;

            const bombsToAlign = this.modules.WarManager.getAlignMappedByBombId();
            const bombsToType = this.modules.WarManager.getAlignMappedByBombId(true);

            if (this.swarm.resources.tracker.war.active) this.swarm.resources.tracker.war.list.push({
                name: obj.name,
                influence: obj.influence,
                usedItemId: obj.usedItemId,
                time: time.getTime(),
                //@ts-expect-error
                debug: {
                    align: bombsToAlign[obj.usedItemId],
                    type: bombsToType[obj.usedItemId],
                    source: this.settings.id
                }
            });
            // TODO: track similarly to gift tracker

            // if (obj.type !== "char_used") return;
            
            // const isExile = obj.usedItemId == epicduel.client.modules.WarManager.activeRegion.defenseItemId || obj.usedItemId == epicduel.client.modules.WarManager.activeRegion.defenseSuperItemId;

            // const points = epicduel.warPoints();

            // client.rest.channels.createMessage("1091045429367558154", {
            //     content: "**" + obj.name + "** dropped a bomb (**" + obj.influence + "** inf) against " + (isExile ? "Legion" : "Exile") + ". Exile: " + points.remaining[1] + ", Legion: " + points.remaining[0] + "."
            // })
            break;
    }
});