export interface IEntityStyle {
    id: number;
    type: number;

    charpri: string;
    charsec: string;
    charhair: string;
    charhairS: number;
    characcnt: string;
    characcnt2: string;
    charskin: string;
    chareye: string;

    chargender: string;

    // Some NPCs have different name in battles.
    charname: string;

    npcscale: number | null;
    npchead: string | null;

    last_fetched: Date;
}

export default class EntityStyle implements IEntityStyle {
    id: number;
    type: number;

    charpri: string;
    charsec: string;
    charhair: string;
    charhairS: number;
    characcnt: string;
    characcnt2: string;
    charskin: string;
    chareye: string;

    chargender: string;

    charname: string;

    npcscale: number | null;
    npchead: string | null;

    last_fetched: Date;

    constructor(data: IEntityStyle) {
        this.id = data.id;
        this.type = data.type;

        this.charpri = data.charpri;
        this.charsec = data.charsec;
        this.charhair = data.charhair;
        this.charhairS = data.charhairS;
        this.characcnt = data.characcnt;
        this.characcnt2 = data.characcnt2;
        this.charskin = data.charskin;
        this.chareye = data.chareye;
        this.chargender = data.chargender;
        this.charname = data.charname;

        this.npcscale = data.npcscale;
        this.npchead = data.npchead;

        this.last_fetched = data.last_fetched;

    }
}