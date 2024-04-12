import { ActionRowBase, ButtonStyles, ComponentTypes, Embed, EmbedField, EmbedOptions, InteractionContent, MessageComponent, SelectOption, StringSelectMenuOptions, User } from "oceanic.js";
import { CharPage, discordDate, emojiStarCount, emojis, getHighestTime, getLegendRankByExp, getStarCount, getUserLevelByExp, letters, levels } from "../util/Misc.js";
import { IFaction } from "./Faction.js";
import { ICharacterName } from "./CharacterName.js";
import ClassBox from "../game/box/ClassBox.js";
import { CharLink, CharLinkFact } from "../util/DBHelper.js";
import ImageManager from "../manager/image.js";

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
    static async respondify(char: ICharacter | undefined, names: ICharacterName[], fact: Partial<IFaction>, partial?: CharPage | null) : Promise<InteractionContent> {
        if (char && "link_flags" in char && typeof char["link_flags"] === "number") {
            if (char["link_flags"] & 1 << 4) return { embeds: [{ title: "Hidden Character", description: "You just tried to search for a hidden character." }] }
        }

        const components:ActionRowBase<MessageComponent>[] = [{
            type: ComponentTypes.ACTION_ROW, components: [{
                type: ComponentTypes.BUTTON, label: "Character Page", style: ButtonStyles.LINK, url: "https://ed.doomester.one/charpage.asp?id=" + encodeURIComponent(char?.name ?? partial?.charName as string),
                emoji: { id: "1212507121636085800", name: "exilegion" }
            }, {
                type: ComponentTypes.BUTTON, style: ButtonStyles.SECONDARY, label: "Achievements",
                emoji: { id: "1069333770093740052", name: "achievement" }, customID: "achiev_menu_" + (char?.id ?? partial?.charId) + "_000_0_0"
            }]
        }];

        const fields:EmbedField[] = [{
            name: "Misc",
            value: `Fame: **${char?.fame ?? partial?.charLikes}**\nRating Points: **${char?.rating ?? partial?.rating}** ${emojiStarCount(getStarCount(char?.rating ?? Number(partial?.rating)))}${partial?.charGender !== undefined ? `\nGender: ${partial.charGender === "M" ? "Male" : "Female"}` : "" }${partial?.charClassId !== undefined ? `\nClass: ${ClassBox.CLASS_NAME_BY_ID[Number(partial.charClassId)]}` : "" }${char ? `\nLast Seen: ${discordDate(char.last_seen)}${char.flags & 2 ? "\nIs a staff." : ""}` : ""}`,
            inline: true
        }];

        if (fact && fact["id"] && fact["id"] !== 0 && fact["name"]) {
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

        let levelText = "";

        if ((char === undefined && partial?.charLvl) || (partial && char && parseInt(partial.charLvl) > getUserLevelByExp(char.exp))) levelText = "\nLevel " + partial?.charLvl;
        else if (char?.exp) levelText = "\nLevel " + getUserLevelByExp(char.exp) + (char.exp > levels[39] ? ` - Leg Rank ${getLegendRankByExp(char.exp)}` : "")

        const files:import("oceanic.js").File[] = [];

        if (partial === null) {
            fields.push({ name: "Notice", value: "The character may have changed their name, as their character page is inaccessible.\nIn the case of Musashi, tell NW to fix his page." });
        } else if (partial !== undefined) {
            const buffer = await ImageManager.SVG.generator.char(partial);

            files[0] = {
                contents: buffer,
                name: "char.png"
            };
        }

        return {
            embeds: [{
                title: char?.name ?? partial?.charName,
                description: `ID: ${char?.id ?? partial?.charId}${char ? " (User: " + char.user_id + ")" : ""}${levelText}${char?.alignment != null ? "\nAlignment: " + (char?.alignment === 1 ? "Exile" : "Legion") : ""}`,
                fields,
                thumbnail: {
                    url: files.length ? "attachment://char.png" : ""
                }
            }],
            components, files
        }
    }

    static listify(author: User, name: string, list: Array<(ICharacter & { old_name: string }) & ({ factname: string, factid: number, factalignment: 1 | 2 | null } | { factname: null, factid: null, factalignment: null })>, time: bigint) : InteractionContent {
        // You can have up to 25 select options, but just for safety, 10 will be the maximum.

        const embeds:Embed[] = [{
            description: `There are ${list.length === 10 ? "over 10" : list.length} character${list.length > 1 ? "s" : ""} that meets the criteria.`
        }];

        const options:SelectOption[] = [];// = [{  }]//StringSelectMenuOptions["options"] = [{}]

        for (let i = 0, len = list.length; i < len; i++) {
            embeds[0].description += `\n\n${letters[i]} - **${list[i].old_name}** (ID: ${list[i].id} - User ID: ${list[i].user_id})${list[i].old_name !== list[i].name ? "\n*Current name: " + list[i].name + "*" : ""}\nFaction: ${list[i].factid === null ? "unknown." : `${list[i].alignment === null ? "❓ " : "<:" + emojis.alignment[list[i].alignment as 1 | 2] + "> "}**${list[i].factname}** (ID: ${list[i].factid})`}`

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

    static manageify(index: number, linkChars: CharLink[]) : InteractionContent {
        let char = linkChars[index];

        return {
            embeds: [{
                title: "Managing Character",
                description: `Name: **${char.name}**\nID: ${char.id}\nLinked at: <t:${Math.round(char.link_date.getTime()/1000)}:F>\n\nFlags: ${char.flags}`,
            }],
            components: [{
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, customID: "manage_1_" + char.discord_id, options: linkChars.map((v, i) => {
                        return {
                            label: v.name,
                            description: "Lvl: " + getUserLevelByExp(v.exp) + ", ID: " + v.id,
                            value: v.id.toString(),
                            default: i === index, emoji: { name: emojis.letters[i] }
                        }
                    })
                }]
            }, {
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.BUTTON, label: "Character Page", style: ButtonStyles.LINK, url: "https://ed.doomester.one/charpage.asp?id=" + encodeURIComponent(char.name),
                    emoji: { id: "1212507121636085800", name: "exilegion" }
                }, {
                    type: ComponentTypes.BUTTON, label: "Fame", style: ButtonStyles.SECONDARY, customID: "fame_0_" + char.id, disabled: true
                }, {
                    type: ComponentTypes.BUTTON, label: "Unlink", style: ButtonStyles.DANGER, customID: "unlink_0_" + char.id + "_" + Math.round(Date.now() + 30000)
                }, {
                    type: ComponentTypes.BUTTON, label: "Flags?", style: ButtonStyles.SECONDARY, customID: "help_1_" + char.flags
                }]
            }],
            flags: 64
        }
    }

    static linskify(discordId: string, invokerId: string, char: CharLinkFact | undefined, linkChars: CharLinkFact[], names: ICharacterName[], partial?: CharPage | null) : Promise<InteractionContent> {
        return this.respondify(char, names, { id: char?.faction_id, alignment: char?.fact_alignment, name: char?.fact_name }, partial ?? null).then(result => {
            result.components?.push({
                type: ComponentTypes.ACTION_ROW, components: [{
                    type: ComponentTypes.STRING_SELECT, minValues: 1, maxValues: 1, customID: "character_select_" + discordId + "_" + invokerId,
                    options: linkChars.map((v, i) => {
                        let hidden = (v.link_flags & 1 << 4);
        
                        return {
                            label: hidden ? "Hidden Character" : ((v.id === 2254324) ? "🗑️ (trrrrash)" : v.name),
                            value: hidden ? "h" + Math.round((Math.random()*1000) + (Date.now()/50000)) : String(v.id),
                            default: (char) ? v.id === char.id : i === 0,
                            description: hidden ? "N/A" : "Lvl " + getUserLevelByExp(v.exp) + ", ID: " + v.id,
                            emoji: { name: emojis.letters[i] }
                        }
                    })
                }]
            });

            result.components?.reverse();

            return result;
        });
    }
}