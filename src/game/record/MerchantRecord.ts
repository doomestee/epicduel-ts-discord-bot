export default class MerchantRecord {
    static FIELD_merchantId = "merchantId";
    static FIELD_mercName = "mercName";
    static FIELD_mercLink = "mercLink"
    static FIELD_mercScale = "mercScale"
    static FIELD_mercX = "mercX"
    static FIELD_mercY = "mercY"
    static FIELD_mercOpts = "mercOpts"
    static FIELD_mercChat = "mercChat"
    static FIELD_npcId = "npcId"
    static FIELD_merchLvl = "merchLvl"
    static FIELD_reqItems = "reqItems"
    static FIELD_mercBoss = "mercBoss"
    static FIELD_mercAlign = "mercAlign"
    static FIELD_mercCanJump = "mercCanJump";

    merchantId: number;
    mercName: string;
    mercLink: string;
    mercScale: number;// = Number(obj[MerchantRecord.FIELD_mercScale]);
    mercX: number;
    mercY: number;
    mercOpts: string;
    mercChat: string;
    npcId: number;
    merchLvl: number;
    reqItems: string;
    mercBoss: number;
    mercAlign: number;
    mercCanJump: number;

    constructor(obj: any) {
        this.merchantId = parseInt(obj[MerchantRecord.FIELD_merchantId]);
        this.mercName = String(obj[MerchantRecord.FIELD_mercName]);
        this.mercLink = String(obj[MerchantRecord.FIELD_mercLink]);
        this.mercScale = Number(obj[MerchantRecord.FIELD_mercScale]);
        this.mercX = parseInt(obj[MerchantRecord.FIELD_mercX]);
        this.mercY = parseInt(obj[MerchantRecord.FIELD_mercY]);
        this.mercOpts = String(obj[MerchantRecord.FIELD_mercOpts]);
        this.mercChat = String(obj[MerchantRecord.FIELD_mercChat]);
        this.npcId = parseInt(obj[MerchantRecord.FIELD_npcId]);
        this.merchLvl = parseInt(obj[MerchantRecord.FIELD_merchLvl]);
        this.reqItems = String(obj[MerchantRecord.FIELD_reqItems]);
        this.mercBoss = parseInt(obj[MerchantRecord.FIELD_mercBoss]);
        this.mercAlign = parseInt(obj[MerchantRecord.FIELD_mercAlign]);
        this.mercCanJump = parseInt(obj[MerchantRecord.FIELD_mercCanJump]);
    }

    /**
     * @type {{ id: number, args: string[] }[]}
     */
    get opts() {
        let options = this.mercOpts.split(",");
        let result = [];

        for (let i = 0; i < options.length; i++) {
            let parts = options[i].split("#");
            let id = parts[0];

            if (parts.length === 2) result.push({ id: parseInt(id), args: parts[1].split(":").map(Number) });
            else result.push({ id: parseInt(id), args: [] });
        }; return result;
    }

    /**
     * Returns the list of each option types this NPC offer
     */
    get optTypes() {
        let opts = this.opts;

        /**
         * @type {("DONE"|"CUSTOMISE_CHARACTER"|"SHOP"|"VIEW_BANK"|"FLY"|"OVERLORD_THRONE_ROOM"|"MUSK_VIDEO"|"TRAIN"|"BUY_BANK"|"CHALLENGE"|"APPRAISE"|"CHARACTER_PAGE"|"TIME"|"INFERNAL_WAR"|"AQW"|"DRAGONOID_SHIP"|"DRAGONOID_DEFEAT"|"HOMES"|"MESSAGE_BOARD"|"BUY_VARIUM"|"MONKAKAZI_ARCADE"|"CLAIM_PRIZE"|"CHANGE_CLASS"|"CHANGE_NAME"|"FRYSTELAND"|"WHAT_HAPPENED"|"STORY"|"MUSK_PUMPKIN"|"JUGGERNAUT"|"MINES"|"SOCIAL_MEDIA"|"BIOBEAST"|"MUSK_WHO"|"ONE_STOP"|"MUSK_HOW"|"MUSK_WHAT_NOW"|"MONKAKAZI_BUNDLE"|"BUNNIES"|"ALIGNMENT_EXILE"|"ALIGNMENT_LEGION"|"RESTOCK_TIME"|"BUY_BACK_SHOP"|"TOURNAMENT_VIEW"|"TOURNAMENT_RULES"|"TOURNAMENT_PRIZES"|"ALLEY_CAT_WARP"|"ADJUDICATOR_WARP")[]}
         */
        let types = [];

        for (let i = 0; i < opts.length; i++) {
            let type = "";

            switch (opts[i].id) {
                case 0: type = "DONE"; break;
                case 1: type = "CUSTOMISE_CHARACTER"; break;
                case 2: type = "SHOP"; break;
                case 3: type = "VIEW_BANK"; break;
                case 4: type = "FLY"; break;
                case 5: type = "OVERLORD_THRONE_ROOM"; break;
                case 6: type = "MUSK_VIDEO"; break;
                case 7: type = "TRAIN"; break;
                case 8: type = "BUY_BANK"; break;
                case 9: type = "CHALLENGE"; break;
                case 10: type = "APPRAISE"; break;
                case 11: type = "CHARACTER_PAGE"; break;
                case 12: type = "TIME"; break;
                case 13: type = "INFERNAL_WAR"; break;
                case 14: type = "AQW"; break;
                case 15: type = "DRAGONOID_SHIP"; break;
                case 16: type = "DRAGONOID_DEFEAT"; break;
                case 17: type = "HOMES"; break;
                case 18: type = "MESSAGE_BOARD"; break;
                case 19: type = "BUY_VARIUM"; break;
                case 20: type = "MONKAKAZI_ARCADE"; break;
                case 21: type = "CLAIM_PRIZE"; break;
                case 22: type = "CHANGE_CLASS"; break;
                case 23: type = "CHANGE_NAME"; break;
                case 24: type = "FRYSTELAND"; break;
                case 25: type = "WHAT_HAPPENED"; break;
                case 26: type = "STORY"; break;
                case 27: type = "MUSK_PUMPKIN"; break;
                case 28: type = "JUGGERNAUT"; break;
                case 29: type = "MINES"; break;
                case 30: type = "SOCIAL_MEDIA"; break;
                case 31: type = "BIOBEAST"; break;
                case 32: type = "MUSK_WHO"; break;
                case 33: type = "ONE_STOP"; break;
                case 34: type = "MUSK_HOW"; break;
                case 35: type = "MUSK_WHAT_NOW"; break;
                case 36: type = "MONKAKAZI_BUNDLE"; break;
                case 38: type = "BUNNIES"; break;
                case 39: type = "ALIGNMENT_EXILE"; break;
                case 40: type = "ALIGNMENT_LEGION"; break;
                case 41: type = "RESTOCK_TIME"; break;
                case 42: type = "BUY_BACK_SHOP"; break;
                case 43: type = "TOURNAMENT_VIEW"; break;
                case 44: type = "TOURNAMENT_RULES"; break;
                case 45: type = "TOURNAMENT_PRIZES"; break;
                case 46: type = "ALLEY_CAT_WARP"; break;
                case 47: type = "ADJUDICATOR_WARP"; break;
                default: if (opts[i].id >= 700 && opts[i].id < 800) type = "POLL"; break;
            }

            types.push(type);
        }; return types;
    }

    get itemsReq() {
        if (this.reqItems === "") return [];

        let items = this.reqItems.split(","); // idk the splitter

        return items.map(v => parseInt(v));
    }
}