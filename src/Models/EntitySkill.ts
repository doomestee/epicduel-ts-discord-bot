export interface IEntitySkill {
    id: number;
    type: number;
    skills: string;
    last_fetched: Date;
}

export default class EntitySkill implements IEntitySkill {
    id: number;
    type: number;
    skills: string;
    last_fetched: Date;

    constructor(data: IEntitySkill) {
        this.id = data.id;
        this.type = data.type;
        this.skills = data.skills;
        this.last_fetched = data.last_fetched;
    }
}