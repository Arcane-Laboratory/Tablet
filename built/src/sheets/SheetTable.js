"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetTable = void 0;
const Table_1 = require("../Table");
const utilities_1 = require("../utilities");
const sheetsUtil_1 = require("./sheetsUtil");
const crypto_1 = require("crypto");
class SheetTable extends Table_1.Table {
    /**
     *
     * @param name the name of the table, used to identify a the proper tab on the spreadsheet
     * @param spreadsheetInfo the info used for finding the spreadsheet, including it's id and an auth key
     * @param exampleEntry an example entry on the sheet, only the object keys are used for creating the headers, this object is not saved
     */
    constructor(name, // also used as spreadsheet tab name
    spreadsheetInfo, exampleEntry) {
        super(name);
        this.name = name;
        this.spreadsheetInfo = spreadsheetInfo;
        this.headers = ['id', 'createdAt', 'lastUpdate'];
        /*
         * Load the class sheet
         * Create a new sheet if not found
         */
        this.getOrCreateSheet = async () => {
            if (!this.spreadsheet)
                throw new Error(`can't get a sheet without spreadsheet ${this.name}`);
            let sheet = this.spreadsheet.sheetsByTitle[this.name];
            if (!sheet) {
                try {
                    sheet = await this.spreadsheet.addSheet({ title: this.name });
                }
                catch (err) {
                    console.log(`Sheet Creation Failed for ${this.name}`);
                    this.summary.ERRORS.value++;
                    console.log(err);
                }
            }
            return sheet;
        };
        /*
         * Sync the class Headers
         * Add any property types
         * Must manually delete old
         */
        this.syncSheetHeaders = async () => {
            const sheetHeaders = [];
            try {
                // try to get the header row and check all of it's values
                await this.sheet.loadHeaderRow();
                this.sheet.headerValues.forEach((header) => sheetHeaders.push(header));
            }
            catch (err) {
                // if the error was about no values in the header row, it's okay because we are about to fill them!
                if (!(err instanceof Error &&
                    err.message ==
                        'No values in the header row - fill the first row with header values before trying to interact with rows'))
                    throw err; // something wack happened
            }
            this.headers.forEach((header) => {
                if (!sheetHeaders?.includes(header)) {
                    sheetHeaders.push(header);
                }
            });
            await this.sheet.setHeaderRow(sheetHeaders);
            return true;
        };
        /*
         * Reload rows
         */
        this.loadRows = async () => {
            try {
                this.rows = await this.sheet.getRows();
                return true;
            }
            catch (err) {
                this.summary.ERRORS.value++;
                console.log(err);
                return false;
            }
        };
        this.findRowIndexById = (id) => {
            const index = this.rows.findIndex((row) => (0, sheetsUtil_1.parseVal)(row.id).toString() == id.toString());
            return index;
        };
        this.spreadsheetId = spreadsheetInfo.spreadsheetId;
        Object.keys(exampleEntry).forEach((key) => {
            if (this.headers.find((header) => header == key) == undefined)
                this.headers.push(key);
        });
        this.loadPromise = this.load();
        this.loadPromise
            .then(() => {
            this.summary['SPREADSHEET'] = this.spreadsheet.title;
        })
            .catch((err) => {
            console.log(`error loading ${this.name}`);
            console.log(err);
        });
    }
    async crupdate(entry, changes = false) {
        if (!entry.id)
            entry.id == (0, crypto_1.randomUUID)();
        const updateExisting = await this.update(entry, changes);
        if (updateExisting)
            return entry;
        else {
            const create = await this.add(entry);
            return create == false ? create : entry;
        }
    }
    async crupdates(entries) {
        const crupdates = await Promise.all(entries.map(async (entry) => {
            return await this.crupdate(entry);
        }));
        return crupdates;
    }
    async add(entry) {
        await this.loadPromise;
        await sheetsUtil_1.limiter.removeTokens(1);
        const now = (0, utilities_1.nowString)();
        try {
            const flatEntry = { lastUpdate: now, createdAt: now };
            Object.keys(entry).forEach((key) => {
                flatEntry[key] = JSON.stringify(entry[key]);
            });
            await this.sheet.addRow({ ...flatEntry }, { raw: true, insert: false });
            this.rows = await this.sheet.getRows();
            return true;
        }
        catch (err) {
            console.log(`error adding entry to ${this.name}`);
            console.log(entry);
            console.log(err);
            throw err;
            return false;
        }
    }
    async update(entry, changes = false) {
        await this.loadPromise;
        const index = this.findRowIndexById(entry.id);
        if (index === -1)
            return null;
        if (this.hasChanges(entry))
            changes = true;
        if (changes) {
            try {
                await sheetsUtil_1.limiter.removeTokens(1);
                this.rows[index].lastUpdate = (0, utilities_1.nowString)();
                await this.rows[index].save({ raw: true });
                return true;
            }
            catch (err) {
                console.log(err);
                this.summary.ERRORS.value++;
                return true;
            }
        }
        else {
            return true;
        }
    }
    async delete(entry) {
        await this.loadPromise;
        const id = entry.id;
        const index = this.findRowIndexById(id);
        if (!(index == -1))
            return false;
        const foundEntry = this.rows[index];
        await sheetsUtil_1.limiter.removeTokens(1);
        try {
            await foundEntry.delete();
            this.rows = await this.sheet.getRows();
            return true;
        }
        catch (err) {
            this.summary.ERRORS.value++;
            console.log(err);
            return false;
        }
    }
    async fetch(id) {
        await this.loadPromise;
        const index = this.findRowIndexById(id);
        if (index == -1)
            return null;
        return this.parseRow(this.rows[index]);
    }
    async fetchAll() {
        await this.loadPromise;
        return this.toArray();
    }
    async filter(filter) {
        await this.loadPromise;
        const data = this.toArray();
        return data.filter(filter);
    }
    async find(finder) {
        await this.loadPromise;
        const data = this.toArray();
        const foundData = data.find(finder);
        return foundData;
    }
    numEntries() {
        return this.rows.length;
    }
    toArray() {
        const array = [];
        this.rows.forEach((row) => {
            const parsedRow = this.parseRow(row);
            if (parsedRow != null)
                array.push(parsedRow);
        });
        return array;
    }
    hasChanges(entry, index = -1) {
        let changes = false;
        if (index === -1)
            index = this.findRowIndexById(entry.id);
        if (index === -1)
            return false;
        this.headers.forEach((header) => {
            const flatValue = JSON.stringify(entry[header]);
            if (header != 'lastUpdate' &&
                flatValue &&
                this.rows[index][header] != flatValue) {
                this.rows[index][header] = flatValue;
                changes = true;
            }
        });
        return changes;
    }
    async load() {
        this.spreadsheet = await (0, sheetsUtil_1.loadSpreadsheet)(this.spreadsheetInfo);
        this.sheet = await this.getOrCreateSheet();
        await this.syncSheetHeaders();
        await this.loadRows();
        return true;
    }
    parseRow(row) {
        const parsedObject = {};
        let failure = false;
        this.headers.forEach((header) => {
            if (failure)
                return;
            try {
                parsedObject[header] = (0, sheetsUtil_1.parseVal)(row[header]);
            }
            catch (err) {
                console.log(`unable to parse ${header} of ${this.name} at row ${row.rowNumber}:`);
                console.log(row[header]);
                failure = true;
                return null;
            }
        });
        return parsedObject;
    }
}
exports.SheetTable = SheetTable;
