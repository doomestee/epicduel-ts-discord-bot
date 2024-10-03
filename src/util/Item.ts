import ItemSBox, { AnyItemRecordsExceptSelf } from "../game/box/ItemBox.js";
import { find, getCharPage, map } from "./Misc.js";

export default class ItemUtil extends null {
    static getLinkage(item?: string | number) {
        if (ItemSBox.objMap.size === 0 || item === undefined) return "N/A";

        let it:AnyItemRecordsExceptSelf | undefined;

        if (typeof item === "string") it = ItemSBox.objMap.find(v => v.itemLinkage === item);
        else it = ItemSBox.objMap.get(item);

        if (!it) return "N/A";

        return "[" + it.itemName + "](https://epicduelwiki.miraheze.org/wiki/" + encodeURIComponent(it.itemName) + ")"
    }

    /**
     * @param charName Character name
     * @param items List of item ids, must be connected in game at least once for the item box to have been initialised.
     * 
     * Success of result means it was able to process the character page, not that if it actually has all the items.
     */
    static async checkIfCharOwns(charName: string, items: number[]) : Promise<{ success: false, reason: string, extra: Record<any, any> } | { success: true, owned: Record<string, boolean>, allOwned: boolean }> {
        if (ItemSBox.objMap.size === 0) throw Error("Item Shared Box not initialised at least once.");

        return getCharPage(charName)
            .then(res => {
                if (res.success) {
                    const itemBoxArray = ItemSBox.objMap.toArray();
                    const charItems = map(res.result.items.items, v => find(itemBoxArray, a => v === a.itemName));

                    const owned:Record<string, boolean> = {}; let remaining = items.length;

                    for (let i = 0, len = items.length; i < len; i++) owned[items[i]] = false;

                    for (let i = 0, len = charItems.length; i < len; i++) {
                        if (remaining < 1) return { success: true, owned, allOwned: true };

                        const charItem = charItems[i];

                        if (!charItem) continue;

                        if (owned[charItem.itemId] === false) {
                            owned[charItem.itemId] = true;
                            remaining--;
                        }
                    }
                    
                    return { success: true, owned, allOwned: remaining === 0 };
                } else return { success: false, reason: "Unable to access the character page.", extra: res.extra };
            })
    }
}