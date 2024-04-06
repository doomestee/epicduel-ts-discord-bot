import { LeaderType, LeaderTypeToList } from "../game/module/Leader.js";

export function headings(index: number) {
    if ([1, 2, 16, 3, 4, 17, 5, 6, 18].some(v => v === index)) return ["Wins", "Total", "%", "Lvl"];
    if (index === 7) return ["Doms", "Alignment"];
    if ([8, 9, 19].some(v => v === index)) return ["Leads", "Alignment"];
    if (index === 10) return ["Captures", "Alignment"];
    if (index === 11) return ["Influence", "Lvl"];
    if (index === 12) return ["Influence", "Alignment"];
    if (index === 13) return ["Rarity", "Lvl"];
    if (index === 14 || index === 15) return ["Fame", "Lvl"];
    if (index === 20 || index === 21) return ["Redeems", "Lvl"];
    if (index === 22) return ["Rating", "Lvl"];
    if (index === 666) return ["Incidence"];//, "Lvl"];

    return [];
}

// Yes this is wrong, but the only other way I can think of is to put type inside each of the leader object, which I do not want to do, so ty, pls take off my ts developer badge.
function lazyFuck<T>(obj: any, types: number | number[], type: number) : obj is T {
    if (!Array.isArray(types)) return types === type;

    for (let i = 0, len = types.length; i < len; i++) {
        if (types[i] === type) return true;
    }
    return false;
}

export function transform<T extends LeaderType = LeaderType>(type: T, obj: LeaderTypeToList[T]) : Array<string | number> {
    if (lazyFuck<CacheTypings.PlayerLeaderPvp>(obj, [1, 2, 16, 3, 4, 17], type)) {
        return [obj.wins, obj.bat, Math.round((obj.wins/obj.bat) * 1000) / 10 + '%', obj.misc && "lvl" in obj.misc ? obj.misc.lvl : ''];
    }
    if (lazyFuck<CacheTypings.FactionLeaderPvp>(obj, [5, 6, 18], type)) {
        return [obj.wins, obj.bat, Math.round((obj.wins/obj.bat) * 1000) / 10 + '%', ''];
    }
    if (lazyFuck<CacheTypings.FactionLeaderDom>(obj, 7, type)) {
        return [obj.dom, obj.misc && obj.misc.align ? obj.misc.align : '']
    }
    if (lazyFuck<CacheTypings.FactionLeaderLead>(obj, [8, 9, 19], type)) {
        return [obj.lead, obj.misc && obj.misc.align ? obj.misc.align : ''];
    }
    if (lazyFuck<CacheTypings.FactionLeaderCap>(obj, 10, type)) {
        return [obj.cap, obj.misc && obj.misc.align ? obj.misc.align : ''];
    }
    if (lazyFuck<CacheTypings.FactionLeaderInf>(obj, 12, type)) {
        return [obj.influence, obj.misc && obj.misc.align ? obj.misc.align : ''];
    }
    if (lazyFuck<CacheTypings.PlayerLeaderInf | CacheTypings.PlayerLeaderRarity | CacheTypings.PlayerLeaderFame | CacheTypings.PlayerLeaderRedeems | CacheTypings.PlayerLeaderRating>(obj, [11, 13, 14, 15, 20, 21, 22], type)) {
        // return [obj.wins, obj.bat, Math.round((obj.wins/obj.bat) * 1000) / 10 + '%', obj.misc && "lvl" in obj.misc ? obj.misc.lvl : ''];
        let name = (type === 11) ? "influence" : (type === 13) ? "rarity" : (type === 14 || type === 15) ? "fame" : (type === 20 || type === 21) ? "redeems" : (type === 22) ? "rating" : "";

        return [(obj as any)[name], obj.misc?.lvl ?? ""];
    }

    return [];
}