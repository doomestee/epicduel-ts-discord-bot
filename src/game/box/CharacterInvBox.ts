import { Collection } from "oceanic.js";
import CharacterInvRecord from "../record/CharacterInvRecord.js";

export default class CharacterInvBox {
    templates = ["charInvId", "itemId", "itemEquipped", "strAdd", "dexAdd", "techAdd", "suppAdd", "damage", "defense", "resist", "corePassiveId", "corePassiveQty", "coreActiveId", "coreActiveQty", "unlockedLevel", "creditSpend", "variumSpend", "isBanked", "invQty"];
    ready = false;

    objMap: Collection<number, CharacterInvRecord> = new Collection();

    populate(data: string[]) {
        let i = 0;
        this.objMap.clear();

        const count = data.length / this.templates.length;

        while (i < count) {
            let y = 0; let obj = {} as any;

            while (y < (this.templates.length)) {
                obj[this.templates[y]] = data[y + i * this.templates.length];
                y++;
            }

            this.objMap.set(obj["charInvId"], new CharacterInvRecord(obj));
            i++;
        }

        return this.ready = true;
    }
}