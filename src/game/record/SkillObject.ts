import type SkillsSMBox from "../box/SkillsBox.js";
import ActiveAttackRulesRecord from "./skills/ActiveAttackRulesRecord.js";
import ActiveMiscRulesRecord from "./skills/ActiveMiscRulesRecord.js";
import ActiveRecord from "./skills/ActiveRecord.js";
import ActiveTargetRulesRecord from "./skills/ActiveTargetRulesRecord.js";
import AllRecord from "./skills/AllRecord.js";
import ClientRequirementsRecord from "./skills/ClientRequirementsRecord.js";
import CoreRecord from "./skills/CoreRecord.js";
import ImproveRulesRecord from "./skills/ImproveRulesRecord.js";
import PassiveMiscRulesRecord from "./skills/PassiveMiscRulesRecord.js";
import PassiveRecord from "./skills/PassiveRecord.js";
import TreeRecord from "./skills/TreeRecord.js";

export enum Mode {
    BASIC,
    TREE,
    CORE,
}

export default class SkillObject<T extends Mode = Mode> {
    static MODE_BASIC = 0;
    static MODE_TREE = 1;
    static MODE_CORE = 2;

    // skillId!: number;
    // #id!: number;

    skill: AllRecord;
    cr: ClientRequirementsRecord;
    ir: ImproveRulesRecord;

    passiveSkill?: PassiveRecord;
    passiveMiscRules?: PassiveMiscRulesRecord;

    activeSkill?: ActiveRecord;
    activeAttackRules?: ActiveAttackRulesRecord;
    activeMiscRules?: ActiveMiscRulesRecord;
    activeTargetRules?: ActiveTargetRulesRecord;

    constructor(public skillId: number, public mode: T, public level: number, skillsBox: typeof SkillsSMBox) {
        // if (mode === SkillObject.MODE_TREE) {
        //     // this.tree = skillsBox.recordBySkillId("tree", id);
        //     // this.skillId = 
        // }

        // this.skillId = skillId;


        /**
         * @type {import("../structures/record/skills/AllRecord")}
         */
        this.skill = skillsBox.recordById("all", skillId) as AllRecord;
        /**
         * @type {import("../structures/record/skills/ClientRequirementsRecord")}
         */
        this.cr = skillsBox.recordById("clientRequirements", skillId) as ClientRequirementsRecord;
        /**
         * @type {import("../structures/record/skills/ImproveRulesRecord")}
         */
        let ir = skillsBox.recordById("improveRules", skillId);

        if (ir == null) {
            this.ir = {
                "skillId": skillId,
                "improveWithStat": "",
                "improveEveryXStat": 0,
                "improveEveryXLevelsAbove20": 0,
                "weakenEveryXLevelsBelow20": 0,
            };
        } else this.ir = ir;

        if (this.skill.skillPassive) {
            /**
             * @type {import("../structures/record/skills/PassiveRecord")}
             */
            this.passiveSkill = skillsBox.recordById("passive", skillId) as PassiveRecord;
            /**
             * @type {import("../structures/record/skills/PassiveMiscRulesRecord")}
             */
            this.passiveMiscRules = skillsBox.recordById("passiveMiscRules", this.passiveSkill.miscRulesId) as PassiveMiscRulesRecord;

            if (this.passiveMiscRules == null) {
                this.passiveMiscRules = {
                    miscRulesId: 0,
                    gunSpreadfire: false,
                    auxSpreadfire: false,
                    scaleTargetByPercent: 0,
                    reducedByCleanse: false,
                    reducedByDiminish: false,
                    forceStrike: false,
                    disableMelee: false,
                    regionInfluenceBonus: 0,
                    decreaseQtyCode: 0,
                    activeBelowHealthPercent: 0,
                    increaseMedicByPercent: 0,
                    untargetable: false,
                    curedByMedic: false
                }
            }
        } else {
            /**
             * @type {import("../structures/record/skills/ActiveRecord")}
             */
            this.activeSkill = skillsBox.recordById("active", skillId) as ActiveRecord;
            /**
             * @type {import("../structures/record/skills/ActiveAttackRulesRecord")}
             */
            this.activeAttackRules = skillsBox.recordById("activeAttackRules", this.activeSkill.attackRulesId);
            /**
             * @type {import("../structures/record/skills/ActiveMiscRulesRecord")}
             */
            this.activeMiscRules = skillsBox.recordById("activeMiscRules", this.activeSkill.miscRulesId);
            /**
             * @type {import("../structures/record/skills/ActiveTargetRulesRecord")}
             */
            this.activeTargetRules = skillsBox.recordById("activeTargetRules", this.activeSkill.targetRulesId);
        }
    }

    isTree() : this is TreeSkillObject {
        return this.mode === Mode.TREE;
    }

    isCore() : this is CoreSkillObject {
        return this.mode === Mode.CORE;
    }

    get skillValue() : number {
        if (this.isTree()) {
            if (this.level === 0) return 0;

            return this.tree[`level${this.level as 1}`];//"level" + this.level];
        } if (this.isCore()) {
            return this.core.coreValue;
        } return 0;
    }

    get isAOE() {
        if (this.activeSkill == null) return false;

        return this.activeSkill.maxTargets == 2;
    }

    get createPassive() {
        if (this.activeSkill == null) return false;

        return this.activeSkill.createPassive;
    }

    get coolDown() {
        if (this.activeSkill == null) return 0;

        return this.activeSkill.coolDown;
    }

    get warmUp() {
        if (this.activeSkill == null) return 0;

        return this.activeSkill.warmUp;
    }

    toJSON() {
        const obj:any = {
            skill: this.skill,
            cr: this.cr,
            ir: this.ir,
        
            passiveSkill: this.passiveSkill,
            passiveMiscRules: this.passiveMiscRules,
        
            activeSkill: this.activeSkill,
            activeAttackRules: this.activeAttackRules,
            activeMiscRules: this.activeMiscRules,
            activeTargetRules: this.activeTargetRules,
        };

        if (this.isTree()) obj["tree"] = this.tree;
        if (this.isCore()) obj["core"] = this.core;

        return obj;
    }
}

export class TreeSkillObject extends SkillObject<Mode.TREE> {
    tree: TreeRecord;

    constructor(rec: TreeRecord, mode: number, level: number, skillsBox: typeof SkillsSMBox)
    constructor(id: number, mode: number, level: number, skillsBox: typeof SkillsSMBox)
    constructor(id: number | TreeRecord, mode: number, level: number, skillsBox: typeof SkillsSMBox) {
        const tree = id instanceof TreeRecord ? id : skillsBox.recordBySkillId("tree", id);

        super(tree?.skillId as number, mode, level, skillsBox);

        this.tree = tree as TreeRecord;
    }
}

export class CoreSkillObject extends SkillObject<Mode.CORE> {
    core: CoreRecord;

    constructor(id: number, mode: number, level: number, skillsBox: typeof SkillsSMBox) {
        const core = skillsBox.recordById("core", id) as CoreRecord;

        super(core.skillId, mode, level, skillsBox);

        this.core = core;
    }
}

export class BasicSkillObject extends SkillObject<Mode.BASIC> {
    constructor(id: number, mode: number, level: number, skillsBox: typeof SkillsSMBox) {
        // const tree = skillsBox.recordBySkillId("tree", id);

        super(id, mode, level, skillsBox);

        // this.tree = tree as TreeRecord;
    }
}