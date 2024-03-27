export interface IAnalytics {
    o_id: string;
    type: number;
    id: string|number;
    args: string;
    triggered_at: Date;
}

export default class Analytics implements IAnalytics {
    o_id: string;
    type: number;
    id: string|number;
    args: string;
    triggered_at: Date;

    constructor(data: IAnalytics) {
        if (!data.o_id) throw Error("ID not defined");

        this.o_id = data.o_id;
        this.type = data.type;
        this.id = data.id;
        this.args = data.args;
        this.triggered_at = data.triggered_at;
    }
}