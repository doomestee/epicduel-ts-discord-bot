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
import { BasicSkillObject, CoreSkillObject, Mode, TreeSkillObject } from "../record/SkillObject.js";

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

    recordById(type: "all", id: number) : AllRecord | undefined;
    recordById(type: "active", id: number) : ActiveRecord | undefined;
    recordById(type: "activeMiscRules", id: number) : ActiveMiscRulesRecord | undefined;
    recordById(type: "activeAttackRules", id: number) : ActiveAttackRulesRecord | undefined;
    recordById(type: "activeTargetRules", id: number) : ActiveTargetRulesRecord | undefined;
    recordById(type: "passive", id: number) : PassiveRecord | undefined;
    recordById(type: "passiveMiscRules", id: number) : PassiveMiscRulesRecord | undefined;
    recordById(type: "passiveStatRules", id: number) : PassiveStatRulesRecord | undefined;
    recordById(type: "improveRules", id: number) : ImproveRulesRecord | undefined;
    recordById(type: "clientRequirements", id: number) : ClientRequirementsRecord | undefined;
    recordById(type: "core", id: number) : CoreRecord | undefined;
    recordById(type: Exclude<SkillTypes, "tree">, id: number) {
        let identifier = 'skillId';

        if (type === "activeMiscRules" || type === "passiveMiscRules") identifier = "miscRulesId";
        if (type === "activeAttackRules") identifier = "attackRulesId";
        if (type === "activeTargetRules") identifier = "targetRulesId";
        if (type === "passiveStatRules") identifier = "statRulesId";
        if (type === "core") identifier = "coreId";

        return this.objMap[type]?.get(id);
    }

    static recordById(type: "all", id: number) : AllRecord | undefined;
    static recordById(type: "active", id: number) : ActiveRecord | undefined;
    static recordById(type: "activeMiscRules", id: number) : ActiveMiscRulesRecord | undefined;
    static recordById(type: "activeAttackRules", id: number) : ActiveAttackRulesRecord | undefined;
    static recordById(type: "activeTargetRules", id: number) : ActiveTargetRulesRecord | undefined;
    static recordById(type: "passive", id: number) : PassiveRecord | undefined;
    static recordById(type: "passiveMiscRules", id: number) : PassiveMiscRulesRecord | undefined;
    static recordById(type: "passiveStatRules", id: number) : PassiveStatRulesRecord | undefined;
    static recordById(type: "improveRules", id: number) : ImproveRulesRecord | undefined;
    static recordById(type: "clientRequirements", id: number) : ClientRequirementsRecord | undefined;
    static recordById(type: "core", id: number) : CoreRecord | undefined;
    static recordById(type: Exclude<SkillTypes, "tree">, id: number) {
        let identifier = 'skillId';

        if (type === "activeMiscRules" || type === "passiveMiscRules") identifier = "miscRulesId";
        if (type === "activeAttackRules") identifier = "attackRulesId";
        if (type === "activeTargetRules") identifier = "targetRulesId";
        if (type === "passiveStatRules") identifier = "statRulesId";
        if (type === "core") identifier = "coreId";

        return this.objMap[type]?.get(id);
    }

    recordBySkillId(type: "all", skillId: number) : AllRecord | null;
    recordBySkillId(type: "active", skillId: number) : ActiveRecord | null;
    recordBySkillId(type: "passive", skillId: number) : PassiveRecord | null;
    recordBySkillId(type: "core", skillId: number) : CoreRecord | null;
    recordBySkillId(type: "tree", skillId: number) : TreeRecord | null;
    recordBySkillId(type: "all" | "active" | "passive" | "core" | "tree", skillId: number){
        const list = type === "tree" ? this.objList[type] : this.objMap[type].toArray();

        for (let i = 0; i < list.length; i++) {
            if (list[i]["skillId"] == skillId) {
                return list[i];
            }
        }
        
        return null;
    }

    static recordBySkillId(type: "all", skillId: number) : AllRecord | null;
    static recordBySkillId(type: "active", skillId: number) : ActiveRecord | null;
    static recordBySkillId(type: "passive", skillId: number) : PassiveRecord | null;
    static recordBySkillId(type: "core", skillId: number) : CoreRecord | null;
    static recordBySkillId(type: "tree", skillId: number) : TreeRecord | null;
    static recordBySkillId(type: "all" | "active" | "passive" | "core" | "tree", skillId: number) {
        const list = type === "tree" ? this.objList[type] : this.objMap[type].toArray();

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

    /**
     * @param id MUST BE SKILL ID
     */
    static getSkillInfoById(id: number) {
        let mode = Mode.CORE;
        let treeC = this.recordBySkillId("tree", id);
        
        if ([50, 691, 51, 52].some(v => v === id)) mode = Mode.BASIC;
        else if (treeC) mode = Mode.TREE;

        if (mode === Mode.CORE) {
            const core = this.recordBySkillId("core", id);

            if (core) return new CoreSkillObject(core.coreId, mode, 1, this);
            else return null;//throw Error("Unknown skill info.");

            // id = this.client.boxes.skills.recordBySkillId("core", id);

            // if (id === null) return null;
            // id = id.coreId;
        } else if (mode === Mode.TREE) {
            return treeC ? new TreeSkillObject(treeC, mode, 1, this) : null;
        } else if (mode === Mode.BASIC) return new BasicSkillObject(id, mode, 1, this);
        else return null;
        // return new SkillObject(id, mode, 1, this.client.boxes.skills);
    }
}