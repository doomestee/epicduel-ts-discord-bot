export interface IFaction {
    id: number;
    name: string;

    /**
     * 1 for Exile, 2 for Legion.
     * Nullable as we may have received a partial faction data.
     */
    alignment: 1 | 2 | null;

    flag_symbol: number;
    flag_symbol_color: string;
    flag_back: number;
    flag_back_color: string;
    flag_color: string;

    last_fetched: Date;
}

export default class Faction implements IFaction {
    id: number;
    name: string;
    alignment: 1 | 2 | null;
    flag_symbol: number;
    flag_symbol_color: string;
    flag_back: number;
    flag_back_color: string;
    flag_color: string;
    last_fetched: Date;

    constructor(data: IFaction) {
        if (!data.id) throw Error("ID not defined");

        this.id = data.id;
        this.name = data.name;
        this.alignment = data.alignment;
        this.flag_symbol = data.flag_symbol;
        this.flag_symbol_color = data.flag_symbol_color;
        this.flag_back = data.flag_back;
        this.flag_back_color = data.flag_back_color;
        this.flag_color = data.flag_color;
        this.last_fetched = data.last_fetched;
    }
}