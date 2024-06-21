import { Table, tableData } from '../Table';
import { MongoClient } from 'mongodb';
declare class MongoTable<T extends tableData> extends Table<T> {
    readonly client: MongoClient;
    readonly dbName: string;
    readonly name: string;
    loadPromise: Promise<boolean>;
    private collection;
    constructor(client: MongoClient, dbName: string, name: string);
    load(): Promise<boolean>;
    numEntries(): Promise<number>;
    toArray(): Promise<Array<T>>;
    fetch(id: string, forceRefresh?: boolean): Promise<T | null>;
    fetchAll(forceRefresh?: boolean): Promise<Array<T> | false>;
    crupdate(entry: T): Promise<T | false>;
    crupdates(entries: Array<T>): Promise<Array<T | false>>;
    delete(entry: T): Promise<boolean>;
    filter(filter: (entry: T) => boolean): Promise<Array<T>>;
    find(finder: (entry: T) => boolean): Promise<T | undefined>;
}
export { MongoTable };
//# sourceMappingURL=MongoTable.d.ts.map