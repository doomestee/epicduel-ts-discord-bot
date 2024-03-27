export default class MailMessageRecord {
    static FIELD_mailId = "mailId";
    static FIELD_sendDate = "sendDate";
    static FIELD_senderCharId = "senderCharId";
    static FIELD_sender = "sender";
    static FIELD_templateId = "templateId";
    static FIELD_templateSubject = "templateSubject";
    static FIELD_templateMessage = "templateMessage";
    static FIELD_templateParams = "templateParams";
    static FIELD_mailSubject = "mailSubject";
    static FIELD_mailMessage = "mailMessage";
    static FIELD_mailTimeout = "mailTimeout";
    static FIELD_isRead = "isRead";
    static template = [this.FIELD_mailId, this.FIELD_sendDate, this.FIELD_senderCharId, this.FIELD_sender, this.FIELD_templateId, this.FIELD_templateSubject, this.FIELD_templateMessage, this.FIELD_templateParams, this.FIELD_mailSubject, this.FIELD_mailMessage, this.FIELD_mailTimeout, this.FIELD_isRead];

    mailId: number;
    sendDate: string;
    senderCharId: number;
    sender: string;
    mailSubject: string;
    mailMessage: string;
    mailTimeout: string;
    isRead: boolean;// = Boolean(parseInt(obj[MailMessageRecord.FIELD_isRead]));
    useTemplate: boolean;// = obj[MailMessageRecord.FIELD_templateSubject] != "null";
    templateId: number;
    templateSubject: string;
    templateMessage: string;
    templateParams: string[];// = obj[MailMessageRecord.FIELD_templateParams] == null ? [] : obj[MailMessageRecord.FIELD_templateParams].split(",");

    constructor(obj: any) {
        this.mailId = parseInt(obj[MailMessageRecord.FIELD_mailId]);
        this.sendDate = String(obj[MailMessageRecord.FIELD_sendDate]); // EpicUtils.formatDate(sendDate,"MMMM dd, yyyy");
        this.senderCharId = parseInt(obj[MailMessageRecord.FIELD_senderCharId]);
        this.sender = String(obj[MailMessageRecord.FIELD_sender]);
        this.mailSubject = String(obj[MailMessageRecord.FIELD_mailSubject]);
        this.mailMessage = String(obj[MailMessageRecord.FIELD_mailMessage]);
        this.mailTimeout = String(obj[MailMessageRecord.FIELD_mailTimeout]);
        this.isRead = Boolean(parseInt(obj[MailMessageRecord.FIELD_isRead]));
        this.useTemplate = obj[MailMessageRecord.FIELD_templateSubject] != "null";
        this.templateId = parseInt(obj[MailMessageRecord.FIELD_templateId]);
        this.templateSubject = String(obj[MailMessageRecord.FIELD_templateSubject]);
        this.templateMessage = String(obj[MailMessageRecord.FIELD_templateMessage]);
        this.templateParams = obj[MailMessageRecord.FIELD_templateParams] == null ? [] : obj[MailMessageRecord.FIELD_templateParams].split(",");
    }

    daysUntilTimeout() {
        //return Math.ceil(EpicUtils.msBetweenDates(new Date(), EpicUtils.stringToDate(this.mailTimeout)) / 86400000);
    }
}