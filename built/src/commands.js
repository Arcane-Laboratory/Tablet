"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableList = exports.printTable = void 0;
const Table_1 = require("./Table");
const printTable = (tableName) => {
    const table = Table_1.Table.all.get(tableName);
    if (table == undefined)
        return 'undefined';
    else
        return table.toString();
};
exports.printTable = printTable;
const tableList = () => {
    return Table_1.Table.all.keys.toString();
};
exports.tableList = tableList;
