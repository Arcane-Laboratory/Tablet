import { GoogleSpreadsheet } from 'google-spreadsheet';
import { gKey } from './readGKey';
declare const spreadsheetList: Array<GoogleSpreadsheet>;
declare const loadSpreadsheets: (spreadsheetIds: Array<string>, gKey: gKey) => Promise<void>;
export { loadSpreadsheets, spreadsheetList };
//# sourceMappingURL=spreadsheetLoader.d.ts.map