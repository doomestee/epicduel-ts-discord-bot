export interface IFactionMember {
    faction_id: number;
    char_id: number;
    char_name: string;
    title: string;
    rank: number;
}

export class FactionMember implements IFactionMember {
    char_id: number;
    char_name: string;
    faction_id: number;
    rank: number;
    title: string;

    constructor(obj: IFactionMember) {
        this.faction_id = obj.faction_id;
        this.char_id = obj.char_id;
        this.char_name = obj.char_name;
        this.rank = obj.rank;
        this.title = obj.title;
    }
}