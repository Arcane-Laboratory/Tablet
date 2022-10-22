/// <reference types="node" />
import { PathLike } from 'fs';
import { Table, tableData } from './Table';
declare class JsonTable<T extends tableData> extends Table<T> {
    readonly name: string;
    readonly filePath: PathLike;
    private bufferWrite;
    private ioBufferInterval;
    constructor(name: string, filePath?: PathLike);
    numEntries(): number;
    toArray(): T[];
    fetch(id: string, forceRefresh?: boolean): Promise<T | null>;
    crupdate(entry: T): Promise<T>;
    crupdates(entries: Array<T>): Promise<T[]>;
    delete(entry: T): Promise<boolean>;
    private ioBuffer;
    private saveTable;
    private loadTable;
}
export { JsonTable };
//# sourceMappingURL=JsonTable.d.ts.map