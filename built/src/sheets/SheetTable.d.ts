import { Table, tableData } from '../Table';
import { spreadsheetInfo } from './sheetsUtil';
export declare class SheetTable<T extends tableData> extends Table<T> {
    readonly name: string;
    readonly spreadsheetInfo: spreadsheetInfo;
    readonly spreadsheetId: string;
    private spreadsheet;
    private sheet;
    loadPromise: Promise<boolean>;
    private rows;
    private headers;
    /**
     *
     * @param name the name of the table, used to identify a the proper tab on the spreadsheet
     * @param spreadsheetInfo the info used for finding the spreadsheet, including it's id and an auth key
     * @param exampleEntry an example entry on the sheet, only the object keys are used for creating the headers, this object is not saved
     */
    constructor(name: string, // also used as spreadsheet tab name
    spreadsheetInfo: spreadsheetInfo, exampleEntry: T);
    crupdate(entry: T, changes?: boolean): Promise<T | false>;
    crupdates(entries: T[]): Promise<Array<T | false>>;
    private add;
    private update;
    delete(entry: T): Promise<boolean>;
    fetch(_id: string): Promise<T | null>;
    fetchAll(): Promise<Array<T>>;
    filter(filter: (entry: T) => boolean): Promise<T[]>;
    find(finder: (entry: T) => boolean): Promise<T | undefined>;
    numEntries(): Promise<number>;
    toArray(): Promise<T[]>;
    private hasChanges;
    private load;
    private getOrCreateSheet;
    private syncSheetHeaders;
    private loadRows;
    private parseRow;
    private findRowIndexById;
}
//# sourceMappingURL=SheetTable.d.ts.map