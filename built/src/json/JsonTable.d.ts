/// <reference types="node" />
import { PathLike } from 'fs';
import { Table, tableData } from '../Table';
declare class JsonTable<T extends tableData> extends Table<T> {
    readonly name: string;
    readonly dirPath: PathLike;
    loadPromise: Promise<boolean>;
    readonly filePath: PathLike;
    private cache;
    private bufferWrite;
    private ioBufferInterval;
    /**
     *
     * @param name the name of the table, this is used to name the local file
     * @param fileDir where to store the table data
     */
    constructor(name: string, fileDir: PathLike | 'DEFAULT');
    /**
     * @returns how many entries are in this table
     */
    numEntries(): number;
    /**
     * @returns an array of this table's entries
     */
    toArray(): T[];
    /**
     * filters the table by a given filter function
     * @param filter the filter function
     * @returns an array of matching entries
     */
    filter(filter: (entry: T) => boolean): Promise<Array<T>>;
    /**
     * find a given entry based on a function
     * @param finder the function used to evaluate entries
     * @returns an entry matching the function
     */
    find(finder: (entry: T) => boolean): Promise<T | undefined>;
    /**
     *
     * @param id the id of the record to fetch
     * @param forceRefresh if the table should be reinstantiated, does nothing for json
     * @returns fthe matching entry, or null if no id matched
     */
    fetch(id: string): Promise<T | null>;
    /**
     *
     * @returns an array of all values in the table
     */
    fetchAll(): Promise<Array<T>>;
    /**
     * CReates or UPDATEs an entry in the table
     * @param entry the entry to crupdate
     * @returns the entry, now updated in the table
     */
    crupdate(entry: T): Promise<T>;
    /**
     * CReates or UPDATEs multiple entries
     * @param entries the entries to crupdate
     * @returns an array of successfully crupdated entries
     */
    crupdates(entries: Array<T>): Promise<T[]>;
    /**
     *
     * @param entry the entry to delete
     * @returns true if the deletion was successful
     */
    delete(entry: T): Promise<boolean>;
    private ioBuffer;
    private saveTable;
    private retries;
    private loadTable;
    private dirCheck;
    private touchDir;
}
export { JsonTable };
//# sourceMappingURL=JsonTable.d.ts.map