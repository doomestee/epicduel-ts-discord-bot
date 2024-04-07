import { ButtonStyles, ComponentTypes, Embed, File, MessageActionRow } from "oceanic.js";
import ItemSBox from "../../game/box/ItemBox.js";
import Swarm from "../../manager/epicduel.js";
import Command, { CommandType } from "../../util/Command.js";
import { SwarmError } from "../../util/errors/index.js";
import { filter, getHighestTime, lazyTrimStringList } from "../../util/Misc.js";
import DatabaseManager from "../../manager/database.js";
import ClassBox from "../../game/box/ClassBox.js";
import SkillsSMBox from "../../game/box/SkillsBox.js";
import ImageManager from "../../manager/image.js";
import { readFile } from "fs/promises";
import Config from "../../config/index.js";

//coreActiveItemId

// WE LOVE MUTABILITY!
function coreItemIdToFull(itemId: number, cores: [number, number], type: 0 | 1) {
    if (itemId === 0) return "None pre-slotted.";
    
    const item = ItemSBox.objMap.get(itemId);

    if (!item || !item.isCoreItemRecord()) return "N/A";

    const core = SkillsSMBox.recordById("core", item.coreId);
    const skill = core ? SkillsSMBox.recordById("all", core.skillId) : undefined;

    if (!skill || !core) return "N/A";

    const skillName = Swarm.languages[skill.skillName] || skill.skillName;
    const skillDesc = Swarm.languages[skill.skillDesc] || skill.skillDesc;

    cores[type] = core.skillId;

    return `**${skillName}** (Item ID: ${itemId}, Skill ID: ${skill.skillId}, Core ID: ${core?.coreId})\n${skillDesc}`;//skill.skillId
}

export default new Command(CommandType.Application, { cmd: ["item", "search"], description: "Shows description and stuff about an item.", cooldown: 1000, usableEdRestricted: true })
    .attach('run', async ({ client, interaction }) => {
        if (ItemSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const itemId = interaction.data.options.getInteger("name", true);
        const item = ItemSBox.objMap.get(itemId);

        if (itemId < 0 || !item) return interaction.reply({ content: "There's no item for that ID (" + itemId + ")" });

        if (!interaction.acknowledged) await interaction.defer();

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
            title: item.itemName + " (ID: " + itemId + ")"
        }];

        const components:MessageActionRow[] = [{
            type: ComponentTypes.ACTION_ROW,
            components: [{
                type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
                customID: "item_swf_links_" + itemId,
                label: "Get SWF Links (Ghost Respond)", disabled: false
            }]
        }];

        if ("itemDesc" in item) {
            embeds[0].description = item.itemDesc;

            if (Swarm.languages[item.itemDesc]) embeds[0].description = Swarm.languages[item.itemDesc];
        }
        
        // const [finderRec] = ItemFinder.search(itemId, true);
        const merchants = await DatabaseManager.helper.getMerchantsByItemId(itemId);//finderRec.merchantIds.filter(v => v !== 0).map(v => MerchantSBox.objMap.get(v) as MerchantRecord);

        if (merchants.length) {
            let mercText = "";

            for (let i = 0, len = merchants.length; i < len; i++) {
                let itemText = "ERROR: can't find item from the merchant.";
                for (let j = 0, jen = merchants[i].items.length; j < jen; j++) {
                    let mItem = (merchants[i].items[j]);

                    if (mItem[0] === itemId) {
                        itemText = mItem[1] === -1 ? "unlimited." : mItem[1] + " left.";
                        continue;
                    }
                }
                // const itemText = merchants[i].items.find(v => v[0] === itemId);//?.[1] === -1 ? "unlimited." : merc.items.find(a => a[0] === itemId)[1] + " left.")

                itemText = `[${merchants[i].name}](https://epicduelwiki.com/w/${encodeURIComponent(merchants[i].name)}) (ID: ${merchants[i].id}) - ${itemText}\n`;

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
                }, {
                    name: "Core(s)",
                    value: `__Active__:\n${coreItemIdToFull(item.coreActiveItemId, cores, 0)}\n\n__Passive__:\n${coreItemIdToFull(item.corePassiveItemId, cores, 1)}`
                });

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
            break;
            case ItemSBox.ITEM_CATEGORY_ARMOR_ID:
                embeds[0].fields?.push({
                    name: "Armor",
                    value: `Sex Requirement: ${item.itemSexReq === "" ? "N/A" : item.itemSexReq}\nClass Specific: ${classical(item.itemClass)}\nCustom Head Link: ${item.customHeadLink === "" ? "N/A" : item.customHeadLink}.\nHide Head: ${item.noHead}.\nHide Hip: ${item.noHip}.\nShow Default Limbs: ${item.defaultLimbs}.`
                }, {
                    name: "Core(s)",
                    value: `__Active__:\n${coreItemIdToFull(item.coreActiveItemId, cores, 0)}\n\n__Passive__:\n${coreItemIdToFull(item.corePassiveItemId, cores, 1)}`
                });

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
            break;
            case ItemSBox.ITEM_CATEGORY_BOT_ID:
                embeds[0].fields?.push({
                    name: "Robot",
                    value: `Damage: **${item.itemDamage}**\nnDamage Type: ${item.itemDmgType === 1 ? "Physical" : "Energy"}`
                }, {
                    name: "Core(s)",
                    value: `__Active__:\n${coreItemIdToFull(item.coreActiveItemId, cores, 0)}\n\n__Passive__:\n${coreItemIdToFull(item.corePassiveItemId, cores, 1)}`
                });

                if (item.coreActiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[0], style: ButtonStyles.PRIMARY, disabled: cores[0] < 1, label: "See Active Core Info" });
                if (item.corePassiveItemId > 0) components[0].components.push({ type: ComponentTypes.BUTTON, customID: "core_open_" + cores[1], style: ButtonStyles.PRIMARY, disabled: cores[1] < 1, label: "See Passive Core Info" });
                break;
            case ItemSBox.ITEM_CATEGORY_MISSION_ID:
                embeds[0].fields?.push({
                    name: "Misc Item - Description",
                    value: Swarm.languages[item.itemDesc] ?? item.itemDesc
                });
                break;
        }

        const files:File[] = [];

        if (item.isCoreItemRecord()) {
            const core = SkillsSMBox.recordById("core", item.coreId);
            const skill = core ? SkillsSMBox.recordById("all", core.skillId) : undefined;

            // In case there's an unreleased core item in game, but its skill info is not yet released.
            if ((skill && ImageManager.has("cores", skill.skillLink + ".png")) || ImageManager.has("cores", item.itemLinkage + ".png")) {
                files.push({ name: "core.png", contents: await readFile(Config.dataDir + "/assets/cores/" + (skill?.skillLink ?? item.itemLinkage) + ".png") });

                embeds[0].thumbnail = { url: "attachment://core.png" };
            }

            if (skill && core) {
                let skillItem = ItemSBox.objMap.find(v => v.itemCat === 9 && v.coreId === core.coreId);

                if (skillItem) {
                    let items = filter(ItemSBox.objMap.toArray(), (v => ("corePassiveItemId" in v) && (v.corePassiveItemId === skillItem.itemId || v.coreActiveItemId === skillItem.itemId)));

                    if (items.length) {
                        embeds[0].fields?.push({
                            name: "Item (Source)",
                            value: lazyTrimStringList(items.map(v => v.itemName + " (ID: " + v.itemId + ")"))
                        })
                    };

                    embeds[0].description = Swarm.languages[skill.skillDesc] || skill.skillDesc;
                }
            }
        } else {
            // for now, only swords are currently supported

            if (item.itemName === "Arcade Token") {
                embeds[0].thumbnail = { url: "https://cdn.discordapp.com/attachments/813045270572302336/1109234163283931266/afaf.png" };
                embeds[0].color = 0xF3E956;
            }

            // if (item instanceof WeaponRecord) {
            //     if (item.itemCat === 3 && item.itemName.includes("Star Saber") && item.itemId < 5944 && item.itemId >= 5824) {
            //         if (epicduel.client.items.swords.some(v => v.slice(0, -4) === item.itemLinkage)) {
            //             files.push({ contents: await readFile("/data/swords/" + item.itemLinkage + ".gif"), name: "saber.gif"});

            //             mmmmbed.thumbnail = { url: "attachment://saber.gif" };
            //         }
            //     }
            // } else if (item.itemName === "Arcade Token") {
            //     mmmmbed.thumbnail = { url: "https://cdn.discordapp.com/attachments/813045270572302336/1109234163283931266/afaf.png" };
            //     mmmmbed.color = 0xF3E956;
            // }
        }

        embeds[0]["author"] = {
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL()
        };

        embeds[0]["footer"] = {
            text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}.`
        };

        return interaction.createFollowup({
            embeds,
            components,
            files
        });

    });