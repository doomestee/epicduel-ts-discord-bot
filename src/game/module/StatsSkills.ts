import { getUserLevelByExp } from "../../util/Misc.js";
import Constants, { Prices } from "../Constants.js";
import Client from "../Proximus.js";
import BaseModule from "./Base.js";

export default class StatsSkills extends BaseModule {
    
    static divisorsResistance = [0.3,0.4,0.5,0.5];
    static divisorsDefense = [0.3,0.4,0.5,0.5];
    static divisorsBot = [0.4,0.5,0.6,0.6];
    static divisorsDamage = [0.46,0.58,0.65,0.85];
    static divisorsAux = [0.42,0.65,0.75,0.95];
    static divisorsGun = [0.42,0.75,0.75,1];

    static HP_MULTIPLIER= 12.5;
    static MP_MULTIPLIER= 12.5;
    static HP_LEVEL_SCALING= 20;
    static MP_LEVEL_SCALING= 50;
    
    static MIN_HP = 0;
    static MAX_HP = 600 + Math.floor(Constants.CHAR_MAX_LEVEL * 4 * this.HP_MULTIPLIER) + Math.floor(Constants.CHAR_MAX_LEVEL * this.HP_LEVEL_SCALING);
    
    static MIN_MP = 0;
    static MAX_MP = 600 + Math.floor(Constants.CHAR_MAX_LEVEL * 4 * this.MP_MULTIPLIER) + Math.floor(Constants.CHAR_MAX_LEVEL * this.MP_LEVEL_SCALING);
    
    static MIN_STR = 0;
    static MAX_STR = 190;
    static MIN_DEX = 0;
    static MAX_DEX = 190;
    static MIN_TECH = 0;
    static MAX_TECH = 190;        
    static MIN_SUPP = 0;
    static MAX_SUPP = 190;

    constructor(public client: Client) {
        super();
    }

    
    getTieredStatValue(statValue=1, divisors=StatsSkills.divisorsDamage) {
        let margin = 0;
        let statTiers = [55, 85, 100];
        let tiers = [0, 0, 0, 0];
        if (statValue > statTiers[2]) {
            margin = statValue - statTiers[2];
            tiers[3] = margin / divisors[3];
            statValue -= margin;
        }
        
        if (statValue > statTiers[1]) {
            margin = statValue - statTiers[1];
            tiers[2] = margin / divisors[2];
            statValue -= margin;
        }
        
        if (statValue > statTiers[0]) {
            margin = statValue - statTiers[0];
            tiers[1] = margin / divisors[1];
            statValue -= margin;
        }

        tiers[0] = statValue / divisors[0];

        return Math.floor(tiers[0] + tiers[1] + tiers[2] + tiers[3])
    }

    // populateUserRecord(record: any, userId: number) {
    //     let wats = [1, 2, "j", "n"];

    //     let losses = [0, 0, 0];
    //     let wins = {} as Record<string, number>;

    //     // if (!isNaN(record.w1) && record.w1 >= 0 && record.w1 <= 99999999) {
    //     //     wins.push(record)
    //     // }

    //     for (let wat of wats) {
    //         if (!isNaN(record['w' + wat]) && record["w" + wat] >= 0 && record["w" + wat] <= 99999999) {
    //             wins[wat] = record['w' + wat];
    //         }
    //     }

    //     let jugRecord = false;

    //     //if (userId)
    //     losses.push(parseInt(record.b1) - parseInt(record.w1));
    //     losses.push(parseInt(record.b2) - parseInt(record.w2));
    //     losses.push(parseInt(record.bj) - parseInt(record.wj));

    //     // let currRoom = this.client.smartFox.getActiveRoom();

    //     // if (currRoom != null) {
    //     //     let roomType = parseInt(currRoom.getVariable("type"));
    //     //     let roomIsGame = currRoom.isBattle;
    //     //     let battleCounts = false;

    //     //     if (this.client.battle.epbattle != null) {
    //     //         battleCounts = this.client.battle.params.counts;
    //     //         if (roomIsGame && !this.client.battleOver && battleCounts) {
    //     //             jugRecord = userId == this.client.battle.epbattle._jugUserId;
    //     //             if (this.client.battle.epbattle.getBasicBattleType() == 1 && losses[0] > 0) losses[0] -= 1;
    //     //             if (this.client.battle.epbattle.getBasicBattleType() == 2 && !jugRecord && losses[1] > 0) losses[1] -= 1;
    //     //             if (this.client.battle.epbattle.getBasicBattleType() == 1 && jugRecord && losses[2] > 0) losses[2] -= 1;
    //     //         }
    //     //     }
    //     // }

    //     if (!this.client.cache.records) this.client.cache.records = {};

    //     return this.client.cache.records[userId] = [Date.now(), [losses, wins]];
    // }

    /**
     * @param {string} charAttrib
     * @param {0|1} type If type 0, uses variables from getMyUser(). If type 1, uses from third parameter; obj.
     */
    getCharAttribValue(charAttrib: string, type: 0 | 1 = 1, obj: { hp: number, mp: number, dex: number, tech: number, supp: number, str: number }) {
        let myUser = () => { return this.client.getMyUserFr(); };

        switch(charAttrib) {
           case "charMaxHp": return (type === 1) ? obj.hp : myUser().charMaxHp;
           case "charMaxMp": return (type === 1) ? obj.mp : myUser().charMaxMp;
           case "charStr": return (type === 1) ? obj.str : myUser().charStr;
           case "charDex": return (type === 1) ? obj.dex : myUser().charDex;
           case "charTech": return (type === 1) ? obj.tech : myUser().charTech;
           case "charSupp": return (type === 1) ? obj.supp : myUser().charSupp;
           default: return 0;
        }
    }

    /**
     * @param {} charAttrib
     * @param {} obj
     * @returns 
     */
    getCharAttribPoints(charAttrib: "charMaxHp"|"charMaxMp"|"charStr"|"charDex"|"charTech"|"charSupp", obj: { hp: number, mp: number, dex: number, tech: number, supp: number, str: number }) {
        let classRecord = this.client.boxes.class.objMap.find(v => v.classId == this.client.getMyUserFr().charClassId);
        
        switch (charAttrib) {
            case "charMaxHp": return Math.ceil((obj.hp - classRecord.getMinHpByLevel(getUserLevelByExp(this.client.getMyUserFr().charExp))) / StatsSkills.HP_MULTIPLIER);
            case "charMaxMp": return Math.ceil((obj.mp - classRecord.getMinMpByLevel(getUserLevelByExp(this.client.getMyUserFr().charExp))) / StatsSkills.MP_MULTIPLIER);
            case "charStr": return obj.str - classRecord.classStr;
            case "charDex": return obj.str - classRecord.classDex;
            case "charTech": return obj.str - classRecord.classTech;
            case "charSupp": return obj.str - classRecord.classSupp;
        } return 0;
    }

    /**
     * @param {number} skillId
     * @param {[number, number][]|({id: number, lvl: number})[]} skills
     */
    getSkillLevelInSet(skillId: string, skills: [number, number][] | { id: number, lvl: number }[]) {
        for (let i = 0; i < skills.length; i++) {
            //@ts-ignore
            if (skillId == skills[i][0] || skillId == skills[i].id) return skills[i][1] || skills[i].lvl;
        } return 0;
    }

    // /**
    //  * @param {{ hp: number, mp: number, dex: number, tech: number, supp: number, str: number, skills: [number, number][]}} obj
    //  * @param {0|1|2} purchaseWith 0 for coupon, 1 for credits, 2 for coupon without check.
    //  * @returns 
    //  */
    // updateStatsSkills(obj={}, purchaseWith=0, savePrice=Prices.getRetrainPrice(this.client.getMyUser().charLvl), skipSkill=false) {
        // /**
        //  * NOT TO BE USED FOR SETTING, THIS IS JUST AN ALIAS FOR client.getmyuser
        //  */
        // const statsCharacter = this.client.getMyUser();

        // let usingCoupon = (purchaseWith == 2) ? 1 : 0;
        // if (purchaseWith === 0) { if (this.client.currency.skill_coupons < 1) return "need skill coupon!"; usingCoupon = 1; }
        // if (this.client.currency.credits < savePrice && usingCoupon == 0) return "low credits.";

        // let charClass = this.client.boxes.class.objMap.get(statsCharacter.charClassId);
        // let userLevel = this.client.getMyUser().charLvl;
        // let statPointsUsed = Math.ceil((obj.hp - charClass.getMinHpByLevel(userLevel)) / this.HP_MULTIPLIER) + Math.ceil((obj.mp - charClass.getMinMpByLevel(userLevel)) / this.MP_MULTIPLIER) + (obj.str + obj.dex + obj.tech + obj.supp) - (charClass.classStr + charClass.classDex + charClass.classTech + charClass.classSupp);
        // let expectedStatPoints = 4 * (getUserLevelByExp(statsCharacter.charExp) - 1);
        // let statPointsRemaining = expectedStatPoints - statPointsUsed;
        // let expLevel = getUserLevelByExp(statsCharacter.charExp);
        // let skillTree = this.client.boxes.skills.getAllSkillIdsByClass(statsCharacter.charClassId);
        // let skillPointsUsed = 0;
        
        // let _startingSkillIds = [];
        // let _startingSkillLvls = [];

        // for (let i = 0; i < skillTree.length; i++) {
        //     let [id, level] = [skillTree[0].skillId, this.getSkillLevelInSet(skillTree[0].skillId, obj.skills)];

        //     if (level > 0) {
        //         _startingSkillIds.push(id);
        //         _startingSkillLvls.push(level);
        //     }
        //     skillPointsUsed += level;
        // }

        // let skillPointsRemaining = expLevel + 2 - skillPointsUsed;

        // if (statPointsRemaining != 0 || (skillPointsRemaining != 0 && !skipSkill) || this.client.user._levelingUp) return ["use all points pls.", {charClass, statPointsUsed, expectedStatPoints, statPointsRemaining, expLevel, skillPointsRemaining, userLevel, skillPointsUsed, skipSkill }];

        // let currentSkillIds = [];
        // let currentSkillLvls = [];

        // let statRequired = 0;
        // let myStatValue = 0;
        // let energyCost = 0;
        // let charMaxMp = 0;

        // var statReqMet = true;
        // var energyCostMet = true;
        // var arePrereqsMet = true;
        
        // var matchingSkills = 0;
        // var prereqMet = 0;
        // var startSkillsMet = 0;

        // /**
        //  * @type {import("../record/skills/TreeRecord")}
        //  */
        // let skillTreeButton = null;
        // /**
        //  * @type {import("../../battle/SkillObject")}
        //  */
        // let skillObject = null;
        // /**
        //  * @type {[number, number]}
        //  */
        // let treeBtn = null;

        // for (skillTreeButton of skillTree) {
        //     treeBtn = obj.skills.find(v => v[0] === skillTreeButton.skillId);
        //     if (!treeBtn) continue;

        //     skillObject = this.client.manager.getSkillInfoById(parseInt(treeBtn[0]));

        //     if (treeBtn[1] > 0) {
        //         currentSkillIds.push(skillTreeButton.skillId);
        //         currentSkillLvls.push(treeBtn[1]);
        //         if (skillTreeButton.treeReqSkillId == 0) { prereqMet++; startSkillsMet++; }
        //         else {
        //             for (let skillTreeButtonReq of skillTree) {
        //                 let treeBtn2 = obj.skills.find(v => v[0] === skillTreeButtonReq.skillId);

        //                 if (!treeBtn2) continue;

        //                 if (skillTreeButtonReq.skillId == skillTreeButton.treeReqSkillId && treeBtn2[1] > 0) { prereqMet++; break; };
        //             }
        //         }

        //         if (prereqMet != currentSkillIds.length) break;

        //         myStatValue = this.getCharAttribValue(skillObject.cr.reqStat, 1, obj);
        //         statRequired = skillObject.cr.reqStatStepPerLevel > 0 || skillObject.cr.reqStatBase > 0 ? skillObject.tree.reqLevel + 12 + skillObject.cr.reqStatBase + skillObject.cr.reqStatStepPerLevel * treeBtn[1] : 0;

        //         if (myStatValue < statRequired) { statReqMet = false; break; }

        //         charMaxMp = this.getCharAttribValue("charMaxMp", 1, obj);
        //         energyCost = skillObject.cr.reqEnergy + skillObject.cr.reqEnergyStep * treeBtn[1];
                
        //         if (charMaxMp < energyCost) { energyCostMet = false; break; }

        //         for (let j = 0; j < _startingSkillIds.length; j++) {
        //             if (_startingSkillIds[j] == skillTreeButton.skillId && _startingSkillIds[j] == treeBtn[1]) {
        //                 matchingSkills = 1; break;//matchingSkills++; break;
        //             }
        //         }
        //     }
        // }

        // let fields = ["charMaxHp", "charMaxMp", "charStr", "charDex", "charTech", "charSupp"];
        // let mapped = fields.map(v => this.getCharAttribPoints(v, obj));

        // if (mapped.some(v => v < 0)) return ["DYN_stats_err_belowMin", { fields, mapped }];
        // if (prereqMet != currentSkillIds.length) return ["DYN_retrain_msg_prereqs", { name: skillObject.skill.skillName }];
        // if (statReqMet != true) return ["DYN_skills_err_lowStat", { level: treeBtn[1], name: skillObject.skill.skillName, statRequired, fieldthing: skillObject.cr.reqStat}];
        // if (energyCostMet != true) return ["DYN_skills_err_lowEnergy", { level: treeBtn[1], name: skillObject.skill.skillName, energyCost }];
        // if (this.client.user._forceRetrain == false && statsCharacter.charMaxHp == obj.hp && statsCharacter.charMaxMp == obj.mp && statsCharacter.charStr == obj.str && statsCharacter.charDex == obj.dex && statsCharacter.charTech == obj.tech && statsCharacter.charSupp == obj.supp && matchingSkills == currentSkillIds.length) return ["no change", [[this.client.user._forceRetrain, false], [statsCharacter.charMaxHp, obj.hp], [statsCharacter.charMaxMp, obj.mp], [statsCharacter.charStr, obj.str], [statsCharacter.charDex, obj.dex], [statsCharacter.charTech, obj.tech], [statsCharacter.charSupp, obj.supp], [matchingSkills, currentSkillIds.length]]]
        // if (startSkillsMet != 3 && !global.shutup) console.log("Every starting skill must be at least level 1!"); 
        // this.client.user._levelingUp = true;

        // this.client.smartFox.sendXtMessage("main", Requests.REQUEST_UPDATE_STATS_SKILLS, {
        //     hp: obj.hp,
        //     mp: obj.mp,
        //     dex: obj.dex,
        //     tech: obj.tech,
        //     supp: obj.supp,
        //     skillIds: currentSkillIds,
        //     skillLvls: currentSkillLvls,
        //     coupon: usingCoupon
        // }, 2, "json");

        // return { currentSkillIds, currentSkillLvls, usingCoupon };
    // }

//     populateSkillsForSelectedUser(skills=[]) {
// return;
        
//          var skillTreeButton:SkillTreeButton = null;
//          var statPointsUsed:int = 0;
//          var expectedStatPoints:int = 0;
//          var skillId:int = 0;
//          var skillLevel:int = 0;
//          var classId:int = this.statsCharacter.charClassId;
//          var userLevel:int = this.statsCharacter.charLvl;
//          var expLevel:int = EpicDuel.getUserLevelByExp(this.statsCharacter.charExp);
//          var charClass:ClassRecord = ClassBox.instance.getClassById(classId);
//          var skillTree:SkillTree = this._skillSet.getSkillTreeByClassId(classId);
//          skillTree.visible = true;
//          var skillPointsUsed:int = 0;
//          this._startingSkillIds = [];
//          this._startingSkillLvls = [];
//          var allBtns:Vector.<SkillTreeButton> = skillTree.getBtns();
//          for each(skillTreeButton in allBtns)
//          {
//             skillId = skillTreeButton.skill.skillId;
//             skillLevel = this.getSkillLevelInSet(skillId,skills);
//             if(skillLevel > 0)
//             {
//                this._startingSkillIds.push(skillId);
//                this._startingSkillLvls.push(skillLevel);
//             }
//             skillPointsUsed += skillLevel;
//             skillTreeButton.setLevel(skillLevel);
//          }
//          this.resetStats();
//          statPointsUsed = Math.ceil((this.statsCharacter.charMaxHp - charClass.getMinHpByLevel(userLevel)) / this.HP_MULTIPLIER) + Math.ceil((this.statsCharacter.charMaxMp - charClass.getMinMpByLevel(userLevel)) / this.MP_MULTIPLIER) + (this.statsCharacter.charStr + this.statsCharacter.charDex + this.statsCharacter.charTech + this.statsCharacter.charSupp) - (charClass.classStr + charClass.classDex + charClass.classTech + charClass.classSupp);
//          expectedStatPoints = 4 * (expLevel - 1);
//          statPointsRemaining = expectedStatPoints - statPointsUsed;
//          skillPointsRemaining = expLevel + 2 - skillPointsUsed;
//          this.updateStatButtons();
//          if(this.ui.level_up_loader.visible)
//          {
//             this.ui.level_up_loader.coupon_btn.removeEventListener(MouseEvent.CLICK,this.updateStatsSkillsHandler);
//             this.ui.level_up_loader.coupon_btn.label = GlobalLanguage.loadString("DYN_btn_save") + " (1x " + Currency.SKILL_COUPON_NAME + ")";
//             if(statPointsRemaining == 0 && CurrentUser.instance._forceRetrain == false)
//             {
//                this.ui.level_up_loader.level_up_btn.label = GlobalLanguage.loadString("DYN_btn_save") + " (" + Prices.getRetrainPrice() + " Credits)";
//                this._savePrice = Prices.getRetrainPrice();
//                this.ui.level_up_loader.coupon_btn.addEventListener(MouseEvent.CLICK,this.updateStatsSkillsHandler,false,0,true);
//                this.darkenButton(this.ui.level_up_loader.coupon_btn,true);
//             }
//             else if(userLevel == expLevel || CurrentUser.instance._forceRetrain == true)
//             {
//                this.ui.level_up_loader.level_up_btn.label = GlobalLanguage.loadString("DYN_btn_save");
//                this.darkenButton(this.ui.level_up_loader.coupon_btn);
//                this._savePrice = 0;
//             }
//             else
//             {
//                this.ui.level_up_loader.level_up_btn.label = GlobalLanguage.loadString("DYN_level_btn_levelUp");
//                this.darkenButton(this.ui.level_up_loader.coupon_btn);
//                this._savePrice = 0;
//             }
//          }
//          this.updateSkillTreeButtons();
//          ClearBlockModule.instance.closeModule();
//       }
}