import { Requests } from "../Constants.js";
import Client from "../Proximus.js";
import MailMessageRecord from "../record/MailMessageRecord.js";
import BaseModule from "./Base.js";

export default class MailManager extends BaseModule {
    static MAIL_PER_PAGE = 13;
    static MAX_RECIPIENTS = 20;
    static RECIPIENTS_PER_ROW = 5;

    mailList:MailMessageRecord[] = [];
    recipients = [];

    constructor(public client: Client) {
        super();

        // Limit inbox view search to 50 chars, "A-Z a-z0-9\'";
        // Create View Send Btn & Create View To Txt to 40, "A-Z a-z0-9.\'"
        // Create View Subject Txt to 250, "A-Z a-z0-9.!@#$%&*()_=:;,?\'{}[]|/\\\\"
    }

    claimGift(mailId: number) {
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_CLAIM_GIFTED_PRESENT, { mailId }, 1, "json");
        this.deleteMail(mailId);
    }

    receiveClaimGiftHandler(data: string[]) {
        let claimData = data.slice(2);

        if (claimData.length != 4) { console.error("ERROR - claim gift data: " + data); }

        let prize = {
            success: Boolean(parseInt(claimData[0])),
            prize: parseInt(claimData[1]),
            value: parseInt(claimData[2]),
            creditValue: parseInt(claimData[3]),
            hide: Boolean(parseInt(claimData[4])),
        }

        console.log(prize);
        //if (prize.success) console.log(prize);
    }

    deleteMail(mailId: number) {
        if (mailId === -1) return { type: -1 };

        let mail = this.mailList.find(v => v.mailId === mailId);

        if (!mail) return { type: -2, v: "No mail found." };

        for (let m = 0; m < this.mailList.length; m++) {
            if (this.mailList[m].mailId === mailId) {
                let mail = this.mailList.splice(m, 1)[0];

                this.client.smartFox.sendXtMessage("main", Requests.REQUEST_DELETE_MAIL, { mailId }, 2, "json");
                break;
            }
        } return { type: -2, v: "No mail found." };
    }

    getHighestMailId() {
        let highestMailId = 0;

        for (let mailRecord of this.mailList) {
            if (mailRecord.mailId > highestMailId) highestMailId = mailRecord.mailId;
        } return highestMailId;
    }

    getNewMail() {
        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_GET_MAIL, { minMailId: this.getHighestMailId() }, 2, "json");
    }

    handleGetMail(data: string[]) {
        let fullData = data.slice(2);
        let fieldCount = MailMessageRecord.template.length;
        let recordCount = fullData.length / fieldCount;
        for (let r = 0; r < recordCount; r++) {
            let record = {} as Record<string, any>;

            for (let h = 0; h < fieldCount; h++) {
                record[MailMessageRecord.template[h]] = fullData[h + r * fieldCount];
            }

            this.mailList.push(new MailMessageRecord(record));
        }

        this.mailList.sort(this.sortMail);
    }

    markAsRead(mailId: number) {
        if (mailId === -1) return { type: -1 };

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_MARK_MAIL_READ, { mailId }, 2, "json");
    }

    /**
     * @param {string[]} recipients
     * @returns
     */
    openCreateMail(recipients: string[]) {
        // if (this.client.user._chatBlock) return { type: -1, v: this.client.manager.languages["DYN_mail_msg_muted"] };
        // this.recipients = [];

        // if (recipients) {}
    }

    replyToMail() {
        return;
        //this.openCreateMail([mail.sender]);
    }

    sendMail(recipients: string[], msg: string, subject: string) {
        // recipient appears to be a list of charnames

        if (recipients.length < 1 || subject == "" || msg == "") return { type: -1, v: "One of the fields isn't filled." };
        // let v01 = [!LanguageFilter.messageIsClean(msg), !LanguageFilter.messageIsClean(subject)];
        // if (v01[0] || v01[1]) return { type: -2, v: v01, x: 1};
        // let v02 = [!LanguageFilter.messageHasNoRestrictions(msg), !LanguageFilter.messageHasNoRestrictions(subject)];
        // if (v02[0] || v02[2]) return { type: -2, v: v02, x: 2};

        this.client.smartFox.sendXtMessage("main", Requests.REQUEST_SEND_PLAYER_MAIL, {
            recipients, subject, message: msg
        }, 2, "json");
    }

    /**
     * @param {MailMessageRecord} a 
     * @param {MailMessageRecord} b 
     */
    sortMail(a: MailMessageRecord, b: MailMessageRecord) {
        if (b.mailId > a.mailId) {
            if (b.isRead && !a.isRead) return -1;
            return 1;
        } if (b.mailId < a.mailId) {
            if (!b.isRead && a.isRead) return 1;
            return -1;
        } return 0;
    }
}