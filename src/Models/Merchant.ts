export interface IMerchant {
    id: number;
    name: string;

    items: [number, number][];
    last_fetched: Date;
}

export default class Merchant implements IMerchant {
    id: number;
    name: string;

    items: [number, number][];
    last_fetched: Date;

    constructor(data: IMerchant) {
        this.id = data.id;
        this.name = data.name;
        this.items = data.items;
        this.last_fetched = data.last_fetched;
    }
}