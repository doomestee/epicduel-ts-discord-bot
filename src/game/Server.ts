export default class Server {
    ip: string;
    port: number;
    name: string;
    userCount: [number, number];
    initialised: Date;
    online: boolean;

    constructor(obj: any) {
        this.ip = obj.ip;
        this.port = obj.port;
        this.name = obj.name;
        this.userCount = obj.userCount || [0, 0];
        this.initialised = obj.initialised || new Date();// || Date.now();
        this.online = obj.online || false;
    }
}