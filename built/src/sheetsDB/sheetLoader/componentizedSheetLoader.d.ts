import { GihaTable } from '../tables/table';
declare const loadComponentizedTable: <T extends componentizedIdData, U extends componentData>(table: GihaTable<T>, linkTableName: string, componentTables: GihaTable<U>[], dbName: string) => Promise<void>;
export { loadComponentizedTable };
//# sourceMappingURL=componentizedSheetLoader.d.ts.map