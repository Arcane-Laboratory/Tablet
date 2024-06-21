import { RateLimiter } from 'limiter';
import { GoogleSpreadsheet as Spreadsheet } from 'google-spreadsheet';
interface gKey {
    private_key: string;
    client_email: string;
}
interface spreadsheetInfo {
    gKey: gKey;
    spreadsheetId: string;
}
declare const limiter: RateLimiter;
declare const loadSpreadsheet: (spreadsheetInfo: spreadsheetInfo) => Promise<Spreadsheet>;
declare const parseVal: (val: string) => number | string | boolean;
export { gKey, spreadsheetInfo, limiter, loadSpreadsheet, parseVal };
//# sourceMappingURL=sheetsUtil.d.ts.map