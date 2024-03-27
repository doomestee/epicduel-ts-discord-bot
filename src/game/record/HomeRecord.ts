export default class HomeRecord {
    static FIELD_homeId = "homeId";
    static FIELD_homeName = "homeName";
    static FIELD_homeDesc = "homeDesc";
    static FIELD_homeCredits = "homeCredits";
    static FIELD_homeVarium = "homeVarium";
    static FIELD_homeRegion = "homeRegion";
    static FIELD_homeRooms = "homeRooms";
    static FIELD_homeForSale = "homeForSale";

    homeId: number;
    homeName: string;
    homeDesc: string;
    homeCredits: number;
    homeVarium: number;
    homeRegion: number;
    homeRooms: number;
    homeForSale: number;

    constructor(obj: any) {
        this.homeId = parseInt(obj[HomeRecord.FIELD_homeId]);
        this.homeName = (obj[HomeRecord.FIELD_homeName]);
        this.homeDesc = (obj[HomeRecord.FIELD_homeDesc]);
        this.homeCredits = parseInt(obj[HomeRecord.FIELD_homeCredits]);
        this.homeVarium = parseInt(obj[HomeRecord.FIELD_homeVarium]);
        this.homeRegion = parseInt(obj[HomeRecord.FIELD_homeRegion]);
        this.homeRooms = parseInt(obj[HomeRecord.FIELD_homeRooms]);
        this.homeForSale = parseInt(obj[HomeRecord.FIELD_homeForSale]);
    }
}