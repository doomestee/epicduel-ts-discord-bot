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
}