import { ButtonStyles, ComponentTypes, CreateMessageOptions, Embed, File, MessageActionRow } from "oceanic.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "../game/box/ItemBox.js";
import Swarm from "../manager/epicduel.js";
import DatabaseManager from "../manager/database.js";
import ClassBox from "../game/box/ClassBox.js";
import SkillsSMBox from "../game/box/SkillsBox.js";
import ImageManager from "../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../config/index.js";
import { filter, lazyTrimStringList, map } from "../util/Misc.js";
import SwarmResources from "../util/game/SwarmResources.js";
import EntitySkill from "./EntitySkill.js";

// WE LOVE MUTABILITY!
function coreItemIdToFull(itemId: number, cores: [number, number], type: 0 | 1) {
    if (itemId === 0) return "None pre-slotted.";
    
    const item = ItemSBox.objMap.get(itemId);

    if (!item || !item.isCoreItemRecord()) return "N/A";

    const core = SkillsSMBox.recordById("core", item.coreId);
    const skill = core ? SkillsSMBox.recordById("all", core.skillId) : undefined;

    if (!skill || !core) return "N/A";

    const skillName = SwarmResources.languages[skill.skillName] || skill.skillName;
    const skillDesc = SwarmResources.languages[skill.skillDesc] || skill.skillDesc;

    cores[type] = core.skillId;

    return `**${skillName}** (Item ID: ${itemId}, Skill ID: ${skill.skillId}, Core ID: ${core?.coreId})\n${skillDesc}`;//skill.skillId
}

function coreItemIdToSkillId(coreItemId: number) {
    if (coreItemId === 0) return 0;

    const item = ItemSBox.objMap.get(coreItemId);

    if (!item || !item.isCoreItemRecord()) return 0;

    const core = SkillsSMBox.recordById("core", item.coreId);

    return core?.skillId ?? 0;
}

async function modifyCoredItem(coreItemId: number, cores: [number, number], type: 0 | 1, embeds: Embed[], files: File[]) : Promise<void> {
    const skillId = coreItemIdToSkillId(coreItemId);

    if (skillId === 0) return;
    
    cores[type] = skillId;

    const obj = await EntitySkill.getSkillInfo(skillId);

    if (obj["content"]) {
        embeds.push({
            description: "Unable to fetch the " + (type === 0 ? "active" : "passive") + " core record."
        });

        return;
    };

    if (obj["embeds"]) embeds.push(obj["embeds"][0]);
    if (obj["files"]) files.push(...obj["files"]);
}


export class Item {
    static async resultify(item: AnyItemRecordsExceptSelf) {
        const embeds:Embed[] = [{
            fields: [{
                name: "Type", value: ItemSBox.ITEM_CATEGORY_MAPPED_BY_ID[item.itemCat] ?? "N/A", inline: true
            }, {
                name: "Rarity", value: ItemSBox.rareText(item.itemRareId, " "), inline: true
            }, {
                name: "Cost", value: item.itemCredits + "<:Credits:1095129742505689239>\n" + item.itemVarium + "<:Varium:1095129746402181282>", inline: true
            }, {
                name: "Source", value: ItemSBox.sourceText(item.itemSrcId, true)
            }],
            title: item.itemName + " (ID: " + item.itemId + ")"
        }];

        const components:MessageActionRow[] = [{
            type: ComponentTypes.ACTION_ROW,
            components: [{
                type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
                customID: "item_swf_links_" + item.itemId,
                label: "Get SWF Links (Ghost Respond)", disabled: false
            }]
        }];

        const files:File[] = [];

        if ("itemDesc" in item) {
            embeds[0].description = item.itemDesc;

            if (SwarmResources.languages[item.itemDesc]) embeds[0].description = SwarmResources.languages[item.itemDesc];
        }
        
        // const [finderRec] = ItemFinder.search(itemId, true);
        const merchants = await DatabaseManager.helper.getMerchantsByItemId(item.itemId);//finderRec.merchantIds.filter(v => v !== 0).map(v => MerchantSBox.objMap.get(v) as MerchantRecord);

        if (merchants.length) {
            let mercText = "";

            for (let i = 0, len = merchants.length; i < len; i++) {
                let itemText = "ERROR: can't find item from the merchant.";
                for (let j = 0, jen = merchants[i].items.length; j < jen; j++) {
                    let mItem = (merchants[i].items[j]);

                    if (mItem[0] === item.itemId) {
                        itemText = mItem[1] === -1 ? "unlimited." : mItem[1] + " left.";
                        continue;
                    }
                }
                // const itemText = merchants[i].items.find(v => v[0] === itemId);//?.[1] === -1 ? "unlimited." : merc.items.find(a => a[0] === itemId)[1] + " left.")

                itemText = `[${merchants[i].name}](https://epicduelwiki.miraheze.org/wiki/${encodeURIComponent(merchants[i].name)}) (ID: ${merchants[i].id}) - ${itemText}\n`;

                if ((itemText.length + mercText.length) > 1024) break;
                else mercText += itemText;
            }

            embeds[0].fields?.push({
                name: "Merchant (Source)",
                value: mercText.trim()
            });
        }

        let classical = (id: number) => id === 0 ? "N/A" : ClassBox.CLASS_NAME_BY_ID[id] as string;

        let cores = [-1, -1] as [number, number];

        switch (item.itemCat) {
            // Weapons
            case 3: case 4: case 5: case 6: case 7: case 8: case 20:
                embeds[0].fields?.push({
                    name: "Weapon",
                    value: `Class Specific: ${classical(item.itemClass)}\nDamage Type: ${item.itemDmgType === 1 ? "Physical" : "Energy"}`
                });

                modifyCoredItem(item.coreActiveItemId, cores, 0, embeds, files);
                modifyCoredItem(item.corePassiveItemId, cores, 1, embeds, files);

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
            break;
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
                embeds[0].fields?.push({
                    name: "Armor",
                    value: `Sex Requirement: ${item.itemSexReq === "" ? "N/A" : item.itemSexReq}\nClass Specific: ${classical(item.itemClass)}\nCustom Head Link: ${item.customHeadLink === "" ? "N/A" : item.customHeadLink}.\nHide Head: ${item.noHead}.\nHide Hip: ${item.noHip}.\nShow Default Limbs: ${item.defaultLimbs}.`
                });

                modifyCoredItem(item.coreActiveItemId, cores, 0, embeds, files);
                modifyCoredItem(item.corePassiveItemId, cores, 1, embeds, files);

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
            break;
            case ItemSBox.ITEM_CATEGORY_BOT_ID:
                embeds[0].fields?.push({
                    name: "Robot",
                    value: `Damage: **${item.itemDamage}**\nnDamage Type: ${item.itemDmgType === 1 ? "Physical" : "Energy"}`
                });

                modifyCoredItem(item.coreActiveItemId, cores, 0, embeds, files);
                modifyCoredItem(item.corePassiveItemId, cores, 1, embeds, files);

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
                break;
            // case ItemSBox.ITEM_CATEGORY_MISSION_ID:
            //     embeds[0].fields?.push({
            //         name: "Misc Item - Description",
            //         value: SwarmResources.languages[item.itemDesc] ?? item.itemDesc
            //     });
            //     break;
        }

        if (item.isCoreItemRecord()) {
            const core = SkillsSMBox.recordById("core", item.coreId);
            const skill = core ? SkillsSMBox.recordById("all", core.skillId) : undefined;

            // In case there's an unreleased core item in game, but its skill info is not yet released.
            if ((skill && ImageManager.has("cores", skill.skillLink + ".png")) || ImageManager.has("cores", item.itemLinkage + ".png")) {
                files.push({ name: "core-" + skill?.skillId + ".png", contents: await readFile(Config.dataDir + "/assets/cores/" + (skill?.skillLink ?? item.itemLinkage) + ".png") });

                embeds[0].thumbnail = { url: "attachment://core-" + skill?.skillId + ".png" };
            }

            if (skill && core) {
                let skillItem = ItemSBox.objMap.find(v => v.itemCat === 9 && v.coreId === core.coreId);

                if (skillItem) {
                    let items = filter(ItemSBox.objMap.toArray(), (v => ("corePassiveItemId" in v) && (v.corePassiveItemId === skillItem.itemId || v.coreActiveItemId === skillItem.itemId)));

                    if (items.length) {
                        embeds[0].fields?.push({
                            name: "Item (Source)",
                            value: lazyTrimStringList(map(items, v => v.itemName + " (ID: " + v.itemId + ")"))
                        })
                    };

                    embeds[0].description = SwarmResources.languages[skill.skillDesc] || skill.skillDesc;
                }
            }
        } else {
            if (item.itemName === "Arcade Token") {
                embeds[0].thumbnail = { url: "https://cdn.discordapp.com/attachments/813045270572302336/1109234163283931266/afaf.png" };
                embeds[0].color = 0xF3E956;
            } else {
                const assetTag = item.getAssetTag();
                const { result } = ImageManager.has(assetTag, item.itemLinkage, false);

                if (result !== "") {
                    files.push({ name: assetTag + "-" + result, contents: await readFile(`${Config.dataDir}/assets/${assetTag}/${result}`) });

                    embeds[0].thumbnail = { url: "attachment://" + assetTag + "-" + result };
                }
            }
        }

        return { embeds, components, files }
    }
}