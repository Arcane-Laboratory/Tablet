"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonTable = void 0;
const fs_1 = require("fs");
const Table_1 = require("./Table");
const json_stable_stringify_1 = require("json-stable-stringify");
const stringifyOpts = {
    space: 2,
};
const fileDir = './devDb/';
class JsonTable extends Table_1.Table {
    constructor(name, filePath) {
        super(name);
        this.name = name;
        this.bufferWrite = false;
        this.ioBufferInterval = setInterval(() => this.ioBuffer(), 1000);
        this.filePath = filePath ? filePath : fileDir + `${name}.gha.json`;
    }
    numEntries() {
        return this.cache.size;
    }
    toArray() {
        const arr = [];
        this.cache.forEach((value) => {
            arr.push(value);
        });
        arr.sort((a, b) => a.id.localeCompare(b.id));
        return arr;
    }
    async fetch(id, forceRefresh) {
        const cachedVal = this.cache.get(id);
        if (cachedVal !== undefined)
            return cachedVal;
        return null;
    }
    async crupdate(entry) {
        if (!this.validate(entry))
            throw `${entry} is not valid`;
        this.cache.set(entry.id, entry);
        this.bufferWrite = true;
        return entry;
    }
    async crupdates(entries) {
        const successfulCrupdates = [];
        entries.forEach(async (entry) => {
            try {
                const success = await this.crupdate(entry);
                successfulCrupdates.push(success);
            }
            catch (err) {
                console.log(err);
            }
        });
        return successfulCrupdates;
    }
    async delete(entry) {
        this.bufferWrite = true;
        return this.cache.delete(entry.id);
    }
    ioBuffer() {
        if (this.bufferWrite) {
            this.saveTable();
            this.bufferWrite = false;
        }
    }
    saveTable() {
        touchDir();
        const savable = {
            name: this.name,
            lastUpdate: new Date().toLocaleDateString(),
            data: this.toArray(),
        };
        const stringifiedTable = (0, json_stable_stringify_1.stringify)(savable, stringifyOpts);
        try {
            (0, fs_1.writeFileSync)(this.filePath, stringifiedTable);
            console.log(`saved table '${this.name}' with ${this.numEntries()} entries`);
        }
        catch (err) {
            console.log(err);
        }
    }
    loadTable() {
        touchDir();
        const fileOut = JSON.parse((0, fs_1.readFileSync)(this.filePath, 'utf-8').toString());
        if (!Array.isArray(fileOut.data))
            throw `${this.filePath} data is formatted incorrectly, needs to be an array`;
        fileOut.data.forEach((entry) => {
            this.crupdate(entry);
        });
        console.log(`read ${fileOut.data.length} entries from file`);
        return this;
    }
}
exports.JsonTable = JsonTable;
let dirCheck = false;
const touchDir = () => {
    if (dirCheck)
        return;
    if (!(0, fs_1.existsSync)(fileDir)) {
        (0, fs_1.mkdirSync)(fileDir, { recursive: true });
    }
    dirCheck = true;
};
