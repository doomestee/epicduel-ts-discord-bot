export interface ICharacterLink {
    discord_id: string;
    user_id: number;
    id: number;
    flags: number;
    last_famed: Date | null;
    link_date: Date;
}

export default class CharacterLink implements ICharacterLink {
    discord_id: string;
    user_id: number;
    id: number;
    flags: number;
    last_famed: Date | null;
    link_date: Date;

    constructor(data: ICharacterLink) {
        if (!data.id) throw Error("ID not defined");

        this.discord_id = data.discord_id;
        this.user_id = data.user_id;
        this.id = data.id;
        this.flags = data.flags;
        // if (data.flago) this.flags = data.flago;

        this.last_famed = data.last_famed ?? null;
        this.link_date = data.link_date;

        // if (character && JSON.stringify(character) !== "{}") this.char = new Character(character);
        // else this.char = null;

        // if (faction && faction.id !== 0 && JSON.stringify(faction) !== "{}") this.faction = new Faction(faction);
        // else this.faction = null;
    }
}