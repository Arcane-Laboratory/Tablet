"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetLoaderModule = void 0;
const spreadsheetLoader_1 = require("../db_sheets/spreadsheetLoader");
const readGKey_1 = require("../db_sheets/readGKey");
const statusComponentLink_1 = require("./statusComponentLink");
const protoItemsComponentLink_1 = require("./protoItemsComponentLink");
exports.sheetLoaderModule = {
    name: 'Sheet Loader',
    type: 'SHEET_LOADER',
    description: '',
    networkRequired: true,
    dependentModuleIds: [
        'UTIL',
        'DATABASE',
        'ITEMS',
        'ITEM_COMPONENTS',
        'STATUS',
    ],
    commands: [],
    initializer: async () => {
        const sheetIds = ['1lmy0kyOahtDg-TWq7SGLD4hMrBCtSzOsWnMOr4_iemY'];
        await (0, spreadsheetLoader_1.loadSpreadsheets)(sheetIds, (0, readGKey_1.getGkey)());
        await (0, protoItemsComponentLink_1.loadProtoItems)();
        await (0, statusComponentLink_1.loadStatuses)();
    },
};
