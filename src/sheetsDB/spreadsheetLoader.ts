import { GoogleSpreadsheet } from 'google-spreadsheet'
import { parseErr } from '../util/errorUtil'
import { log } from '../util/_utilIndex'
import { gKey } from './readGKey'

// https://docs.google.com/spreadsheets/d/1lmy0kyOahtDg-TWq7SGLD4hMrBCtSzOsWnMOr4_iemY/edit#gid=0
const spreadsheetList: Array<GoogleSpreadsheet> = []

const loadSpreadsheets = async (spreadsheetIds: Array<string>, gKey: gKey) => {
  // const promises = Array<Promise<any>>
  for (let i = 0; i < spreadsheetIds.length; i++) {
    log(`spreadsheetLoader loading ${spreadsheetIds[i]}`)
    const doc = new GoogleSpreadsheet(spreadsheetIds[i])
    try {
      await doc.useServiceAccountAuth(gKey)
      await doc.loadInfo()
      log(`spreadsheetLoader connected to ${doc.title}`)
      spreadsheetList[doc.title] = doc
    } catch (err) {
      parseErr('loadSpreadsheet Error', err)
      throw err
    }
  }
}

export { loadSpreadsheets, spreadsheetList }
