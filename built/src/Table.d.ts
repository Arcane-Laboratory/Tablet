import { tableData } from '../types/tableTypes';
declare abstract class Table<T extends tableData> {
    readonly name: string;
    static all: Map<string, Table<tableData>>;
    protected cache: Map<string, T>;
    constructor(name: string);
    abstract numEntries(): number;
    abstract toArray(): Array<T>;
    abstract fetch(id: string, forceRefresh?: boolean): Promise<T | null>;
    abstract crupdate(entry: T): Promise<T>;
    abstract crupdates(entries: Array<T>): Promise<Array<T>>;
    abstract delete(entry: T): Promise<boolean>;
    toString(): string;
    protected validate(entry: T): boolean;
    private static idDataStringify;
}
export { Table, tableData };
//# sourceMappingURL=Table.d.ts.map