import { ChannelTypes, Embed } from "oceanic.js";
import { AnyItemRecordsExceptSelf } from "../../game/box/ItemBox.js";
import EDEvent from "../../util/events/EDEvent.js";
import Logger from "../../manager/logger.js";
import { SkillTypes } from "../../game/box/SkillsBox.js";
import { map } from "../../util/Misc.js";
import Config from "../../config/index.js";
import SwarmResources from "../../util/game/SwarmResources.js";

export default new EDEvent("onComparisonUpdate", async function (hydra, { part, type }) {
    if (Config.isDevelopment === true) return;

    if (type === 0) SwarmResources.comparison.fileRetrieved = true;//.checkpoints.comparison[0] = 1;
    if (type === 1) {
        /*

        1 = Item
        2 = Skills.All
        3 = Skills.Tree
        4 = Skills.Active
        5 = Skills.ActiveAttackRules
        6 = Skills.ActiveMiscRules
        7 = Skills.ActiveTargetRules
        8 = Skills.Passive
        9 = Skills.PassiveMiscRules
        10 = Skills.PassiveStatRules
        11 = Skills.ImproveRules
        12 = Skills.ClientRequirements
        13 = Skills.Core

        */
        this.checkpoints.comparison[part-1] = 1;
    }

    // if (false) return; // for now

    if (!SwarmResources.comparison.fileRetrieved || this.checkpoints.comparison.includes(0)) return;

    if (SwarmResources.comparison.gameVersion === this.currVersion) return;

    SwarmResources.comparison = {
        doneById: this.settings.id,
        gameVersion: this.currVersion,
        time: Date.now(),
        fileRetrieved: true,
    };

    /**
     * @param {import("../../server/structures/record/item/SelfRecord")} a new
     * @param {import("../../server/structures/record/item/SelfRecord")} b old
     * @returns 
     */
    let compareDiff = (a:Record<any, any> ={}, b:Record<any, any> ={}) => {
        let changed:Record<string, [any, any]> & { u: boolean } = { u: false } as unknown as any;

        for (let key in a) {
            if (a[key] !== b[key]) {
                if (isNaN(a[key]) && null === b[key]) continue; // bandaid fix
                if (b[key] === "" && a[key] === null) continue; // second bandaid fix
                if (a[key] === "" && b[key] === null) continue; // third bandaid fix

                // assume ed will never add new properties to existing items.
                changed[key] = [b[key], a[key]];
                changed.u = true;
            }
        }

        return changed;
    }

    /**
     * @param {import("../../server/structures/record/item/SelfRecord")[]} oldObj 
     * @param {import("../../server/structures/record/item/SelfRecord")[]} newObj 
     * @param {"itemId"} identifier The key to compare the value
     * @returns {[-1, "NO_DIFFERENCE"]|[1, {"+": any[], "-": any[], "~": [string, Object][]}]}
     */
    let compare = (oldObj:Array<AnyItemRecordsExceptSelf>, newObj:Array<AnyItemRecordsExceptSelf>, identifier: "itemId") : [-1, "NO_DIFFERENCE"]|[1, {"+": any[], "-": any[], "~": [number, AnyItemRecordsExceptSelf][]}] => {//(compType="item") => {
        /**
         * @type {{changed: [number, import("../../server/structures/record/item/SelfRecord")][], removed: [number, import("../../server/structures/record/item/SelfRecord")][], added: [number, import("../../server/structures/record/item/SelfRecord")][]}}
         */
        let ids = {//:Record<"changed"|"removed"|"added", [number, AnyItemRecordsExceptSelf][]> = {
            changed: [] as [any, any][],
            removed: [] as [any, number][],
            added: [] as [number, AnyItemRecordsExceptSelf][],//oldObj.map(v => [v[identifier], v]), added: []
        };

        // Auto fills ids.removed
        for (let x = 0; x < oldObj.length; x++) {
            ids.removed[x] = [oldObj[x][identifier], x];
        }

        // We will loop through all of the items on the fresh list.
        // Old list is sadly stored as array, so no point I feel in having newobj being hash/map
        for (let i = 0; i < newObj.length; i++) {
            const obj = newObj[i];
            
            let done = false;

            // We will find the old object from here
            for (let y = 0; y < oldObj.length; y++) {
                const oldOb = oldObj[y];

                if (oldOb[identifier] !== obj[identifier]) continue;
                ids.removed.splice(ids.removed.findIndex(g => g[0] === obj[identifier]));

                // Done indicates the old item does exist, so not new.
                done = true;

                let changed = compareDiff(obj, oldOb);

                if (changed.u === false) continue; // Nothing has changed
                //@ts-expect-error shut up about optional
                delete changed.u;
                ids.changed.push([obj[identifier], changed]);
            }

            if (done === false) {
                ids.added.push([obj[identifier], obj]);
                continue;
            }
        }

        return (ids.added.length || ids.removed.length || ids.changed.length) ? [1, {
            "+": ids.added, "-": ids.removed, "~": ids.changed
        }] : [-1, "NO_DIFFERENCE"];
    }

    //@ts-expect-error
    const zamn = SwarmResources.zamn = {
        item: compare(SwarmResources.comparisonFiles.item, this.boxes.item.objMap.toArray(), "itemId"),
        skills: {
            /*all: compare(client.comparisonFiles.skills.all, epicduel.client.boxes.skills.objMap.all.toArray(), "skillId"),
            // I notice that tree may have more than one identifier, will add support for that soon.
            tree: compare(client.comparisonFiles.skills.tree, epicduel.client.boxes.skills.objMap.tree.toArray(), "skillId"),
            active: compare(client.comparisonFiles.skills.active, epicduel.client.boxes.skills.objMap.active.toArray(), "skillId"),
            activeAttackRules: compare(client.comparisonFiles.skills.activeAttackRules, epicduel.client.boxes.skills.objMap.activeAttackRules.toArray(), "attackRulesId"),
            activeMiscRules: compare(client.comparisonFiles.skills.activeMiscRules, epicduel.client.boxes.skills.objMap.activeMiscRules.toArray(), "miscRulesId"),
            activeTargetRules: compare(client.comparisonFiles.skills.activeTargetRules, epicduel.client.boxes.skills.objMap.activeTargetRules.toArray(), "targetRulesId"),
            passive: compare(client.comparisonFiles.skills.passive, epicduel.client.boxes.skills.objMap.passive.toArray(), "skillId"),
            passiveMiscRules: compare(client.comparisonFiles.skills.passiveMiscRules, epicduel.client.boxes.skills.objMap.passiveMiscRules.toArray(), "miscRulesId"),
            //passiveStatRules: compare(client.comparisonFiles.skills.passiveStatRules, epicduel.client.boxes.skills.objMap.passiveStatRules.toArray(), "statRulesId"),
            improveRules: compare(client.comparisonFiles.skills.improveRules, epicduel.client.boxes.skills.objMap.improveRules.toArray(), "skillId"),
            clientRequirements: compare(client.comparisonFiles.skills.clientRequirements, epicduel.client.boxes.skills.objMap.clientRequirements.toArray(), "skillId"),*/
        }
    }

    // Post processing, now we just send it to a log or whatever.

    let hasUpdated = false;

    // TODO: optimise this code.
    // cri
    if (zamn.item[0] === 1) {
        hasUpdated = true;

        let adds = []; let removes = []; let changes = [];

        for (let x = 0; x < zamn.item[1]["+"]?.length; x++) {
            adds.push(zamn.item[1]["+"][x]);
        }

        for (let x = 0; x < zamn.item[1]["-"]?.length; x++) {
            removes.push(zamn.item[1]["-"][x]);
        }

        for (let x = 0; x < zamn.item[1]["~"]?.length; x++) {
            changes.push(zamn.item[1]["~"][x]);
        }

        //@ts-expect-error
        SwarmResources.shazamn = {
            adds, removes, changes
        };

        /**
         * @param {"~"|"+"|"-"} type
         * @param {[itemID: number, import("../../server/structures/record/item/SelfRecord")]} item
         */
        let embed = (type: "~"|"+"|"-", item: [number, AnyItemRecordsExceptSelf]) => {
            let obj = (type === "~") ? SwarmResources.comparisonFiles.item.find(v => v.itemId === item[0]) : item[1];
            let jsonStringified = JSON.stringify(obj, undefined, 2);

            if (type === "~") {
                let jsonSplit = jsonStringified.split("\n");
                const keys = Object.keys(item[1]);

                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];

                    let index = jsonSplit.findIndex(v => v.includes(key));
                    let ecs = "- " + jsonSplit[index].slice(2);

                    // If the new value no longer exists
                    //if (skill[1][key[0]] != undefined) {
                    let cs = jsonSplit[index].slice(2).split(":");

                    //@ts-expect-error i cba
                    jsonSplit[index] = "+ " + cs[0] + `: ${JSON.stringify(item[1][key][1])}` + ((cs[1].endsWith(",")) ? ',' : '');//.replace(skill[1][key][0], skill[1][key[0]]);//jsonSplit(jsonSplit[index].indexOf(skill[1][key][0]))
                    jsonSplit = [...jsonSplit.slice(0, index + 1), ecs, ...jsonSplit.slice(index + 1)];
                    //} else {
                    //    jsonSplit[index] = ecs;
                    //}
                }

                jsonStringified = jsonSplit.join("\n");
            }

            return {
                title: (type === "+" ? "New Item" : type === "~" ? "Changed Item" : "Removed Item") + " (ID: " + item[0] + ")",
                description: (type !== "~") ? "```json\n" + jsonStringified + "\n```" : 
                "```diff\n" + jsonStringified + "\n```",
                color: (type === "+") ? 0x34FF30 : (type === "-") ? 0xFF2D30 : 0xFFD430
            }
        }

        let count = (o: { title: string, description: string, color: number }[] =[]) => { return o.reduce((a, b) => a + b.title.length + b.description.length + b.color.toString().length, 0); };

        const threads = {
            a: "",
            c: "",
            r: ""
        }

        let threadies = [];
        const firsts = {
            a: undefined as string | undefined,
            c: undefined as string | undefined,
            r: undefined as string | undefined
        }

        if (adds.length || changes.length || removes.length) {
            await hydra.rest.guilds.getActiveThreads("565155762335383581")
                .then((v) => {
                    if (v.threads.length) {
                        for (let i = 0; i < v.threads.length; i++) {
                            const thread = v.threads[i];

                            // "item log" forum channel
                            if (thread.parentID !== "1159896720717656205" || thread.type !== ChannelTypes.PUBLIC_THREAD) continue;

                            if (thread.name.includes(SwarmResources.version.game)) {
                                if (thread.appliedTags.includes("1159899392287981578")) threads.a = thread.id; // "Added" tag
                                if (thread.appliedTags.includes("1159899426542854255")) threads.c = thread.id; // "Changed" tag
                                if (thread.appliedTags.includes("1159899451779977316")) threads.r = thread.id; // "Removed" tag
                            }
                        }
                    }
                });
            
            if (threads.a !== "") threadies.push(hydra.rest.channels.getMessages(threads.a, { after: threads.a.slice(0, -2) + "0", limit: 1 }));
            if (threads.c !== "") threadies.push(hydra.rest.channels.getMessages(threads.c, { after: threads.c.slice(0, -2) + "0", limit: 1 }));
            if (threads.r !== "") threadies.push(hydra.rest.channels.getMessages(threads.r, { after: threads.r.slice(0, -2) + "0", limit: 1 }));

            if (adds.length    && threads.a === "") threads.a = await hydra.rest.channels.startThreadInThreadOnlyChannel("1159896720717656205", { message: { content: adds.length    + " item(s) were added, as of v" + SwarmResources.version.game },  name: "New Items - v" +      SwarmResources.version.game }).then(v => v.edit({appliedTags: ["1159899392287981578"]})).then(v => v.id);
            if (changes.length && threads.c === "") threads.c = await hydra.rest.channels.startThreadInThreadOnlyChannel("1159896720717656205", { message: { content: changes.length + " item(s) were changed, as of v" + SwarmResources.version.game }, name: "Changed Items - v" + SwarmResources.version.game }).then(v => v.edit({appliedTags: ["1159899426542854255"]})).then(v => v.id);
            if (removes.length && threads.r === "") threads.r = await hydra.rest.channels.startThreadInThreadOnlyChannel("1159896720717656205", { message: { content: removes.length + " item(s) were removed, as of v" + SwarmResources.version.game }, name: "Removed Items - v" + SwarmResources.version.game }).then(v => v.edit({appliedTags: ["1159899451779977316"]})).then(v => v.id);
        }

        for (let i = 0; i < adds.length; i++) {
            let embeds = [embed("+", adds[i])];

            while (++i < adds.length && embeds.length < 10 && ((count(embeds) + count([embed("+", adds[i])])) < 6000)) {
                embeds.push(embed("+", adds[i]));

                if (i >= (adds.length - 1)) break;
            }; if (i < (adds.length - 1)) i--;

            await hydra.rest.channels.createMessage(threads.a, {
                embeds: embeds
            }).then(m => { if (firsts.a === undefined) firsts.a = m.jumpLink; }).catch((err) => { Logger.getLogger("Comparison").error(err); });
        }

        for (let i = 0; i < removes.length; i++) {
            let embeds = [embed("-", removes[i])];

            while (++i < removes.length && embeds.length < 10 && ((count(embeds) + count([embed("-", removes[i])])) < 6000)) {
                embeds.push(embed("-", removes[i]));

                if (i >= (removes.length - 1)) break;
            }; if (i < (removes.length - 1)) i--;

            await hydra.rest.channels.createMessage(threads.r, {
                embeds: embeds
            }).then(m => { if (firsts.r === undefined) firsts.r = m.jumpLink; }).catch((err) => { Logger.getLogger("Comparison").error(err); });
        }

        for (let i = 0; i < changes.length; i++) {
            let embeds = [embed("~", changes[i])];

            while (++i < changes.length && embeds.length < 10 && ((count(embeds) + count([embed("~", changes[i])])) < 6000)) {
                embeds.push(embed("~", changes[i]));

                if (i >= (changes.length - 1)) break;
            }; if (i < (changes.length - 1)) i--;

            await hydra.rest.channels.createMessage(threads.c, {
                embeds: embeds
            }).then(m => { if (firsts.c === undefined) firsts.c = m.jumpLink; }).catch((err) => { Logger.getLogger("Comparison").error(err); });
        }

        await Promise.all(threadies).then(msgs => {
            for (let x = 0; x < msgs.length; x++) {
                const msg = msgs[x][0];
                
                if (msg.content.toLowerCase().includes("added")) msg.edit({ content: msg.content + `\n\n${adds.length} more item(s) were detected, still part of the same server version.\nJump to the [message](${firsts.a}).` });
                if (msg.content.toLowerCase().includes("changed")) msg.edit({ content: msg.content + `\n\n${changes.length} more item(s) were detected, still part of the same server version.\nJump to the [message](${firsts.c}).` });
                if (msg.content.toLowerCase().includes("removed")) msg.edit({ content: msg.content + `\n\n${removes.length} more item(s) were detected, still part of the same server version.\nJump to the [message](${firsts.r}).` });
            }
        })

        /*
        for (let i = 0; i < zamn.item[1]["+"].length; i++) {
            let item = zamn.item[1]["+"][i];
            let obj = JSON.parse(JSON.stringify(item));

            obj.itemCat += " (" + epicduel.client.boxes.item.constVariables.ITEM_CATEGORY_MAPPED_BY_ID[obj.itemCat] + ")";

            await client.createMessage("1040340954390990868", {
                embeds: [{
                    title: "New Item (" + item['itemId'] + ")",
                    description: "```json\n" + JSON.stringify(obj, 0, 2) + "\n```",
                    color: 0x34FF30
                }],
                components:  [{
                    type: 1, components: [{
                        type: 2, label: "SWF (Stage)", style: 5, url: "https://epicduelstage.artix.com/" + getDirectoryByPool(reversePool[item.itemCat]) + item.itemLinkage + '.swf'
                    }, {
                        type: 2, label: "SWF (Dev)", style: 5, url: "https://epicdueldev.artix.com/" + getDirectoryByPool(reversePool[item.itemCat]) + item.itemLinkage + '.swf'
                    }, {
                        type: 2, label: "[DEV] A", custom_id: "DEV_BTN_01", style: 1
                    }, {
                        type: 2, label: "[DEV] B", custom_id: "DEV_BTN_02", style: 1
                    }]
                }]
            });
        }

        for (let i = 0; i < zamn.item[1]["-"].length; i++) {
            let item = zamn.item[1]["-"][i];
            let obj = JSON.parse(JSON.stringify(item));

            obj.itemCat += " (" + epicduel.client.boxes.item.constVariables.ITEM_CATEGORY_MAPPED_BY_ID[obj.itemCat] + ")";

            await client.createMessage("1040340954390990868", {
                embeds: [{
                    title: "Missing Item (" + item['itemId'] + ")",
                    description: "```json\n" + JSON.stringify(obj, 0, 2) + "\n```",
                    color: 0xff2D30
                }],
                components: [{
                    type: 1, components: [{
                        type: 2, label: "SWF (Stage)", style: 5, url: "https://epicduelstage.artix.com/" + getDirectoryByPool(reversePool[item.itemCat]) + item.itemLinkage + '.swf'
                    }, {
                        type: 2, label: "SWF (Dev)", style: 5, url: "https://epicdueldev.artix.com/" + getDirectoryByPool(reversePool[item.itemCat]) + item.itemLinkage + '.swf'
                    }, {
                        type: 2, label: "[DEV] A", custom_id: "DEV_BTN_01", style: 1
                    }, {
                        type: 2, label: "[DEV] B", custom_id: "DEV_BTN_02", style: 1
                    }]
                }]
            });
        }*/
    }

    // if (false && Object.keys(zamn.skills).some(v => zamn.skills[v][0] === 1)) {
    //     //hasUpdated = true;

    //     let adds = []; let removes = []; let changes = [];

    //     for (let x = 0; x < Object.keys(zamn.skills).length; x++) {
    //         let key = Object.keys(zamn.skills)[x];
    //         if (key === "passiveStatRules") continue; // This one is a big gigantic mess, idk how or why is this...
    //         if (zamn.skills[key][0] !== 1) continue;

    //         hasUpdated = true;

    //         for (let y = 0; y < Object.keys(zamn.skills[key][1]).length; y++) {
    //             let key2 = Object.keys(zamn.skills[key][1])[y];

    //             for (let z = 0; z < zamn.skills[key][1][key2].length; z++) {
    //                 let skill = zamn.skills[key][1][key2][z];

    //                     skill["type"] = key;
                        
    //                     (key2 === "+") ? adds.push(skill) : 
    //                     (key2 === "-") ? removes.push(skill) :
    //                     changes.push(skill);
    //             }
    //         }
    //     }

    //     /**
    //      * @param {"+"|"-"|"~"} type 
    //      * @param {string} typeOfObj
         
    //     let title = (type, typeOfObj, id) => {
    //         if (typeOfObj === "all") return (type === "+") ? `New Skill - All (${id})` : (type === "-") ? `Missing Skill - All (${id})` : `Changed Skill - All (${id})`;
    //         if (typeOfObj === "tree") return (type === "+") ? `New Skill - Tree (${id})` : (type === "-") ? `Missing Skill - Tree (${id})` : `Changed Skill - Tree (${id})`;
    //         if (typeOfObj === "active") return (type === "+") ? `New Skill - Active (${id})` : (type === "-") ? `Missing Skill - Active (${id})` : `Changed Skill - Active (${id})`;
    //         if (typeOfObj === "activeAttackRules") return (type === "+") ? `New Skill - Active Attack Rules (${id})` : (type === "-") ? `Missing Skill - Active Attack Rules (${id})` : `Changed Skill - Active Attack Rules (${id})`;
    //         if (typeOfObj === "activeMiscRules") return (type === "+") ? `New Skill - Active Misc Rules (${id})` : (type === "-") ? `Missing Skill - Active Misc Rules (${id})` : `Changed Skill - Active Misc Rules (${id})`;
    //         if (typeOfObj === "activeTargetRules") return (type === "+") ? `New Skill - Active Target Rules (${id})` : (type === "-") ? `Missing Skill - Active Target Rules (${id})` : `Changed Skill - Active Target Rules (${id})`;
    //         if (typeOfObj === "passive") return (type === "+") ? `New Skill - Passive (${id})` : (type === "-") ? `Missing Skill - Passive (${id})` : `Changed Skill - Passive (${id})`;
    //         if (typeOfObj === "passiveMiscRules") return (type === "+") ? `New Skill - Passive Misc Rules (${id})` : (type === "-") ? `Missing Skill - Passive Misc Rules (${id})` : `Changed Skill - Passive Misc Rules (${id})`;
    //         if (typeOfObj === "improveRules") return (type === "+") ? `New Skill - Improve Rules (${id})` : (type === "-") ? `Missing Skill - Improve Rules (${id})` : `Changed Skill - Improve Rules (${id})`;
    //         if (typeOfObj === "clientRequirements") return (type === "+") ? `New Skill - Client Requirements (${id})` : (type === "-") ? `Missing Skill - Client Requirements (${id})` : `Changed Skill - Client Requirements (${id})`;
            
    //         return (type === "+") ? `New Skill - Unknown (${id})` : (type === "-") ? `Missing Skill - Unknown (${id})` : `Changed Skill - Unknown (${id})`;
    //     }

    //     let embed = (type, skill) => {
    //         let obj = (type === "~") ? client.comparisonFiles.skills[skill["type"]].find(v => v[zamn.skills[skill["type"]]['_id']] === skill[0]) : skill[1];
    //         let jsonStringified = JSON.stringify(obj, 0, 2);

    //         if (type === "~") {
    //             let jsonSplit = jsonStringified.split("\n");

    //             for (let i = 0; i < Object.keys(skill[1]).length; i++) {
    //                 let key = Object.keys(skill[1])[i];

    //                 let index = jsonSplit.findIndex(v => v.includes(key));
    //                 let ecs = "- " + jsonSplit[index].slice(2);

    //                 // If the new value no longer exists
    //                 //if (skill[1][key[0]] != undefined) {
    //                     let cs = jsonSplit[index].slice(2).split(":");

    //                     jsonSplit[index] = "+ " + cs[0] + `: "${skill[1][key][1]}"` + ((cs[1].endsWith(",")) ? ',' : '');//.replace(skill[1][key][0], skill[1][key[0]]);//jsonSplit(jsonSplit[index].indexOf(skill[1][key][0]))
    //                     jsonSplit = [...jsonSplit.slice(0, index + 1), ecs, ...jsonSplit.slice(index + 1)];
    //                 //} else {
    //                 //    jsonSplit[index] = ecs;
    //                 //}
    //             }

    //             jsonStringified = jsonSplit.join("\n");
    //         }

    //         return {
    //             title: title(type, skill["type"], skill[0]),
    //             description: (type !== "~") ? "```json\n" + jsonStringified + "\n```" : 
    //             "```diff\n" + jsonStringified + "\n```",
    //             color: (type === "+") ? 0x34FF30 : (type === "-") ? 0xFF2D30 : 0xFFD430
    //         }
    //     }

    //     let count = (o=[]) => { return o.reduce((a, b) => a + b.title.length + b.description.length + b.color.toString().length, 0); }

    //     for (let i = 0; i < adds.length; i++) {
    //         let embeds = [embed("+", adds[i])];

    //         while (++i < adds.length && embeds.length < 10 && ((count(embeds) + count([embed("+", adds[i])])) < 6000)) {
    //             embeds.push(embed("+", adds[i++]));

    //             if (i >= adds.length) break;
    //         }; i--;

    //         await client.rest.channels.createMessage("1041799047675134023", {
    //             embeds: embeds
    //         }).catch((err) => { Logger.getLogger("Comparison").error(err); });
    //     }

    //     for (let i = 0; i < removes.length; i++) {
    //         let embeds = [embed("-", removes[i])];

    //         while (++i < removes.length && embeds.length < 10 && ((count(embeds) + count([embed("-", removes[i])])) < 6000)) {
    //             embeds.push(embed("-", removes[i++]));

    //             if (i >= removes.length) break;
    //         }; i--;

    //         await client.rest.channels.createMessage("1041799047675134023", {
    //             embeds: embeds
    //         }).catch((err) => { Logger.getLogger("Comparison").error(err); });
    //     }

    //     for (let i = 0; i < changes.length; i++) {
    //         let embeds = [embed("~", changes[i])];

    //         while (++i < changes.length && embeds.length < 10 && ((count(embeds) + count([embed("~", changes[i])])) < 6000)) {
    //             embeds.push(embed("~", changes[i]));

    //             if (i >= (changes.length - 1)) break;
    //         };

    //         await client.rest.channels.createMessage("1041799047675134023", {
    //             embeds: embeds
    //         }).catch((err) => { Logger.getLogger("Comparison").error(err); });
    //     }
    // }*/

    if (hasUpdated) {
        const obj = {} as Record<SkillTypes, any[]>;
        const keys = Object.keys(this.boxes.skills.objMap).concat(Object.keys(this.boxes.skills.objList)) as unknown as SkillTypes[];

        const abc = map(keys, v => v === "tree" ? this.boxes.skills.objList[v] : this.boxes.skills.objMap[v].toArray());

        for (let i = 0, len = keys.length; i < len; i++) {
            obj[keys[i]] = abc[i];
        }

        SwarmResources.comparisonFiles = {
            // TODO: skilllllllllllls objlist cri
            skills: obj,
            item: this.boxes.item.objMap.toArray()
        };

        hydra.rest.channels.createMessage("1034498187911774278", {
            files: [{
                contents: Buffer.from(JSON.stringify(SwarmResources.comparisonFiles)),
                name: "jason.json"
            }]
        }).catch((err) => Logger.getLogger("Comparison").error(err));
    }

    return;

    // if (diffed == undefined) {
    //     // no changes;
    //     return;
    //     // Move on as we don't want it to send a new file with the stuff etc.
    // }

    // if (!client.debug) {
    //     await client.createMessage("1034498187911774278", {}, [{
    //         file: JSON.stringify({skills: epicduel.client.boxes.skills.objList, item: epicduel.client.boxes.item.objList}, undefined, 2), name: "jason.json"
    //     }]).catch((err) => { Logger.getLogger("Comparison").error(err); });
    // }

    // if (diffed.length) {
    //     let filtered = diffed.filter(v => v[0][0] !== " ");

    //     for (let i = 0; i < filtered.length; i++) {
    //         // Is a change
    //         if (filtered[i][0] === '~') {
                
    //         }
    //     }

    // }
    // if (!epicduel.compareFiles) return;
});