import Client from "../Proximus.js";
import User from "../sfs/data/User.js";
import BaseModule from "./Base.js";

export default class UserVariableManager extends BaseModule {
    constructor(public client: Client) {
        super();
    }

    handleVariables(data: Record<string, any>) {
        const currRoom = this.client.smartFox.getActiveRoom();

        if (currRoom == null) return;

        const user = currRoom.getUser(data.uId);

        if (user == null) return;

        const myUser = this.client.getMyUser();

        if (myUser == null) return;

        const myUpdate = myUser.charId == user.charId;
        const eCmd = data.eCmd;
        delete data.uId;
        delete data.eCmd;
        delete data._cmd;

        const changedVars = [];

        for (let str in data) {
            let currVal = user.getVariable(str);
            if (currVal != data[str]) changedVars.push(str);
        }

        if (data.iWpn == 0) data.iWpn = undefined;
        if (data.iGun == 0) data.iGun = undefined;
        if (data.iBot == 0) data.iBot = undefined;
        if (data.iVeh == 0) data.iVeh = undefined;
        if (data.iAux == 0) data.iAux = undefined;

        user.setVariables(data);

        const commandList = eCmd.split(";");

        for (let i = 0; i < commandList.length; i++) {
            const eachCmd = String(commandList[i]);
            if (eachCmd === "init") continue;

            switch (eachCmd) {
                case "new":
                    //this.onSetVarsNew(user);
                    break;
                case "afk":
                    break;
                case "chgFct":
                    break;
                case "chgTitle":
                    break;
                case "chgFctRank":
                    break;
                case "chgName":
                    break;
                case "chgStyle":
                    break;
                case "chgLvl":
                    this.onSetVarsChgLvl(user, myUpdate);
                    break;
                case "chgClass":
                    break;
                case "forceRetrain":
                    break;
                case "retrain":
                    break;
                case "saveClass":
                    break;
                case "chgItem":
                    break;
                case "fly":
                    break;
            }

        }
    }

    /**
     * @param {import("../data/User")} user 
     */
    onSetVarsChgLvl(user: User, myUpdate: boolean, msg = true) {
        let roomIsGame = this.client.smartFox.getActiveRoomFr().isBattle;

        if (!roomIsGame) {
            if (myUpdate) {
                this.client.user._forceRetrain = false; 

                this.client.user._mySkills = {};
                console.log("YOU'VE LEVELLED UP!!!!");
            }
        }
    }
}