export interface IWar {
    id: number;
    region_id: number;

    max_points: number;

    created_at: Date;
    ended_at: Date | null;
}

export default class War implements IWar {
    id: number;
    region_id: number;

    max_points: number;

    created_at: Date;
    ended_at: Date | null;

    constructor(data: IWar) {
        this.id = data.id;
        this.region_id = data.region_id;

        this.max_points = data.max_points;

        this.created_at = data.created_at;
        this.ended_at = data.ended_at;
    }
}