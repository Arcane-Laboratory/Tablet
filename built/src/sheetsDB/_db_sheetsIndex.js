"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbSheetsModule = void 0;
exports.dbSheetsModule = {
    name: 'db_sheets',
    type: 'DATABASE',
    networkRequired: true,
    description: 'database module which supports storage in a google sheet',
    dependentModuleIds: ['UTIL', 'TABLES'],
    commands: [],
};
