// export type AllRecord = {
//     skillId: number;
//     skillName: string;
//     skillDesc: string;
//     skillLink: string;
//     skillUnit: string;
//     skillPassive: boolean;
//     skillImproves: boolean;
// }

// export type ActiveRecord = {
//     skillId: number,
//     runToTargetFirst: number,
//     playLabel: string,
//     senderEffectLink: string,
//     targetEffectLink: string,
//     targetEffectLink2: string,
//     targetHitLink: string,
//     createPassive: number,
//     passiveValueSource: number,
//     attackRulesId: number,
//     hpMpRulesId: number,
//     targetRulesId: number,
//     miscRulesId: number,
//     coolDown: number,
//     coolDownSkillLinkId: number,
//     warmUp: number,
//     useLimit: number,
//     maxTargets: number,
//     isGrenade: number,
//     damagePercent: number
// }


// export type activeAttackRulesRecord = {
//     attackRulesId: number,
//     damageTypeCode: number
// }

// export type activeMiscRulesRecord = {
//     miscRulesId: number,
//     disableRandomTargetAction: number,
//     forceRandomTargetActionIntoCoolDown: number,
//     disableTargetGunAux: number,
//     disableSenderGun: number,
//     disableSenderAux: number,
//     disableTargetArmor: number,
//     convertPrimaryToFish: number,
//     cleanseDebuffs: number,
//     diminishBuffs: number,
//     removesPoison: number,
//     decreaseCoreQty: number
// }

// export type activeTargetRulesRecord = {
//     targetRulesId: number,
//     targetCode: number,
//     reqLessThanFullHealth: number,
//     reqLessThanFullEnergy: number,
//     reqLessThanFullHealthOrEnergy: number,
//     reqLessThanFullRage: number,
//     reqAtLeast1Buff: number,
//     reqAtLeast1Debuff: number,
//     reqGunOrAux: number,
//     reqSomeHealth: number,
//     reqSomeEnergy: number,
//     reqTargets: number,
//     reqRealPlayers: number
// }

// export type passiveRecord = {
//     skillId: number,
//     passiveRestrictGroupId: number,
//     passiveLink: string,
//     displayOnChar: number,
//     displayInStats: number,
//     isDebuff: number,
//     duration: number,
//     rateRulesId: number,
//     statRulesId: number,
//     defendRulesId: number,
//     turnRulesId: number,
//     miscRulesId: number,
//     initialize: number
// }

// export type passiveMiscRulesRecord = {
//     miscRulesId: number,
//     gunSpreadfire: number,
//     auxSpreadfire: number,
//     scaleTargetByPercent: number,
//     reducedByCleanse: number,
//     reducedByDiminish: number,
//     forceStrike: number,
//     disableMelee: number,
//     regionInfluenceBonus: null,
//     decreaseQtyCode: number,
//     activeBelowHealthPercent: number,
//     increaseMedicByPercent: number,
//     untargetable: number
// }

// export type passiveStatRulesRecord = {
//     statRulesId: number,
//     addSvDmgVsFvNpcId: number,
//     addSvDmgToFvSkillId: number,
//     chgSidearmDmgBySvPercent: number,
//     chgResistanceByFvPercentOfSv: number,
//     chgDefenseByFvPercentOfSv: number,
//     chgDefenseVsNpcId: number,
//     chgDefenseVsNpcIdByFv: number,
//     chgStrengthBySv: number,
//     chgDexterityBySv: number,
//     chgTechnologyBySv: number,
//     chgSupportBySv: number,
//     chgSupportBySvPercent: number,
//     chgSupportBySvPercentOfTargetSupport: number,
//     chgHighStatBySvPercent: number,
//     chgCurrentDefenseBySvPercent: number,
//     chgCurrentResistancebySvPercent: number,
//     chgStrengthByFv: number,
//     chgDexterityByFv: number,
//     chgTechnologyByFv: number,
//     chgSupportByFv: number,
//     chgDefensesByLvlOverDuration: number,
//     chgDefenseByFvPercent: number,
//     chgResistByFvPercent: number,
//     addAllStatsByFvPercent: number
// }

// export type improveRulesRecord = {
//     skillId: number,
//     improveWithStat: string,
//     improveEveryXStat: number,
//     improveEveryXLevelsAbove20: number,
//     weakenEveryXLevelsBelow20: number
// }

// export type clientRequirementsRecord = {
//     skillId: number,
//     reqCriticalHealth: number,
//     reqEnergy: number,
//     reqEnergyStep: number,
//     reqStat: string,
//     reqStatBase: number,
//     reqStatStepPerLevel: number,
//     reqLessThanFullHealth: number,
//     reqLessThanFullEnergy: number,
//     reqEquipItemCat1: number,
//     reqEquipItemCat2: number,
//     reqHealth: number
// }

// export type treeRecord = {
//     classId: number,
//     skillId: number,
//     reqLevel: number,
//     treeRow: number,
//     treeColumn: number,
//     treeReqSkillId: number,
//     level1: number,
//     level2: number,
//     level3: number,
//     level4: number,
//     level5: number,
//     level6: number,
//     level7: number,
//     level8: number,
//     level9: number,
//     level10: number,
// }

// export type CoreRecord = {
//     coreId: number,
//     /**
//      * Passive or Active
//      */
//     coreType: 0 | 1,
//     coreItemCat: number,
//     skillId: number,
//     coreValue: number,
//     coreLevel: number
// }