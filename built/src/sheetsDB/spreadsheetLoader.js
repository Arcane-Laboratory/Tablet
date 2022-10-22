"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spreadsheetList = exports.loadSpreadsheets = void 0;
const google_spreadsheet_1 = require("google-spreadsheet");
const errorUtil_1 = require("../util/errorUtil");
const _utilIndex_1 = require("../util/_utilIndex");
// https://docs.google.com/spreadsheets/d/1lmy0kyOahtDg-TWq7SGLD4hMrBCtSzOsWnMOr4_iemY/edit#gid=0
const spreadsheetList = [];
exports.spreadsheetList = spreadsheetList;
const loadSpreadsheets = async (spreadsheetIds, gKey) => {
    // const promises = Array<Promise<any>>
    for (let i = 0; i < spreadsheetIds.length; i++) {
        (0, _utilIndex_1.log)(`spreadsheetLoader loading ${spreadsheetIds[i]}`);
        const doc = new google_spreadsheet_1.GoogleSpreadsheet(spreadsheetIds[i]);
        try {
            await doc.useServiceAccountAuth(gKey);
            await doc.loadInfo();
            (0, _utilIndex_1.log)(`spreadsheetLoader connected to ${doc.title}`);
            spreadsheetList[doc.title] = doc;
        }
        catch (err) {
            (0, errorUtil_1.parseErr)('loadSpreadsheet Error', err);
            throw err;
        }
    }
};
exports.loadSpreadsheets = loadSpreadsheets;
