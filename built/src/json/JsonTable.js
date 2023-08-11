"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonTable = void 0;
const fs_1 = require("fs");
const Table_1 = require("../Table");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
const path_1 = __importDefault(require("path"));
const utilities_1 = require("../utilities");
const stringifyOpts = {
    space: 2,
};
const DEFAULT_DIRECTORY = './devDb/';
const fileExt = '.tablet.json';
class JsonTable extends Table_1.Table {
    /**
     *
     * @param name the name of the table, this is used to name the local file
     * @param fileDir where to store the table data
     */
    constructor(name, fileDir) {
        super(name);
        this.name = name;
        this.cache = new Map();
        this.bufferWrite = false;
        this.ioBufferInterval = setInterval(() => this.ioBuffer(), 1000);
        this.retries = 0;
        this.dirCheck = false;
        this.touchDir = () => {
            if (this.dirCheck)
                return;
            if (!(0, fs_1.existsSync)(this.dirPath)) {
                (0, fs_1.mkdirSync)(this.dirPath, { recursive: true });
            }
            this.dirCheck = true;
        };
        this.dirPath = fileDir == 'DEFAULT' ? DEFAULT_DIRECTORY : fileDir;
        this.filePath = path_1.default.join(this.dirPath.toString(), name + fileExt);
        this.summary['FILE'] = { value: this.filePath.toString() };
        this.loadPromise = new Promise((resolve) => {
            this.loadTable();
            resolve(true);
        });
    }
    /**
     * @returns how many entries are in this table
     */
    numEntries() {
        return this.cache.size;
    }
    /**
     * @returns an array of this table's entries
     */
    toArray() {
        const arr = [];
        this.cache.forEach((value) => {
            arr.push(value);
        });
        arr.sort((a, b) => {
            return a._id.toString().localeCompare(b._id.toString());
        });
        return arr;
    }
    /**
     * filters the table by a given filter function
     * @param filter the filter function
     * @returns an array of matching entries
     */
    async filter(filter) {
        const entries = [];
        this.cache.forEach((element) => {
            if (filter(element))
                entries.push(element);
        });
        return entries;
    }
    /**
     * find a given entry based on a function
     * @param finder the function used to evaluate entries
     * @returns an entry matching the function
     */
    async find(finder) {
        let found;
        this.cache.forEach((entry) => {
            if (found)
                return found;
            if (finder(entry))
                found = entry;
        });
        return found;
    }
    /**
     *
     * @param id the id of the record to fetch
     * @param forceRefresh if the table should be reinstantiated, does nothing for json
     * @returns fthe matching entry, or null if no id matched
     */
    async fetch(id) {
        const cachedVal = this.cache.get(id);
        if (cachedVal !== undefined)
            return cachedVal;
        return null;
    }
    /**
     *
     * @returns an array of all values in the table
     */
    async fetchAll() {
        return Array.from(this.cache.values());
    }
    /**
     * CReates or UPDATEs an entry in the table
     * @param entry the entry to crupdate
     * @returns the entry, now updated in the table
     */
    async crupdate(entry) {
        if (!this.validate(entry))
            throw `${entry} is not valid`;
        this.cache.set(entry._id, entry);
        this.bufferWrite = true;
        this.summary.UPDATES.value++;
        return entry;
    }
    /**
     * CReates or UPDATEs multiple entries
     * @param entries the entries to crupdate
     * @returns an array of successfully crupdated entries
     */
    async crupdates(entries) {
        const successfulCrupdates = [];
        entries.forEach(async (entry) => {
            try {
                const success = await this.crupdate(entry);
                successfulCrupdates.push(success);
            }
            catch (err) {
                console.log(err);
                this.summary.ERRORS.value++;
            }
        });
        return successfulCrupdates;
    }
    /**
     *
     * @param entry the entry to delete
     * @returns true if the deletion was successful
     */
    async delete(entry) {
        this.bufferWrite = true;
        return this.cache.delete(entry._id);
    }
    ioBuffer() {
        if (this.bufferWrite) {
            this.saveTable();
            this.bufferWrite = false;
        }
    }
    saveTable() {
        this.touchDir();
        const savable = {
            __name: this.name,
            _lastUpdate: (0, utilities_1.nowString)(),
            data: this.toArray(),
        };
        const stringifiedTable = (0, json_stable_stringify_1.default)(savable, stringifyOpts);
        try {
            (0, fs_1.writeFileSync)(this.filePath, stringifiedTable);
            this.summary['SAVED_ENTRIES'] = { value: this.numEntries() };
        }
        catch (err) {
            this.summary.ERRORS.value++;
            console.log(err);
        }
    }
    loadTable() {
        this.touchDir();
        let fileOut;
        try {
            fileOut = JSON.parse((0, fs_1.readFileSync)(this.filePath, 'utf-8').toString());
            if (!Array.isArray(fileOut.data))
                throw `${this.filePath} data is formatted incorrectly, needs to be an array`;
            fileOut.data.forEach((entry) => {
                this.crupdate(entry).catch((err) => {
                    console.log(err);
                });
            });
            this.summary.READS.value = fileOut.data.length;
            return this;
        }
        catch (err) {
            if (err instanceof Error) {
                if (err.message ==
                    `ENOENT: no such file or directory, open '${this.filePath}'`) {
                    if (this.retries > 3)
                        throw `TABLET_ERROR: JsonTable.load failed after ${this.retries} attempts`;
                    this.retries++;
                    this.saveTable();
                    return this.loadTable();
                }
                else if (err.name.substring(0, 11) == 'SyntaxError') {
                    throw `TABLET_ERROR: JSONTABLE FILE ${this.filePath} IS INCORRECTLY FORMATTED`;
                }
                else {
                    console.log(err.message.substring(0, 10));
                    console.log(err.name.substring(0, 10));
                    this.summary.ERRORS.value++;
                    throw err;
                }
            }
            else
                throw err;
        }
    }
}
exports.JsonTable = JsonTable;
