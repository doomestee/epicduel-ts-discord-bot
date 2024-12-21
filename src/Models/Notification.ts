export interface INotification {
    id: number;

    type: number;

    guild_id: string;
    channel_id: string;
    thread_id: null;
    creator_id: string;

    message: string | null;
}

export default class Notification implements INotification {
    id: number;

    /**
     * 1 for Exile Rally, 2 for Legion Rally, 3 for Server Updates, 4 for Restock, 5 for New Daily Missions.
     */
    type: number;

    guild_id: string;
    channel_id: string;
    thread_id: null;
    creator_id: string;

    message: string | null;

    constructor(data: INotification) {
        this.id = data.id;

        this.type = data.type;

        this.guild_id = data.guild_id;
        this.channel_id = data.channel_id;
        this.thread_id = data.thread_id;
        this.creator_id = data.creator_id;

        this.message = data.message;
    }

    static readonly TYPE_RALLY_EXILE = 1;
    static readonly TYPE_RALLY_LEGION = 2;
    static readonly TYPE_GAME_UPDATE = 3;
    static readonly TYPE_GAME_RESTOCK = 4;
    static readonly TYPE_MISSION_DAILY = 5;
}