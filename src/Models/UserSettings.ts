export interface IUserSettings {
    id: string;
    flags: number;
    lb_view: number;
    lb_default: number;
}

export default class UserSettings implements IUserSettings {
    id: string;
    flags: number;
    lb_view: number;
    lb_default: number;

    constructor(data: IUserSettings) {
        this.id = data.id;
        this.flags = data.flags;
        this.lb_view = data.lb_view;
        this.lb_default = data.lb_default;
    }
}