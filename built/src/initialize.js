"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonTable_1 = require("./JsonTable");
const initializeGiha = () => {
    /******************
     * WORLD SETTINGS *
     *****************/
    new JsonTable_1.JsonTable('zone');
    new JsonTable_1.JsonTable('building');
    new JsonTable_1.JsonTable('generator_config');
    /***************
     * WORLD STATE *
     **************/
    new JsonTable_1.JsonTable('village');
};
