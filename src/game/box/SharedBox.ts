import { Collection } from "oceanic.js";

/**
 * For boxes with singular list, like item.
 */
export class SharedBox<K extends string | number, T> {
    objMap: Collection<K, T>;
    templates: string[];

    ready: boolean;

    record: T;

    /**
     * A callback that runs if it exists, where the function may do as it like to the value. If it returns true, it will be added to objlist like normal, otherwise it won't.
     */
    postprocess?: (v: T) => boolean;

    postpopulate?: () => void;

    #staticMap?: Collection<K, T>;

    //@ts-expect-error I have no fucking idea, but why can't typeof type please work sob... well... shush
    constructor(templates: string[], record: typeof T, staticObj?: Collection<K, T>) {
        this.objMap = new Collection<K, T>();
        this.templates = templates;

        this.ready = false;

        this.record = record;

        if (staticObj) this.#staticMap = staticObj;
    }

    populate(data: string[]) {
        if (this.ready) return;

        this.objMap.clear();
        this.#staticMap?.clear();
        let i = 0; let count = data.length / this.templates.length;

        while (i < count) {
            let y = 0; let obj = {} as any;

            while (y < (this.templates.length)) {
                obj[this.templates[y]] = data[y + i * this.templates.length];
                y++;
            }

            const rec = this.record == null ? obj : new (this.record as any)(obj);

            if ((this.postprocess && this.postprocess(rec)) || this.postprocess == undefined) {
                this.objMap.set(rec[this.templates[0]] as K, rec);//.push(rec);
                this.#staticMap?.set(rec[this.templates[0]] as K, rec);//.push(rec);
            }

            i++;
        }

        this.ready = true;

        this.postpopulate?.();
    }
}

/**
 * For boxes with multiple lists, like skills with active, passive.
 */

type SMTemplates<T> = { [K in keyof T]: string[] }

//@ts-expect-error
type TypesToTypeof<T> = { [K in keyof T]: typeof T[K] }

export class SharedMultipleBox<T> {
    objMap = {} as { [K in keyof T]: Collection<number, T[K]> };
    record = {} as { [K in keyof T]: T[K] };
    ready = {} as { [K in keyof T]: boolean };

    templates: SMTemplates<T>;

    #staticMap?: { [K in keyof T]: Collection<number, T[K]> };

    constructor(templates: SMTemplates<T>, types: TypesToTypeof<T>, staticObj?: { [K in keyof T]: Collection<number, T[K]> }) {
        this.templates = templates;

        if (staticObj) this.#staticMap = staticObj;

        for (let type in types) {
            this.objMap[type] = new Collection();
            this.record[type] = types[type];
            this.ready[type] = false;
        }
    }

    populate(type: keyof T, data: string[]) {
        if (this.ready[type]) return this.objMap[type];

        this.objMap[type].clear();
        this.#staticMap?.[type].clear();
        let i = 0; let count = data.length / this.templates[type].length;

        while (i < count) {
            let y = 0; let obj = {} as any;

            while (y < (this.templates[type].length)) {
                obj[this.templates[type][y]] = data[y + i * this.templates[type].length];
                y++;
            }

            const rec = this.record[type] == null ? obj : new (this.record[type] as any)(obj);

            this.objMap[type].set(rec[this.templates[type][0]], rec);//[type].push(rec);
            this.#staticMap?.[type].set(rec[this.templates[type][0]], rec);

            i++;
        }

        this.ready[type] = true;
    }
}