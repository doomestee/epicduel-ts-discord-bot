import type User from "../game/sfs/data/User.js";

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

let prefixStat = (type: "wpn" | "gun" | "aux" | "armor", obj: IEntityStat, isDb=true) => {
    // eg: armorSuppAdd if isDb false, otherwise armorsup

    // if (isDb) {
        return {
            str: obj[`${type}str`] || null,
            dex: obj[`${type}dex`] || null,
            tech: obj[`${type}tech`] || null,
            supp: obj[`${type}supp`] || null,
        }
    // } else return {
        
    // }

}

export interface IStat<T extends number | null = number | null> {
    str: T;
    dex: T;
    tech: T;
    supp: T;
}

export interface IWeapon<T extends number | null = number | null> {
    id: T;
    dmg: number | null;
    stat: IStat;
}

export interface IArmor {
    id: number;
    stat: IStat;
    bonus: { def: number | null, res: number | null };
}

export class Entity {
    id: number;
    last_fetched: Date;
    hp: number;
    mp: number;
    exp: number | null;
    lvl: number | null;
    type: number;
    classy: { id: number; };
    bot: { id: number | null; };
    gun: IWeapon;//{ id: number | null; dmg: number | null; stat: any; };
    aux: IWeapon;//{ id: number | null; dmg: number | null; stat: any; };
    wpn: IWeapon<number | null>;//{ id: number | null; dmg: number | null; stat: any; };
    armor: IArmor;//{ id: number | null; stat: any; bonus: { def: number | null; res: number | null; }; };
    stat: IStat<number>;//{ str: number; dex: number; tech: number; supp: number; };
    legendary: string | null;

    constructor(entity: IEntityStat) {
        this.id = entity.id;
        this.last_fetched = entity.last_fetched;
        this.hp = entity.hp;
        this.mp = entity.mp;

        this.exp = entity.exp;
        this.lvl = entity.lvl;

        this.type = entity.type;

        this.classy = {
            id: entity.classid
        };

        this.bot = {
            id: entity.botid
        };

        this.gun = {
            id: (entity.gunid && entity.gunid < 0 || !entity.gunid) ? null : entity.gunid, dmg: entity.gundmg || null,
            stat: prefixStat("gun", entity, true)
        };

        this.aux = {
            id: (entity.auxid && (entity.auxid < 0 || !entity.auxid)) ? null : entity.auxid, dmg: entity.auxdmg || null,
            stat: prefixStat("aux", entity, true)
        };

        this.wpn = {
            id: (entity.wpnid && (entity.wpnid < 0 || !entity.wpnid)) ? null : entity.wpnid, dmg: entity.wpndmg || null,
            stat: prefixStat("wpn", entity, true)
        };

        this.armor = {
            id: (entity.armorid && (entity.armorid < 0 || !entity.armorid)) ? -1 : entity.armorid,
            stat: prefixStat("armor", entity, true),
            bonus: {
                def: entity.armordef,
                res: entity.armorres,
            }
        };

        this.stat = {
            str: entity.str,
            dex: entity.dex,
            tech: entity.tech,
            supp: entity.supp
        };

        this.legendary = entity.legendary;
    }

    static construct(userVars: User) : Entity {
        let legendary = "";

        if (userVars.isLegendary) {
            for (let i = 0; i < 10; i++) {
                legendary += `${userVars.variables["legendCat" + i] || 0}|`
            }; legendary = legendary.slice(0, -1);
        }

        return new this({
            hp: userVars.charMaxHp,
            mp: userVars.charMaxMp,

            botid: userVars.iBot,

            classid: userVars.charClassId,

            str: userVars.charStr,
            dex: userVars.charDex,
            tech: userVars.charTech,
            supp: userVars.charSupp,

            gunid: userVars.iGun || null,
            gundmg: userVars.gunDmg,
            gunstr: userVars.gunStrAdd,
            gundex: userVars.gunDexAdd,
            guntech: userVars.gunTechAdd,
            gunsupp: userVars.gunSuppAdd,

            auxid: userVars.iAux || null,
            auxdmg: userVars.auxDmg,
            auxstr: userVars.auxStrAdd,
            auxdex: userVars.auxDexAdd,
            auxtech: userVars.auxTechAdd,
            auxsupp: userVars.auxSuppAdd,

            wpnid: userVars.iWpn || null,
            wpndmg: userVars.wpnDmg,
            wpnstr: userVars.wpnStrAdd,
            wpndex: userVars.wpnDexAdd,
            wpntech: userVars.wpnTechAdd,
            wpnsupp: userVars.wpnSuppAdd,

            armorid: userVars.charArm,
            armordef: userVars.armorDefense,
            armorres: userVars.armorResist,
            armorstr: userVars.armorStrAdd,
            armordex: userVars.armorDexAdd,
            armortech: userVars.armorTechAdd,
            armorsupp: userVars.armorSuppAdd,

            legendary,

            id: userVars.charId || userVars.npcId,
            type: userVars.charId === undefined ? (userVars.npcBoss ? 2 : 1) : 0,

            lvl: userVars.charLvl,
            exp: userVars.charExp,
            
            last_fetched: new Date()
        })
    }

    toJSON() {
        const { armor, aux, id, type, gun, hp, last_fetched, legendary, mp, wpn, stat, bot, classy, lvl, exp } = this;

        return {
            id, type,
            hp, mp,

            lvl, exp,

            classid: classy.id,

            botid: bot.id,

            str: stat.str,
            dex: stat.dex,
            tech: stat.tech,
            supp: stat.supp,

            gunid: gun.id,
            gundmg: gun.dmg,
            gunstr: gun.stat.str,
            gundex: gun.stat.dex,
            guntech: gun.stat.tech,
            gunsupp: gun.stat.supp,

            auxid: aux.id,
            auxdmg: aux.dmg,
            auxstr: aux.stat.str,
            auxdex: aux.stat.dex,
            auxtech: aux.stat.tech,
            auxsupp: aux.stat.supp,

            wpnid: wpn.id,
            wpndmg: wpn.dmg,
            wpnstr: wpn.stat.str,
            wpndex: wpn.stat.dex,
            wpntech: wpn.stat.tech,
            wpnsupp: wpn.stat.supp,

            armorid: armor.id,
            armordef: armor.bonus.def,
            armorres: armor.bonus.res,
            armorstr: armor.stat.str,
            armordex: armor.stat.dex,
            armortech: armor.stat.tech,
            armorsupp: armor.stat.supp,

            legendary, last_fetched
        };
    }
}