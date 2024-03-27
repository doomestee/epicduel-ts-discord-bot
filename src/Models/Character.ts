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
}