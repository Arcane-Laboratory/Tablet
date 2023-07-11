import { tableData } from '../types/tableTypes';
import { tableSummary } from './utilities';
declare abstract class Table<T extends tableData> {
    readonly name: string;
    static all: Map<string, Table<tableData>>;
    abstract loadPromise: Promise<boolean>;
    constructor(name: string);
    abstract numEntries(): number;
    abstract toArray(): Array<T>;
    abstract fetch(id: string, forceRefresh?: boolean): Promise<T | null>;
    abstract fetchAll(forceRefresh?: boolean): Promise<Array<T> | false>;
    abstract crupdate(entry: T): Promise<T | false>;
    abstract crupdates(entries: Array<T>): Promise<Array<T | false>>;
    abstract delete(entry: T): Promise<boolean>;
    abstract filter(filter: (entry: T) => boolean): Promise<Array<T>>;
    abstract find(finder: (entry: T) => boolean): Promise<T | undefined>;
    toString(): string;
    /**
     *
     * @param targetTable the table to clone this one into
     * @returns a promise of all crupdate calls to the target Table
     */
    clone(targetTable: Table<T>, verbose?: boolean): Promise<(false | Awaited<T>)[]>;
    /**
     *
     * @param entry an entry on a table
     * @returns true if the entry is valid
     */
    protected validate(entry: T): boolean;
    protected summary: tableSummary;
    protected generateSummary(): tableSummary;
    /**
     *
     * @param verbose if true, shows everything, otherwise only shows impactful items
     * @returns a string, the summary of what Table has done so far
     */
    static getSummary(verbose?: false): string;
}
export { Table, tableData };
//# sourceMappingURL=Table.d.ts.map