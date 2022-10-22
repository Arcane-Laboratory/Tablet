"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProtoItems = void 0;
const protoItem_1 = require("../items/protoItem");
const table_1 = require("../tables/table");
const componentizedSheetLoader_1 = require("./componentizedSheetLoader");
const dbName = '🎆giha_DB';
const protoBagComponentTable = new table_1.GihaTable('BagComponents', new Map()
    .set('minCapacity', table_1.PARSABLE_TYPE.NUMBER)
    .set('maxCapacity', table_1.PARSABLE_TYPE.NUMBER)
    .set('type', table_1.PARSABLE_TYPE.STRING), true);
const protoWeaponComponentTable = new table_1.GihaTable('WeaponComponents', new Map()
    .set('minDmg', table_1.PARSABLE_TYPE.STRING)
    .set('maxDmg', table_1.PARSABLE_TYPE.STRING)
    .set('type', table_1.PARSABLE_TYPE.STRING), true);
const protoItemComponentTables = [
    protoWeaponComponentTable,
    protoBagComponentTable,
];
const loadProtoItems = async () => (0, componentizedSheetLoader_1.loadComponentizedTable)(protoItem_1.protoItems, 'ProtoItem_Component_Link', protoItemComponentTables, dbName);
exports.loadProtoItems = loadProtoItems;
