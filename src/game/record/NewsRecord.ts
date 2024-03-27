export default class NewsRecord {
    static FIELD_newsId = "newsId";
    static FIELD_newsLink = "newsLink";
    static FIELD_newsPriority = "newsPriority";
    static FIELD_levelReq = "levelReq";
    static FIELD_baseClassReq = "baseClassReq";
    static FIELD_actionMode1 = "actionMode1";
    static FIELD_actionLabel1 = "actionLabel1";
    static FIELD_actionParams1 = "actionParams1";
    static FIELD_actionMode2 = "actionMode2";
    static FIELD_actionLabel2 = "actionLabel2";
    static FIELD_actionParams2 = "actionParams2";

    newsId: number;
    newsLink: string;
    newsPriority: number;
    levelReq: number;
    baseClassReq: number;
    actionMode1: number;
    actionLabel1: string;
    actionParams1: string;
    actionMode2: number;
    actionLabel2: string;
    actionParams2: string;

    constructor(obj: any) {
        this.newsId = parseInt(obj[NewsRecord.FIELD_newsId]);
        this.newsLink = String(obj[NewsRecord.FIELD_newsLink]);
        this.newsPriority = parseInt(obj[NewsRecord.FIELD_newsPriority]);
        this.levelReq = parseInt(obj[NewsRecord.FIELD_levelReq]);
        this.baseClassReq = parseInt(obj[NewsRecord.FIELD_baseClassReq]);
        this.actionMode1 = parseInt(obj[NewsRecord.FIELD_actionMode1]);
        this.actionLabel1 = String(obj[NewsRecord.FIELD_actionLabel1]);
        this.actionParams1 = String(obj[NewsRecord.FIELD_actionParams1]);
        this.actionMode2 = parseInt(obj[NewsRecord.FIELD_actionMode2]);
        this.actionLabel2 = String(obj[NewsRecord.FIELD_actionLabel2]);
        this.actionParams2 = String(obj[NewsRecord.FIELD_actionParams2]);
    }

    getParamsByMode(modeId: number) {
        if (modeId === 1) return this.actionParams1.split(",");
        if (modeId === 2) return this.actionParams2.split(",");
        return null;
    }
}