import { Gift } from "../game/module/Advent.js";

export interface IDBGift {
    /**
     * ID of gift (in database)
     */
    id: number;

    char_name: string;
    char_id: number | null;

    count_room: number;
    count_total: number;
    count_combo: number;

    fire_tier: 0|1|2|3|4|5|6|7;

    global: boolean;

    time: Date;
}

export default class DBGift implements IDBGift {
    id: number;

    char_name: string;
    char_id: number | null;

    count_room: number;
    count_total: number;
    count_combo: number;

    fire_tier: 0|1|2|3|4|5|6|7;

    global: boolean;

    time: Date;

    constructor(data: IDBGift) {
        this.id = data.id;

        this.char_name = data.char_name;
        this.char_id = data.char_id;
    
        this.count_room = data.count_room;
        this.count_total = data.count_total;
        this.count_combo = data.count_combo;
    
        this.fire_tier = data.fire_tier;
    
        this.global = data.global;
    
        this.time = data.time;
    }

    static toDB(data: Gift, charId?: number) : InsertableDBGift {
        const obj:InsertableDBGift = {
            char_name: data.name,
            char_id: null,
        
            count_room: data.count.room,
            count_total: data.count.total,
            count_combo: data.count.combo,
        
            fire_tier: data.onFireTier as 0,
        
            global: data.isGlobal,
        
            time: new Date(data.time),
        };

        if (typeof charId === "number") obj["char_id"] = charId;
        
        return obj;
    }
}

export type InsertableDBGift = Omit<IDBGift, "id"|"char_id"> & Record<"char_id", number|undefined|null>;