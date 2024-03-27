export interface IEntityStat {
    id: number;
    type: number;

    hp: number;
    mp: number;

    gunid: number | null;
    gundmg: number | null;
    gunstr: number | null;
    gundex: number | null;
    guntech: number | null;
    gunsupp: number | null;

    auxid: number | null;
    auxdmg: number | null;
    auxstr: number | null;
    auxdex: number | null;
    auxtech: number | null;
    auxsupp: number | null;

    wpnid: number | null;
    wpndmg: number | null;
    wpnstr: number | null;
    wpndex: number | null;
    wpntech: number | null;
    wpnsupp: number | null;

    armorid: number;
    armordef: number | null;
    armorres: number | null;
    armorstr: number | null;
    armordex: number | null;
    armortech: number | null;
    armorsupp: number | null;

    botid: number | null;

    legendary: string | null;

    last_fetched: Date;

    str: number;
    dex: number;
    tech: number;
    supp: number;

    classid: number;

    lvl: number | null;
    exp: number | null;
}

export default class EntityStat implements IEntityStat {
    id: number;
    type: number;

    hp: number;
    mp: number;

    gunid: number | null;
    gundmg: number | null;
    gunstr: number | null;
    gundex: number | null;
    guntech: number | null;
    gunsupp: number | null;

    auxid: number | null;
    auxdmg: number | null;
    auxstr: number | null;
    auxdex: number | null;
    auxtech: number | null;
    auxsupp: number | null;

    wpnid: number | null;
    wpndmg: number | null;
    wpnstr: number | null;
    wpndex: number | null;
    wpntech: number | null;
    wpnsupp: number | null;

    armorid: number;
    armordef: number | null;
    armorres: number | null;
    armorstr: number | null;
    armordex: number | null;
    armortech: number | null;
    armorsupp: number | null;

    botid: number | null;

    legendary: string | null;

    last_fetched: Date;

    str: number;
    dex: number;
    tech: number;
    supp: number;

    classid: number;

    lvl: number | null;
    exp: number | null;

    constructor(data: IEntityStat) {
        this.id = data.id;
        this.type = data.type;

        // fill in please
        this.hp = data.hp;
        this.mp = data.mp;

        this.gunid = data.gunid;
        this.gundmg = data.gundmg;
        this.gunstr = data.gunstr;
        this.gundex = data.gundex;
        this.guntech = data.guntech;
        this.gunsupp = data.gunsupp;

        this.auxid = data.auxid;
        this.auxdmg = data.auxdmg;
        this.auxstr = data.auxstr;
        this.auxdex = data.auxdex;
        this.auxtech = data.auxtech;
        this.auxsupp = data.auxsupp;
        
        this.wpnid = data.wpnid;
        this.wpndmg = data.wpndmg;
        this.wpnstr = data.wpnstr;
        this.wpndex = data.wpndex;
        this.wpntech = data.wpntech;
        this.wpnsupp = data.wpnsupp;

        this.armorid = data.armorid;
        this.armordef = data.armordef;
        this.armorres = data.armorres;
        this.armorstr = data.armorstr;
        this.armordex = data.armordex;
        this.armortech = data.armortech;
        this.armorsupp = data.armorsupp;

        this.botid = data.botid;

        this.legendary = data.legendary;

        this.last_fetched = data.last_fetched;

        this.str = data.str;
        this.dex = data.dex;
        this.tech = data.tech;
        this.supp = data.supp;

        this.classid = data.classid;

        this.lvl = data.lvl;
        this.exp = data.exp;
    }
}