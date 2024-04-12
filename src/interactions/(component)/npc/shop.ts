import { ButtonStyles, ComponentTypes, Embed, MessageActionRow } from "oceanic.js";
import Command, { CommandType } from "../../../util/Command.js"
import { DiscordError, SwarmError } from "../../../util/errors/index.js";
import MerchantSBox from "../../../game/box/MerchantBox.js";
import DatabaseManager from "../../../manager/database.js";
import ItemSBox, { AnyItemRecordsExceptSelf } from "../../../game/box/ItemBox.js";
import { lazyTrimStringList, map } from "../../../util/Misc.js";

const itemTypeToEmoji = {
    [ItemSBox.ITEM_CATEGORY_ARMOR_ID]: "<:armor:1156691507395432499>",
    [ItemSBox.ITEM_CATEGORY_AUXILIARY_ID]: "<:aux:1156691510700552365>",
    [ItemSBox.ITEM_CATEGORY_BLADE_ID]: "<:blade:1156691512080482314>",
    [ItemSBox.ITEM_CATEGORY_BOT_ID]: "<:bot:1156691518984290375>",
    [ItemSBox.ITEM_CATEGORY_CLUB_ID]: "<:club:1156691522067111946>",
    [ItemSBox.ITEM_CATEGORY_CORE_ID]: "<:core:1156691573942276196>",
    [ItemSBox.ITEM_CATEGORY_GUN_ID]: "<:gun:1156691576693727272>",
    [ItemSBox.ITEM_CATEGORY_MISSION_ID]: "<:misc:1156691578337898626>",
    [ItemSBox.ITEM_CATEGORY_STAFF_ID]: "<:staff:1156691580506341537>",
    [ItemSBox.ITEM_CATEGORY_SWORD_ID]: "<:sword:1156691581898858606>",
    [ItemSBox.ITEM_CATEGORY_VEHICLE_ID]: "<:vehicle:1156691583270408290>",
    [20]: "",
    [21]: "",
};

export default new Command(CommandType.Component, { custom_id: "shop_<merchId>_<userId>" })
    .attach('run', async ({ client, interaction, variables }) => {
        if (interaction.data.componentType !== ComponentTypes.BUTTON) return;

        if (MerchantSBox.objMap.size === 0) return interaction.reply(SwarmError.noClient());

        const time = process.hrtime.bigint();

        const merchId = parseInt(variables.merchId);
        const { userId } = variables;

        let bypass = false;

        if (userId === "000") bypass = true;
        else if (interaction.user.id === userId) bypass = true;

        if (!bypass) return interaction.createMessage(DiscordError.noBypass());//({content: "You are not the original person who've used the command!", flags: 64});

        const merchant = MerchantSBox.objMap.get(merchId);

        if (!merchant) return interaction.reply({ flags: 64, content: "There are no merchants with the ID given." });

        if (!interaction.acknowledged) await interaction.defer();

        const merc = await DatabaseManager.helper.getMerchant(merchId);

        let obj:Embed = {};

        // let components:MessageActionRow[] = [{
        //     type: ComponentTypes.ACTION_ROW, components: [{
        //         type: ComponentTypes.BUTTON, style: ButtonStyles.PRIMARY,
        //         customID: "refresh_npc_0_" + (merc ? merc[0].id : "-1"), disabled: true,
        //         label: "Refresh Wares"
        //     }]
        // }];

        if (merc) {
            let items = map(merc.items, v => ItemSBox.getItemById(v[0]) as AnyItemRecordsExceptSelf).sort((a, b) => a.itemCat - b.itemCat);

            obj = {
                description: lazyTrimStringList(map(items, (a, i) => { 
                    let credits = a.itemCredits ? a.itemCredits + "<:Credits:1095129742505689239>" : "";
                    let varium = a.itemVarium ? a.itemVarium + "<:Varium:1095129746402181282>" : "";

                    a.itemCat

                    return (itemTypeToEmoji[a.itemCat] ? itemTypeToEmoji[a.itemCat] + " " : "") + "[" + a.itemName + "](https://epicduelwiki.com/index.php/" + encodeURIComponent(a.itemName.split(" ").join("_")) + ") - " + `${(credits || varium) ? (credits + " " + varium).trim() : ""} - ${merc.items[i][1] === -1 ? "unlimited" : merc.items[i][1]} stock`
                }), 4096),
                title: merc.name + "'s Wares",
                author: {
                    name: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                }, footer: {
                    text: "Last checked"
                }, timestamp: merc.last_fetched.toISOString()
            };

            /*components.push({
                type: ComponentTypes.ACTION_ROW, components: [{
                    customID: "npc"
                }]
            }) FILTER THING!*/
        }

        return interaction.createFollowup({
            embeds: [{
                description: "This NPC does not sell wares.",
                ...obj
            }], components: []//components.length ? components : []
        })

    })