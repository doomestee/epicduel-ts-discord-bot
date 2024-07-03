declare namespace CacheTypings {
    export interface PlayerLeaderMiscWithoutExp {
        lvl: number,
        gender: string,
        classId: number,
        pri: string,
        sec: string,
        hair: string,
        skin: string,
        accnt: string,
        accnt2: string,
        eye: string,
        arm: number,
        hairS: number
    }

    export interface PlayerLeaderMiscWithExp {
        lvl: number,
        exp: number,
        gender: string,
        classId: number,
        pri: string,
        sec: string,
        hair: string,
        skin: string,
        accnt: string,
        accnt2: string,
        eye: string,
        arm: number,
        hairS: number
    }

    export interface FactionLeaderMisc {
        align: "Exile" | "Legion",
        symb: number,
        symbClr: string,
        back: number,
        backClr: string,
        flagClr: string
    }

    export type PlayerLeader<T extends string, Y extends PlayerLeaderMiscWithoutExp | PlayerLeaderMiscWithExp = PlayerLeaderMiscWithoutExp> = {
        name: string;
        misc?: Y;
    } & { [X in T]: number };

    export type FactionLeader<T extends string> = {
        name: string;
        misc?: FactionLeaderMisc
    } & { [X in T]: number };

    /**
     * 1, 2, 16, 3, 4, 17
     */
    export type PlayerLeaderPvp = PlayerLeader<"wins" | "bat" | "exp">;

    /**
     * 5, 6, 18
     */
    export type FactionLeaderPvp = FactionLeader<"wins" | "bat">;

    /**
     * 7
     */
    export type FactionLeaderDom = FactionLeader<"dom">;

    /**
     * 8, 9, 19
     */
    export type FactionLeaderLead = FactionLeader<"lead">;

    /**
     * 10
     */
    export type FactionLeaderCap = FactionLeader<"cap">;

    /**
     * 12
     */
    export type FactionLeaderInf = FactionLeader<"influence">;

    /**
     * 11
     */
    export type PlayerLeaderInf = PlayerLeader<"influence", PlayerLeaderMiscWithExp>;

    /**
     * 13
     */
    export type PlayerLeaderRarity = PlayerLeader<"rarity", PlayerLeaderMiscWithExp>;

    /**
     * 14, 15
     */
    export type PlayerLeaderFame = PlayerLeader<"fame", PlayerLeaderMiscWithExp>;

    /**
     * 20, 21
     */
    export type PlayerLeaderRedeems = PlayerLeader<"redeems", PlayerLeaderMiscWithExp>;

    /**
     * 22
     */
    export type PlayerLeaderRating = PlayerLeader<"rating", PlayerLeaderMiscWithExp>;

    export type AnyPlayerLeaders = PlayerLeaderFame | PlayerLeaderRating | PlayerLeaderRedeems | PlayerLeaderRarity | PlayerLeaderInf | PlayerLeaderPvp;
    export type AnyFactionLeaders = FactionLeaderInf | FactionLeaderCap | FactionLeaderLead | FactionLeaderDom | FactionLeaderPvp;

    export type AnyLeaders = AnyPlayerLeaders | AnyFactionLeaders;

    export type GiftingLeader = {
        complete: string[],
        season: {
            point: number, name: string
        }[],
        daily: {
            point: number, name: string
        }[]
    }

    // export type isFaction<Type, Result1, Result2> = Type extends AnyFactionLeaders ? Result1 : Result2;

    // Yes, this exists, idk
    export type Player = { type: 1, char: import("../util/Misc.ts").CharPage } | { type: 2, char: PlayerLeaderMiscWithoutExp | PlayerLeaderMiscWithExp }//CharPage
}