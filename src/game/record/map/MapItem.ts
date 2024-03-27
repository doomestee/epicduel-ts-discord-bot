export class MapItemRule {
    constructor(public mapItemId: number, public x: number, public y: number, public hideIfOwned:boolean = true, public visibleOnMissionId = 0) {

    }
}

export class MapItemRuleSet {
    rules: MapItemRule[];

    constructor(...ruleList: MapItemRule[]) {
        this.rules = ruleList;
    }
}