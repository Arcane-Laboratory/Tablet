declare const tableToString: (tableName: string) => string;
declare const tableList: () => Array<string>;
declare const allEntities: () => {
    ctorName: string;
    cacheSize: number;
    cache: Map<string, any>;
}[];
declare const entityList: () => string;
declare const entityCache: (entityName: string) => string;
export { tableToString, tableList, entityList, allEntities, entityCache };
//# sourceMappingURL=commands.d.ts.map