import { Collection } from "oceanic.js";
import AllRecord from "../record/skills/AllRecord.js";
import ActiveRecord from "../record/skills/ActiveRecord.js";
import ActiveAttackRulesRecord from "../record/skills/ActiveAttackRulesRecord.js";
import ActiveMiscRulesRecord from "../record/skills/ActiveMiscRulesRecord.js";
import ActiveTargetRulesRecord from "../record/skills/ActiveTargetRulesRecord.js";
import PassiveRecord from "../record/skills/PassiveRecord.js";
import PassiveMiscRulesRecord from "../record/skills/PassiveMiscRulesRecord.js";
import PassiveStatRulesRecord from "../record/skills/PassiveStatRulesRecord.js";
import ImproveRulesRecord from "../record/skills/ImproveRulesRecord.js";
import ClientRequirementsRecord from "../record/skills/ClientRequirementsRecord.js";
import TreeRecord from "../record/skills/TreeRecord.js";
import CoreRecord from "../record/skills/CoreRecord.js";

const objMap = {
    all: new Collection<number, AllRecord>(),

    active: new Collection<number, ActiveRecord>(),
    activeAttackRules: new Collection<number, ActiveAttackRulesRecord>(),
    activeMiscRules: new Collection<number, ActiveMiscRulesRecord>(),
    activeTargetRules: new Collection<number, ActiveTargetRulesRecord>(),

    passive: new Collection<number, PassiveRecord>(),
    passiveMiscRules: new Collection<number, PassiveMiscRulesRecord>(),
    passiveStatRules: new Collection<number, PassiveStatRulesRecord>(),

    improveRules: new Collection<number, ImproveRulesRecord>(),
    clientRequirements: new Collection<number, ClientRequirementsRecord>(),

    // /**
    //  * Tree records don't have their own id, so it'll be:
    //  * 
    //  * ```classId + "-" + treeRow + "-" + treeColumn``` as string id
    //  * @type {Collection<string, TreeRecord>}
    //  */
    // tree: new Collection<string, TreeRecord>(),

    core: new Collection<number, CoreRecord>(),
};// satisfies { [x in SkillTypes]: Collection<any, any> } ;

const objList = {
    tree: [] as TreeRecord[]
};

export type SkillTypes = "all"|"active"|"activeAttackRules"|"activeMiscRules"|"activeTargetRules"|"improveRules"|"clientRequirements"|"passive"|"passiveMiscRules"|"passiveStatRules"|"tree"|"core";

export default class SkillsSMBox {
    ready = {
        all: false,

        active: false,
        activeAttackRules: false,
        activeMiscRules: false,
        activeTargetRules: false,

        passive: false,
        passiveMiscRules: false,
        passiveStatRules: false,

        improveRules: false,
        clientRequirements: false,

        tree: false,

        core: false
    } satisfies { [x in SkillTypes]: boolean } as { [x in SkillTypes]: boolean };

    protected rawData = {
        all: null as unknown as string[],

        active: null as unknown as string[],
        activeAttackRules: null as unknown as string[],
        activeMiscRules: null as unknown as string[],
        activeTargetRules: null as unknown as string[],

        passive: null as unknown as string[],
        passiveMiscRules: null as unknown as string[],
        passiveStatRules: null as unknown as string[],

        improveRules: null as unknown as string[],
        clientRequirements: null as unknown as string[],

        tree: null as unknown as string[],

        core: null as unknown as string[]
    } satisfies { [x in SkillTypes]: string[] };

    templates = {
        all: AllRecord.templates,
        
        active: ActiveRecord.templates,
        activeAttackRules: ActiveAttackRulesRecord.templates,
        activeMiscRules: ActiveMiscRulesRecord.templates,
        activeTargetRules: ActiveTargetRulesRecord.templates,
        
        passive: PassiveRecord.templates,
        passiveMiscRules: PassiveMiscRulesRecord.templates,
        passiveStatRules: PassiveStatRulesRecord.templates,
        
        improveRules: ImproveRulesRecord.templates,
        clientRequirements: ClientRequirementsRecord.templates,
        
        tree: TreeRecord.templates,

        core: CoreRecord.templates
    }

    static DAMAGE_TYPE_NONE = 0;
    static DAMAGE_TYPE_FORCE_PHYSICAL = 1;
    static DAMAGE_TYPE_FORCE_ENERGY = 2;
    static DAMAGE_TYPE_OF_PRIMARY_WEAPON = 3;
    static DAMAGE_TYPE_OF_SIDEARM = 4;
    static DAMAGE_TYPE_OF_AUXILIARY = 5;
    static DAMAGE_TYPE_REDUCES_ENERGY: 10;

    static CORE_TYPE_PASSIVE = 0;
    static CORE_TYPE_ACTIVE = 1;
    static CORE_SOURCE_PRIMARY = 0;
    static CORE_SOURCE_GUN = 1;
    static CORE_SOURCE_AUX = 2;
    static CORE_SOURCE_ARMOR = 3;
    static CORE_SOURCE_ROBOT_ATTACK = 4;
    static CORE_SOURCE_ROBOT_SPECIAL: 5;

    get objMap() { return objMap };
    static get objMap() { return objMap };

    get objList() { return objList };
    static get objList() { return objList };

    populate(type: SkillTypes, list: string[]) {
        let i = 0;
        //TODO: clean this fucking shit
        switch (type) {
            case "all": case "active": case "passive": case "activeAttackRules": case "activeMiscRules": case "activeTargetRules": case "clientRequirements": case "improveRules": case "passiveMiscRules": case "passiveStatRules": case "core":
                // this.objList[type] = [];
                this.objMap[type].clear();
                this.rawData[type] = list;

                while (i < (list.length / this.templates[type].length)) {
                    let y = 0; let obj = {} as any; let id = -1;

                    while (y < (this.templates[type].length)) {
                        obj[this.templates[type][y]] = list[y + i * this.templates[type].length];

                        if (y === 0) id = parseInt(obj[this.templates[type][y]]);

                        y++;
                    }

                    //@ts-expect-error
                    let rec = new (this.classify(type))(obj);

                    // if (type === "tree") id = rec.classId + "-" + rec.treeRow + "-" + rec.treeColumn;

                    // this.objList[type].push(rec);
                    //@ts-expect-error
                    this.objMap[type].set(id, rec);
                    i++;
                }

                this.ready[type] = true;

                return true;
            break;
            case "tree":
                this.objList[type] = [];
                this.rawData[type] = list;

                while (i < (list.length / this.templates[type].length)) {
                    let y = 0; let obj = {} as any;

                    while (y < (this.templates[type].length)) {
                        obj[this.templates[type][y]] = list[y + y * this.templates[type].length];
                        y++;
                    }

                    let rec = new (this.classify(type))(obj);

                    // if (type === "tree") id = rec.classId + "-" + rec.treeRow + "-" + rec.treeColumn;

                    this.objList[type].push(rec);
                    // this.objMap[type].set(id, rec);
                    i++;
                }

                this.ready[type] = true;

                return true;
                break;
            default:
                throw Error ("Unknown type: " + type);
        }
    }

    classify(type: "all") : typeof AllRecord;
    classify(type: "active") : typeof ActiveRecord;
    classify(type: "activeMiscRules") : typeof ActiveMiscRulesRecord;
    classify(type: "activeAttackRules") : typeof ActiveAttackRulesRecord;
    classify(type: "activeTargetRules") : typeof ActiveTargetRulesRecord;
    classify(type: "passive") : typeof PassiveRecord;
    classify(type: "passiveMiscRules") : typeof PassiveMiscRulesRecord;
    classify(type: "passiveStatRules") : typeof PassiveStatRulesRecord;
    classify(type: "improveRules") : typeof ImproveRulesRecord;
    classify(type: "clientRequirements") : typeof ClientRequirementsRecord;
    classify(type: "tree") : typeof TreeRecord;
    classify(type: "core") : typeof CoreRecord;
    classify(type: SkillTypes) {
        switch (type) {
            case "all": return AllRecord;
            case "active": return ActiveRecord;
            case "activeMiscRules": return ActiveMiscRulesRecord;
            case "activeAttackRules": return ActiveAttackRulesRecord;
            case "activeTargetRules": return ActiveTargetRulesRecord;
            case "passive": return PassiveRecord;
            case "passiveMiscRules": return PassiveMiscRulesRecord;
            case "passiveStatRules": return PassiveStatRulesRecord;
            case "improveRules": return ImproveRulesRecord;
            case "clientRequirements": return ClientRequirementsRecord;
            case "tree": return TreeRecord;
            case "core": return CoreRecord;
        }
    }

    recordById(type: "all", id: number) : AllRecord;
    recordById(type: "active", id: number) : ActiveRecord;
    recordById(type: "activeMiscRules", id: number) : ActiveMiscRulesRecord;
    recordById(type: "activeAttackRules", id: number) : ActiveAttackRulesRecord;
    recordById(type: "activeTargetRules", id: number) : ActiveTargetRulesRecord;
    recordById(type: "passive", id: number) : PassiveRecord;
    recordById(type: "passiveMiscRules", id: number) : PassiveMiscRulesRecord;
    recordById(type: "passiveStatRules", id: number) : PassiveStatRulesRecord;
    recordById(type: "improveRules", id: number) : ImproveRulesRecord;
    recordById(type: "clientRequirements", id: number) : ClientRequirementsRecord;
    recordById(type: "core", id: number) : CoreRecord;
    recordById(type: Exclude<SkillTypes, "tree">, id: number) {
        let identifier = 'skillId';

        if (type === "activeMiscRules" || type === "passiveMiscRules") identifier = "miscRulesId";
        if (type === "activeAttackRules") identifier = "attackRulesId";
        if (type === "activeTargetRules") identifier = "targetRulesId";
        if (type === "passiveStatRules") identifier = "statRulesId";
        if (type === "core") identifier = "coreId";

        return this.objMap[type]?.get(id) ?? null;
    }

    static recordById(type: "all", id: number) : AllRecord;
    static recordById(type: "active", id: number) : ActiveRecord;
    static recordById(type: "activeMiscRules", id: number) : ActiveMiscRulesRecord;
    static recordById(type: "activeAttackRules", id: number) : ActiveAttackRulesRecord;
    static recordById(type: "activeTargetRules", id: number) : ActiveTargetRulesRecord;
    static recordById(type: "passive", id: number) : PassiveRecord;
    static recordById(type: "passiveMiscRules", id: number) : PassiveMiscRulesRecord;
    static recordById(type: "passiveStatRules", id: number) : PassiveStatRulesRecord;
    static recordById(type: "improveRules", id: number) : ImproveRulesRecord;
    static recordById(type: "clientRequirements", id: number) : ClientRequirementsRecord;
    static recordById(type: "core", id: number) : CoreRecord;
    static recordById(type: Exclude<SkillTypes, "tree">, id: number) {
        let identifier = 'skillId';

        if (type === "activeMiscRules" || type === "passiveMiscRules") identifier = "miscRulesId";
        if (type === "activeAttackRules") identifier = "attackRulesId";
        if (type === "activeTargetRules") identifier = "targetRulesId";
        if (type === "passiveStatRules") identifier = "statRulesId";
        if (type === "core") identifier = "coreId";

        return this.objMap[type]?.get(id) ?? null;
    }

    recordBySkillId(type: "all", skillId: number) : AllRecord;
    recordBySkillId(type: "active", skillId: number) : ActiveRecord;
    recordBySkillId(type: "passive", skillId: number) : PassiveRecord;
    recordBySkillId(type: "core", skillId: number) : CoreRecord;
    recordBySkillId(type: "all" | "active" | "passive" | "core", skillId: number) {
        const list = this.objMap[type].toArray();

        for (let i = 0; i < list.length; i++) {
            if (list[i]["skillId"] == skillId) {
                return list[i];
            }
        }
        
        return null;
    }

    static recordBySkillId(type: "all", skillId: number) : AllRecord;
    static recordBySkillId(type: "active", skillId: number) : ActiveRecord;
    static recordBySkillId(type: "passive", skillId: number) : PassiveRecord;
    static recordBySkillId(type: "core", skillId: number) : CoreRecord;
    static recordBySkillId(type: "all" | "active" | "passive" | "core", skillId: number) {
        const list = this.objMap[type].toArray();

        for (let i = 0; i < list.length; i++) {
            if (list[i]["skillId"] == skillId) {
                return list[i];
            }
        }
        
        return null;
    }

    getAllSkillIdsByClass(classId: number | number) : TreeRecord[] {
        const result = [];

        for (let i = 0, len = this.objList.tree.length; i < len; i++) {
            if (this.objList.tree[i].classId == classId) result.push(this.objList.tree[i]);
        }

        return result;
    }

    static getAllSkillIdsByClass(classId: number | number) : TreeRecord[] {
        const result = [];

        for (let i = 0, len = this.objList.tree.length; i < len; i++) {
            if (this.objList.tree[i].classId == classId) result.push(this.objList.tree[i]);
        }

        return result;
    }
}