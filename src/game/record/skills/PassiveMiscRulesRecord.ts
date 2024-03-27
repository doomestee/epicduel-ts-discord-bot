export default class PassiveMiscRulesRecord {
    static FIELD_miscRulesId = "miscRulesId";
    static FIELD_gunSpreadfire = "gunSpreadfire";
    static FIELD_auxSpreadfire = "auxSpreadfire";
    static FIELD_scaleTargetByPercent = "scaleTargetByPercent";
    static FIELD_reducedByCleanse = "reducedByCleanse";
    static FIELD_reducedByDiminish = "reducedByDiminish";
    static FIELD_forceStrike = "forceStrike";
    static FIELD_disableMelee = "disableMelee";
    static FIELD_regionInfluenceBonus = "regionInfluenceBonus";
    static FIELD_decreaseQtyCode = "decreaseQtyCode";
    static FIELD_activeBelowHealthPercent = "activeBelowHealthPercent";
    static FIELD_increaseMedicByPercent = "increaseMedicByPercent";
    static FIELD_untargetable = "untargetable";
    static FIELD_curedByMedic = "curedByMedic";
    
    static templates  = [PassiveMiscRulesRecord.FIELD_miscRulesId,PassiveMiscRulesRecord.FIELD_gunSpreadfire,PassiveMiscRulesRecord.FIELD_auxSpreadfire,PassiveMiscRulesRecord.FIELD_scaleTargetByPercent,PassiveMiscRulesRecord.FIELD_reducedByCleanse,PassiveMiscRulesRecord.FIELD_reducedByDiminish,PassiveMiscRulesRecord.FIELD_forceStrike,PassiveMiscRulesRecord.FIELD_disableMelee,PassiveMiscRulesRecord.FIELD_regionInfluenceBonus,PassiveMiscRulesRecord.FIELD_decreaseQtyCode,PassiveMiscRulesRecord.FIELD_activeBelowHealthPercent,PassiveMiscRulesRecord.FIELD_increaseMedicByPercent,PassiveMiscRulesRecord.FIELD_untargetable,PassiveMiscRulesRecord.FIELD_curedByMedic];

    miscRulesId: number;
    gunSpreadfire: boolean;
    auxSpreadfire: boolean;
    scaleTargetByPercent: number;
    reducedByCleanse: boolean;
    reducedByDiminish: boolean;
    forceStrike: boolean;
    disableMelee: boolean;
    regionInfluenceBonus: number;
    decreaseQtyCode: number;
    activeBelowHealthPercent: number;
    increaseMedicByPercent: number;
    untargetable: boolean;
    curedByMedic: boolean;

    constructor(obj: any, miscRulesId = 0) {
        let duck = {} as any;
        if(obj == null) {
            let d = {} as any;
            d["miscRulesId"] = miscRulesId;
            d["gunSpreadfire"] = 0;
            d["auxSpreadfire"] = 0;
            d["scaleTargetByPercent"] = 0;
            d["reducedByCleanse"] = 0;
            d["reducedByDiminish"] = 0;
            d["forceStrike"] = 0;
            d["disableMelee"] = 0;
            d["regionInfluenceBonus"] = 0;
            d["decreaseQtyCode"] = 0;
            d["activeBelowHealthPercent"] = 0;
            d["increaseMedicByPercent"] = 0;
            d["untargetable"] = 0;
            d["curedByMedic"] = 0;
            duck = d;
        } else { duck = obj }

        this.miscRulesId = parseInt(duck["miscRulesId"]);
        this.gunSpreadfire = Boolean(parseInt(duck["gunSpreadfire"]));
        this.auxSpreadfire = Boolean(parseInt(duck["auxSpreadfire"]));
        this.scaleTargetByPercent = parseInt(duck["scaleTargetByPercent"]);
        this.reducedByCleanse = Boolean(parseInt(duck["reducedByCleanse"]));
        this.reducedByDiminish = Boolean(parseInt(duck["reducedByDiminish"]));
        this.forceStrike = Boolean(parseInt(duck["forceStrike"]));
        this.disableMelee = Boolean(parseInt(duck["disableMelee"]));
        this.regionInfluenceBonus = parseInt(duck["regionInfluenceBonus"]);
        this.decreaseQtyCode = parseInt(duck["decreaseQtyCode"]);
        this.activeBelowHealthPercent = parseInt(duck["activeBelowHealthPercent"]);
        this.increaseMedicByPercent = parseInt(duck["increaseMedicByPercent"]);
        this.untargetable = Boolean(parseInt(duck["untargetable"]));
        this.curedByMedic = Boolean(parseInt(duck["curedByMedic"]));
    }
}