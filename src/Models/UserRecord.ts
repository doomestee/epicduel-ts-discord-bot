export interface IUserRecord {
    char_id: number;

    w1: number;
    w2: number;
    wj: number;
    l1: number;
    l2: number;
    lj: number;
    npc: number;

    last_fetched: Date;
}

export default class UserRecord implements IUserRecord {
    char_id: number;

    w1: number;
    w2: number;
    wj: number;
    l1: number;
    l2: number;
    lj: number;
    npc: number;

    last_fetched: Date;

    constructor(data: IUserRecord) {
        this.char_id = data.char_id;

        this.w1 = data.w1;
        this.w2 = data.w2;
        this.wj = data.wj;
        this.l1 = data.l1;
        this.l2 = data.l2;
        this.lj = data.lj;
        this.npc = data.npc;

        this.last_fetched = data.last_fetched;
    }
}