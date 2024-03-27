export interface IBlacklist {
    o_id: string;
    id: string;
    type: number;
    source: string;
    start: Date;
    end: Date | null;
}

export default class Blacklist implements IBlacklist {
    o_id: string;
    id: string;
    type: number;
    source: string;
    start: Date;
    end: Date | null;

    constructor(data: IBlacklist) {
        this.o_id = data.o_id;
        this.id = data.id;
        this.type = data.type;
        this.source = data.source;
        this.start = data.start;
        this.end = data.end;
    }
}