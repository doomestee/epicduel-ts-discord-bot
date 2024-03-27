export interface IFaction {
    id: number;
    name: string;

    /**
     * 1 for Exile, 2 for Legion.
     * Nullable as we may have received a partial faction data.
     */
    alignment: 1 | 2 | null;
}

export default class Faction implements IFaction {
    id: number;
    name: string;
    alignment: 1 | 2 | null;

    constructor(data: IFaction) {
        if (!data.id) throw Error("ID not defined");

        this.id = data.id;
        this.name = data.name;
        this.alignment = data.alignment;
    }
}