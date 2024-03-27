export interface IFame {
    char_id: number;
    count: number;
    last_spoken: Date;
    char_name: string | null;
}

export default class Fame implements IFame {
    char_id: number;
    count: number;
    last_spoken: Date;
    char_name: string | null;

    constructor(data: IFame) {
        this.char_id = data.char_id;
        this.count = data.count;
        this.last_spoken = data.last_spoken;
        this.char_name = data.char_name;
    }
}