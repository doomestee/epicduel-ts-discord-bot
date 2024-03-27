import NewsRecord from "../record/NewsRecord.js";
import { SharedBox } from "./SharedBox.js";

export default class NewsSBox extends SharedBox<number, NewsRecord> {
    constructor() {
        super(["newsId", "newsLink", "newsPriority", "levelReq", "baseClassReq", "actionMode1", "actionLabel1", "actionParams1", "actionMode2", "actionLabel2", "actionParams2"], NewsRecord);
    }
}