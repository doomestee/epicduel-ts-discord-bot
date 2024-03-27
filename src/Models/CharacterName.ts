export interface ICharacterName {
    o_id: string;
    id: number;
    name: string;
    first_seen: Date;
    last_seen: Date;
}

export default class CharacterName implements ICharacterName {
    o_id: string;
    id: number;
    name: string;
    first_seen: Date;
    last_seen: Date;

    constructor(data: ICharacterName) {
        this.id = data.id;
        this.o_id = data.o_id;
        this.name = data.name;
        this.first_seen = data.first_seen;
        this.last_seen = data.last_seen;
    }
}