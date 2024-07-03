/**
 * The aim of this is to not overload the servers or database connections if and when we get the same multiple requests with same parameters.
 */

import { Collection } from "oceanic.js";
import { Cheevo } from "../game/module/Achievements.js";
import { Faction } from "../game/module/FactionManager.js";
import { Shop } from "../game/module/Merchant.js";
import { TournamentLeader } from "../game/module/Tournament.js";
// import { RegionalWar } from "../game/module/WarManager.js";

// type Cache<T extends Object, K> = Collection<K, T & { _lastGot: number }>;

type StringCache<T extends Object> = Collection<string, Cached<T>>;
type NumberCache<T extends Object> = Collection<number, Cached<T>>;
type SingularCache<T extends Object> = Cached<T>

type Cached<T> = { val: T, _lastGot: number };

interface CacheInternal {
    leaders: NumberCache<CacheTypings.AnyLeaders[]>,
    gifts: SingularCache<CacheTypings.GiftingLeader>,
    achievement: NumberCache<Cheevo[]>,
    faction: NumberCache<Faction>,
    merchant: NumberCache<Shop>,
    tourney: SingularCache<TournamentLeader[]>,

    /**
     * This is a collection of players (fetched from char page OR leaderboard).
     * 
     * The player from leaderboard will have a higher priority and will always replace each time it gets fetched (if it has misc ofc).
     * But otherwise, it will be cached for 7 days.
     */
    player: StringCache<CacheTypings.Player>
}

export type CacheSetting<T = undefined> = T extends undefined ? { time: number } : {
    time: number;
    args: T;
    cb: () => boolean;
}

interface CacheSettingsInternal {
    leaders: CacheSetting,
    // Off gifting time, so for 24 hours anyways.
    gifts: CacheSetting,
    achievement: CacheSetting,
    faction: CacheSetting,
    merchant: CacheSetting,
    tourney: CacheSetting<{ ended: boolean }>,

    player: CacheSetting,
}

/**
 * FOR COLLECTIONS
 */
export type ExtractKeyType<T, D=never> = T extends Collection<infer K, any> ? K : D;
/**
 * FOR COLLECTIONS
 */
export type ExtractValueType<T> = T extends Collection<any, infer V> ? V : T extends SingularCache<any> ? T : never;

export type CacheType = keyof CacheInternal;

// type GetValueFromInternal<T extends CacheType> = CacheInternal[T] extends Collection<any, any> ? ExtractValueType<T> : CacheInternal[T];

export default class CacheManager {
    private static cols:CacheInternal = {
        leaders: new Collection(),

        //@ts-expect-error TODO: make val optional
        gifts: { _lastGot: 0, val: {} },
        achievement: new Collection(),
        faction: new Collection(),
        merchant: new Collection(),
        //@ts-expect-error TODO: make val optional
        tourney: { _lastGot: 0, val: {} },

        player: new Collection(),
    };

    public static settings:CacheSettingsInternal = {
        leaders: { time: 1000*30 },
        // Off gifting time, so for 24 hours anyways.
        gifts: { time: 1000*60*60*24 },
        achievement: { time: 1000*60*10 },
        faction: { time: 1000*60*30 },
        merchant: { time: 1000*60*60*24 },
        tourney: { time: 1000*60*1, args: { ended: true }, cb() {
            return this.args.ended;
        }, },
        player: { time: 1000*60*60*24*7 }
    }

    /**
     * If you need to delete a key, use this but with empty value
     */
    static update<T extends CacheType>(type:T, ...args: CacheInternal[T] extends SingularCache<any> ? [value: ExtractValueType<CacheInternal[T]>["val"]] : [id: ExtractKeyType<CacheInternal[T], number>, value: ExtractValueType<CacheInternal[T]>["val"]]) {
        // let obj = this.cols[type].get(key);

        let [key, value] = args;

        // this is annoyingly needed so that typescript will stop fucking moaning.
        const col = this.cols[type];

        if (!(col instanceof Collection)) {
            if (!key) {
                //@ts-expect-error
                col.val = {};
                return true;
            }

            //// @ts-expect-error
            col.val = key;
            col._lastGot = 0;

            return;
        }

        if (!value) {
            //@ts-expect-error
            return col.delete(key);
        }

        // I can't be fucking assed with the typing oh mai god i'd rather die

        // @ts-expect-error
        return col.set(key, { val: value, _lastGot: Date.now() });

        // const ok:any = value;

        // ok["_lastGot"] = Date.now();

        // // if (!obj)
        // return this.cols[type].set(key, value as any);
    }

    /**
     * Returns a boolean indicating whether if the cache is invalid.
     */
    static check<T extends CacheType>(type:T, ...args: CacheInternal[T] extends SingularCache<any> ? [] : [id: ExtractKeyType<CacheInternal[T], number>]) : CheckResult<ExtractValueType<CacheInternal[T]>["val"]> {
    // static check<T extends CacheType>(type:T, key:number) : CheckResult<ExtractValueType<CacheInternal[T]>["val"]> {

        const [ key ] = args;

        const col = this.cols[type];

        const timeCheck = (lastGot: number) => {
            const settings = this.settings[type];

            return ("args" in settings ? !settings.cb.bind(settings)() : true) && settings.time > (Date.now() - lastGot);
        }

        if (!(col instanceof Collection)) {
            if (col._lastGot < 1 || timeCheck(col._lastGot)) return { valid: false };

            return { valid: true, value: col.val };
        }

        //@ts-ignore
        let val = col.get(key);

        if (!val || val._lastGot < 1) return { valid: false };

        if (timeCheck(val._lastGot)) return { valid: true, value: val.val };

        // just in case if there's other stuff to check idk, but for now just a simple return else

        return { valid: false };
    }
}

type CheckResult<T extends Object> = ({ valid: false } | { valid: true, value: T });

// CacheManager.update("leaders", 1, []);//, 1, [{  }]);
// CacheManager.update("gifts", []);//, 1, [{}]);//, 1, [{ }]);
// CacheManager.update("player", )