import CacheManager from "../../manager/cache.js";
import { WaitForResult, waitFor } from "../../util/WaitStream.js";
import { Requests } from "../Constants.js";
import type Client from "../Proximus.js";
import SmartFoxClient from "../sfs/SFSClient.js";
import BaseModule from "./Base.js";

export interface TournamentLeader {
    name: string;
    score: number;
}

// export interface TournamentDetails {
//     name: string;
//     active: boolean;
//     minsTilStart
// }

export default class Tournament extends BaseModule {

    public _playerScore:number = -1;
      
    public _claimed:boolean = false;
    
    public name:string = "";

    public isActive:boolean = false;

    public minutesUntilStart:number = -1;
    
    public minutesUntilEnd:number = -1;
    
    public participationAchId:number = -1;

    public fetchedAt:number = -1;
    
    public leaders:TournamentLeader[] = [];

    constructor(public client: Client) {
        super();
    }

    request(type?: "leaders" | "details" | "score") {
        if (type === undefined) {
            this.client.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_LEADERS, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
            this.client.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_DETAILS, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
            // this.client.smartFox.sendXtMessage("main", Requests.REQUEST_MY_TOURNAMENT_SCORE, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
        }

        else if (type === "leaders") this.client.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_LEADERS, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
        else if (type === "details") this.client.smartFox.sendXtMessage("main", Requests.REQUEST_TOURNAMENT_DETAILS, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
        else if (type === "score") this.client.smartFox.sendXtMessage("main", Requests.REQUEST_MY_TOURNAMENT_SCORE, {}, 1, SmartFoxClient.XTMSG_TYPE_JSON);
        else throw Error("Unknown type, was expecting undefined or string values; 'leaders', 'details' or 'score'");
    }

    protected receiveTournamentScoreResponse(data: string[]) {
        this._playerScore = parseInt(data[3]);
    }

    protected receiveTournamentDetailsResponse(data: string[]) {
        const tournamentDetails = data.slice(2);

        this.name = tournamentDetails[0];
        this.isActive = tournamentDetails[1] === "1";
        this.minutesUntilStart = parseInt(tournamentDetails[2]);
        this.minutesUntilEnd = parseInt(tournamentDetails[3]);
        this.participationAchId = parseInt(tournamentDetails[4]);

        CacheManager.settings.tourney.args.ended = !this.isActive;

        // If you want to calculate for yourself:
        /*


         if(this._minutesUntilStart > 0)
         {
            hoursTilStart = Math.floor(this._minutesUntilStart / 60);
            minutesTilStart = this._minutesUntilStart % 60;
            timeTilStart = hoursTilStart > 0 ? hoursTilStart + " hours " + minutesTilStart + " minutes" : minutesTilStart + " minutes";
            this.ui.tournament_status_txt.text = "Tournament will start in\n" + timeTilStart;
            this.ui.participation_status_txt.text = playerHasTicket ? "You are enrolled in the tournament!" : "Buy the Typhoon Terror Ticket to participate!";
            this.ui.buy_ticket_btn.visible = !playerHasTicket;
         }
         else if(this._minutesUntilStart < 0 && this._minutesUntilEnd > 0)
         {
            hoursLeft = Math.floor(this._minutesUntilEnd / 60);
            minutesLeft = this._minutesUntilEnd % 60;
            timeLeft = hoursLeft > 0 ? hoursLeft + " hours " + minutesLeft + " minutes" : minutesLeft + " minutes";
            this.ui.tournament_status_txt.text = "This tournament runs for another\n" + timeLeft;
            this.ui.participation_status_txt.text = playerHasTicket ? "You are enrolled in the tournament!\nWin PvP battles to score points!" : "This tournament has already started,\nbuy a ticket to participate!";
            this.ui.buy_ticket_btn.visible = !playerHasTicket;
         }
         else if(this._minutesUntilEnd < 0)
         {
            this.ui.tournament_status_txt.text = "The tournament has ended,\ncongratulations to all top finishers!";
            if(playerHasTicket)
            {
               this.ui.participation_status_txt.text = "Prizes were automatically added to the inventories of qualifying players.";
            }
            else
            {
               this.ui.participation_status_txt.text = "";
            }
         }*/
    }

    protected receiveTournamentLeadersResponse(data: string[]) {
        this.leaders.splice(0);

        for (let i = 2, len = data.length - 2; i < len; i++) {
            this.leaders.push({
                name: data[i],
                score: parseInt(data[++i])
            });
        }

        CacheManager.update("tourney", this.leaders);
        this.client.smartFox.emit("tourney_leader", this.leaders);
    }

    async getLeaders() : Promise<WaitForResult<TournamentLeader[]>> {
        const cache = await CacheManager.check("tourney");

        if (cache.valid) return { success: true, value: cache.value };

        const wait = waitFor(this.client.smartFox, "tourney_leader", undefined, 3000);
        this.request("leaders");

        return wait;
    }
}