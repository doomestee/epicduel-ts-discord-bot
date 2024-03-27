export default class AchievementRecord {
    static FIELD_achId = "achId";
    static FIELD_achLink = "achLink";
    static FIELD_achName = "achName";
    static FIELD_achDetails = "achDetails";
    static FIELD_achRating = "achRating";
    static FIELD_achGroup = "achGroup";
    static FIELD_hasBuyUpgrades = "hasBuyUpgrades";
    static FIELD_achCredits = "achCredits";
    static FIELD_achDisplayCountReq = "achDisplayCountReq";
    static FIELD_achGroupTier = "achGroupTier";
    static FIELD_categoryId = "categoryId";
    static FIELD_visibleWhenUnowned = "visibleWhenUnowned";
    static FIELD_isBuyable = "isBuyable";
    static FIELD_rarityId = "rarityId";

    achId: number;
    achLink: string;
    achName: string;
    achDetails: string;
    achRating: number;
    achGroup: number;
    hasBuyUpgrades: boolean;
    achCredits: number;
    achDisplayCountReq: number;
    achGroupTier: number;
    categoryId: number;
    visibleWhenUnowned: boolean;
    isBuyable: boolean;
    rarityId: number;

    constructor(obj: any) {
        this.achId = parseInt(obj[AchievementRecord.FIELD_achId]);
        this.achLink = String(obj[AchievementRecord.FIELD_achLink]);
        this.achName = String(obj[AchievementRecord.FIELD_achName]);
        this.achDetails = String(obj[AchievementRecord.FIELD_achDetails]);
        this.achRating = parseInt(obj[AchievementRecord.FIELD_achRating]);
        this.achGroup = parseInt(obj[AchievementRecord.FIELD_achGroup]);
        this.hasBuyUpgrades = obj[AchievementRecord.FIELD_hasBuyUpgrades] == "1";
        this.achCredits = parseInt(obj[AchievementRecord.FIELD_achCredits]);
        this.achDisplayCountReq = parseInt(obj[AchievementRecord.FIELD_achDisplayCountReq]);
        this.achGroupTier = parseInt(obj[AchievementRecord.FIELD_achGroupTier]);
        this.categoryId = parseInt(obj[AchievementRecord.FIELD_categoryId]);
        this.visibleWhenUnowned = obj[AchievementRecord.FIELD_visibleWhenUnowned] == "1";
        this.isBuyable = obj[AchievementRecord.FIELD_isBuyable] == "1";
        this.rarityId = parseInt(obj[AchievementRecord.FIELD_rarityId]);
    }
}