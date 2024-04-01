import { ActionRowBase, ButtonStyles, ComponentTypes, EmbedField, InteractionContent, MessageComponent } from "oceanic.js";
import { discordDate, emojiStarCount, getLegendRankByExp, getStarCount, getUserLevelByExp, levels } from "../util/Misc.js";
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
    static respondify(char: ICharacter, names: ICharacterName[], fact?: IFaction) : InteractionContent {
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
            value: `Fame: **${char.fame}**\nRating Points: **${emojiStarCount(getStarCount(char.rating))}**\nLast Seen: ${discordDate(char.last_seen)}`,
            inline: true
        }];

        if (fact && ["id", "name", "alignment"].every(v => v in fact)) {
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
                description: `ID: ${char.id} (User: ${char.user_id})\nLevel ${getUserLevelByExp(char.exp)}${char.exp > levels[39] ? getLegendRankByExp(char.exp) : ""}${char.alignment !== null ? "\nAlignment: " + (char.alignment === 1 ? "Exile" : "Legion") : ""}`,
                fields
            }]
        }
    }
}