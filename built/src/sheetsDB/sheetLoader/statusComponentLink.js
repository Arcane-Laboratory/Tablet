"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadStatuses = void 0;
const status_1 = require("../statuses/status");
const table_1 = require("../tables/table");
const componentizedSheetLoader_1 = require("./componentizedSheetLoader");
const dbName = '🎆giha_DB';
const protoResistanceComponentTable = new table_1.GihaTable('ResistanceModComponents', new Map()
    .set('magicType', table_1.PARSABLE_TYPE.MAGIC_TYPE)
    .set('damageMultiplier', table_1.PARSABLE_TYPE.NUMBER), true);
const protoStatusComponentTables = [protoResistanceComponentTable];
const loadStatuses = async () => (0, componentizedSheetLoader_1.loadComponentizedTable)(status_1.statuses, 'ProtoStatus_Component_Link', protoStatusComponentTables, dbName);
exports.loadStatuses = loadStatuses;
