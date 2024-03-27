import { readFile, writeFile } from "fs/promises";

export default class JSONStorage<T extends object> {
    value!: T;
    initialised = Date.now();
    path: string;

    writeDelayMs: number;
    writeThreshold: number;
    writeTimer: NodeJS.Timeout | undefined;
    writeCount: number;

    type: 0 | 1;

    /**
     * @param path Path resolve before giving pls. Do include the .json at the end!
     * @param type 0 for object, 1 for array!
     */
    constructor(path: string, type: 0|1, writeDelayMs=10000, writeThreshold=10) {
        this.path = path;

        this.writeDelayMs = writeDelayMs;
        this.writeThreshold = writeThreshold;
        this.writeTimer = undefined;
        this.writeCount = 0;

        this.type = type;

        this._load();
    }

    async _load() : Promise<T> {
        return readFile(this.path).then(buffer => {
            const data = JSON.parse(buffer.toString());
            return this.value = data;
        })
    }

    protected save() {
        return writeFile(this.path, JSON.stringify(this.value, undefined, 2)).then(v => true);
    }

    /**
     * 
     * @param save If true, this will skip waiting for queue and jump straight to it.
     */
    modifyValues<Save=boolean>(val: Partial<T>, save: true) : Promise<boolean>
    modifyValues<Save=boolean>(val: Partial<T>, save: false) : boolean
    modifyValues<Save=boolean>(val: Partial<T>, save = false) : boolean | Promise<boolean> {
        const entries = Object.entries(val);

        for (let i = 0, length = entries.length; i < length; i++) {
            const [key, value] = entries[i];

            // @ts-ignore
            this.value[key] = value;
        }

        if (save) { return this.save(); }
        else return true;
    }

    saveToQueue() {
        this.writeCount++;

        clearTimeout(this.writeTimer);

        if (this.writeCount >= this.writeThreshold) {
            this._writeQueueToFile();
        } else this.writeTimer = setTimeout(() => {
            this._writeQueueToFile();
        }, this.writeDelayMs);
    }

    protected _writeQueueToFile() {
        return writeFile(this.path, JSON.stringify(this.value, undefined, 2)).then(() => { this.writeCount = 0; return true; });
    }
}