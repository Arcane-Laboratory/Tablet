"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadComponentizedTable = void 0;
const sheetData_1 = require("../db_sheets/sheetData");
const table_1 = require("../tables/table");
const logUtil_1 = require("../util/logUtil");
const loadComponentizedTable = async (table, linkTableName, componentTables, dbName) => {
    const linkTable = new table_1.GihaTable(linkTableName, new Map()
        .set('id', table_1.PARSABLE_TYPE.STRING)
        .set('parentId', table_1.PARSABLE_TYPE.STRING)
        .set('componentDb', table_1.PARSABLE_TYPE.STRING)
        .set('componentId', table_1.PARSABLE_TYPE.STRING), true);
    const mainSheet = new sheetData_1.SheetData(dbName, table);
    const componentLinkSheet = new sheetData_1.SheetData(dbName, linkTable);
    const componentSheets = [];
    componentTables.forEach((componentTable) => {
        componentSheets.push(new sheetData_1.SheetData(dbName, componentTable));
    });
    const loadPromises = [];
    loadPromises.push(mainSheet.loadData());
    loadPromises.push(componentLinkSheet.loadData());
    componentSheets.forEach((compSheet) => loadPromises.push(compSheet.loadData()));
    await Promise.all(loadPromises);
    table.addEntries(mainSheet.getAll());
    linkTable.addEntries(componentLinkSheet.getAll());
    componentTables.forEach((componentTable) => {
        const compSheet = componentSheets.find((sheet) => sheet.table === componentTable);
        if (!compSheet)
            throw `could not find a sheet with name ${componentTable}`;
        componentTable.addEntries(compSheet.getAll());
    });
    linkTable.data.forEach((link) => {
        const entry = table.getEntryById(link.id);
        if (!entry)
            return (0, logUtil_1.warn)('componentizedSheetLoader', `no entry ${link.id} found in ${table.name}`);
        const componentTable = componentTables.find((componentTable) => componentTable.name == link.componentDb);
        if (!componentTable)
            return (0, logUtil_1.warn)('componentizedSheetLoader', `no componentTable named ${link.componentDb} found. Skipping link ${link.id} in table ${table.name}`);
        const component = componentTable.data.find((comp) => comp.id == link.componentId);
        if (!component)
            return (0, logUtil_1.warn)('componentizedSheetLoader', `no entry ${link.componentId} found in ${link.componentDb}. Skipping link ${link.id} in table ${table.name}`);
        if (!entry.components)
            entry.components = [];
        entry.components.push(component);
    });
};
exports.loadComponentizedTable = loadComponentizedTable;
