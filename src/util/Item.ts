import ItemSBox, { AnyItemRecordsExceptSelf } from "../game/box/ItemBox.js";

export default class ItemUtil extends null {
    static getLinkage(item?: string | number) {
        if (ItemSBox.objMap.size === 0 || item === undefined) return "N/A";

        let it:AnyItemRecordsExceptSelf | undefined;

        if (typeof item === "string") it = ItemSBox.objMap.find(v => v.itemLinkage === item);
        else it = ItemSBox.objMap.get(item);

        if (!it) return "N/A";

        return "[" + it.itemName + "](https://epicduelwiki.com/index.php/" + encodeURIComponent(it.itemName) + ")"
    }
}