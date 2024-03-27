export interface IRally {
    id: number;
    alignment: number;
    triggered_at: Date;
    war_id: number | null;
};

export default class Rally implements IRally {
    id: number;
    alignment: number;
    triggered_at: Date;
    war_id: number | null;

    constructor(data: IRally) {
        this.id = data.id;
        this.alignment = data.alignment;
        this.triggered_at = data.triggered_at;
        this.war_id = data.war_id;
    }
}