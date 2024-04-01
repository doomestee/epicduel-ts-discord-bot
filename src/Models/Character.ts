import { ActionRowBase, ButtonStyles, ComponentTypes, Embed, EmbedField, EmbedOptions, InteractionContent, MessageComponent, SelectOption, StringSelectMenuOptions, User } from "oceanic.js";
import { discordDate, emojiStarCount, emojis, getHighestTime, getLegendRankByExp, getStarCount, getUserLevelByExp, letters, levels } from "../util/Misc.js";
import { IFaction } from "./Faction.js";
import { ICharacterName } from "./CharacterName.js";

export interface ICharacter {
    /**
     * Character's ID
     */
    id: number;
    /**
     * ID of the user this character came from.
     */
    user_id: number;
    name: string;
    /**
     * Bitwise
     */
    flags: number;
    rating: number,
    exp: number,
    fame: number,
    faction_id: number,
    inv_slots: number,
    bank_slots: number,
    last_seen: Date,

    /**
     * 1 for Exile, 2 for Legion.
     * Nullable as this was added recently.
     */
    alignment: 0 | 1 | 2 | null;
}

export default class Character implements ICharacter {
    id: number;
    user_id: number;
    name: string;
    flags: number;
    rating: number;
    exp: number;
    fame: number;
    faction_id: number;
    inv_slots: number;
    bank_slots: number;
    last_seen: Date;
    alignment: 0 | 1 | 2 | null;

    constructor(data: ICharacter) {
        if (!data.id) throw Error("ID not defined");

        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.id = data.id;
        this.flags = data.flags;
        this.rating = data.rating;
        this.exp = data.exp;
        this.fame = data.fame;
        this.faction_id = data.faction_id;
        this.inv_slots = data.inv_slots;
        this.bank_slots = data.bank_slots;
        this.last_seen = data.last_seen;
        this.alignment = data.alignment;
    }

    /**
     * For non populated.
     */
    static respondify(char: ICharacter, names: ICharacterName[], fact?: Partial<IFaction>) : InteractionContent {
        const components:ActionRowBase<MessageComponent>[] = [{
            type: ComponentTypes.ACTION_ROW, components: [{
                type: ComponentTypes.BUTTON, label: "Character Page", style: ButtonStyles.LINK, url: "https://ed.doomester.one/charpage.asp?id=" + encodeURIComponent(char.name),
                emoji: { id: "1212507121636085800", name: "exilegion" }
            }, {
                type: ComponentTypes.BUTTON, style: ButtonStyles.SECONDARY, label: "Achievements",
                emoji: { id: "1069333770093740052", name: "achievement" }, customID: "achiev_menu_" + char.id + "_000_0_0"
            }]
        }];

        const fields:EmbedField[] = [{
            name: "Misc",
            value: `Fame: **${char.fame}**\nRating Points: **${char.rating}** ${emojiStarCount(getStarCount(char.rating))}\nLast Seen: ${discordDate(char.last_seen)}${char.flags & 2 ? "\nIs a staff." : ""}`,
            inline: true
        }];

        if (fact && fact["id"] && fact["name"]) {
            fields.push({
                name: "Faction",
                value: `Name: **${fact.name}**\nAlignment: ${fact.alignment === 1 ? "Exile" : fact.alignment === 2 ? "Legion" : "Unknown."}`,
                inline: true
            });

            components[0].components.push({
                type: ComponentTypes.BUTTON, customID: `faction_open_${fact.id}`,
                style: ButtonStyles.SECONDARY, label: "Faction", emoji: { id: "1069333514811609138", name: "faction" }
            });
        }

        if (names && names.length > 1) {
            fields.push({
                name: "Old Name(s)",
                value: `This character used to have these names: ${[...new Set(names.map(v => v.name))].join(", ")}.`
            })
        }

        return {
            embeds: [{
                title: char.name,
                description: `ID: ${char.id} (User: ${char.user_id})\nLevel ${getUserLevelByExp(char.exp)}${char.exp > levels[39] ? ` - Leg Rank ${getLegendRankByExp(char.exp)}` : ""}${char.alignment !== null ? "\nAlignment: " + (char.alignment === 1 ? "Exile" : "Legion") : ""}`,
                fields
            }]
        }
    }

    static listify(author: User, name: string, list: Array<ICharacter & ({ factname: string, factid: number, factalignment: 1 | 2 | null } | { factname: null, factid: null, factalignment: null })>, time: bigint) : InteractionContent {
        // You can have up to 25 select options, but just for safety, 10 will be the maximum.

        const embeds:Embed[] = [{
            description: `There are ${list.length === 10 ? "over 10" : list.length} character${list.length > 1 ? "s" : ""} that meets the criteria.`
        }];

        const options:SelectOption[] = [];// = [{  }]//StringSelectMenuOptions["options"] = [{}]

        for (let i = 0, len = list.length; i < len; i++) {
            embeds[0].description += `\n\n${letters[i]} - **${list[i].name}** (ID: ${list[i].id} - User ID: ${list[i].user_id})\nFaction: ${list[i].factid === null ? "unknown." : `${list[i].alignment === null ? "❓ " : "<:" + emojis.alignment[list[i].alignment as 1 | 2] + "> "}**${list[i].factname}** (ID: ${list[i].factid})`}`

            options.push({
                label: `${list[i].name}`,
                description: `Lvl ${getUserLevelByExp(list[i].exp)}, ID: ${list[i].id} (User ID: ${list[i].user_id})`,
                value: `${list[i].id}`,
                emoji: {
                    id: null, name: emojis.letters[i]
                }
            });
        }

        embeds[embeds.length - 1]["footer"] = {
            text: `Execution time: ${getHighestTime(process.hrtime.bigint() - time, "ns")}`
        }

        return {
            embeds,
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, 
                    customID: `char_menu_${/*discordId*/"000"}_0`,
                    options
                }],
            }, {
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.BUTTON, style: ButtonStyles.SECONDARY, label: "Fetch with this character name",
                    emoji: { id: "1069333770093740052", name: "achievement" }, customID: "char_fetch_1_" + author.id + "_" + name
                }]
            }]
        }
    }
}