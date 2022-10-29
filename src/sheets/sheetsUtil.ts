import { tableData } from '../Table'
import { RateLimiter } from 'limiter'
import {
  GoogleSpreadsheet as Spreadsheet,
  GoogleSpreadsheetRow as Row,
} from 'google-spreadsheet'

interface gKey {
  private_key: string
  client_email: string
}

interface spreadsheetInfo {
  gKey: gKey
  spreadsheetId: string
}

const rowToData = <T extends tableData>(row: Row): T => {
  const keys = Object.keys(row)
  const keyValuePairs = keys.map((key) => `${key}: ${JSON.parse(row[key])}`)
  const stringObject = '{' + keyValuePairs.join(',\n')
  return JSON.parse(stringObject) as T
}

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1000 })

const spreadsheets: Array<Spreadsheet> = []

const loadSpreadsheet = async (
  spreadsheetInfo: spreadsheetInfo
): Promise<Spreadsheet> => {
  const { gKey, spreadsheetId } = spreadsheetInfo
  const loadedSpreadsheet = spreadsheets.find(
    (sheet) => sheet.spreadsheetId == spreadsheetId
  )
  if (loadedSpreadsheet) return loadSpreadsheet

  console.log(`loading gSheet: ${spreadsheetId}`)
  const spreadsheet = new Spreadsheet(spreadsheetId)
  try {
    await spreadsheet.useServiceAccountAuth(gKey)
    await spreadsheet.loadInfo()
    spreadsheets.push(spreadsheet)
    console.log(`spreadsheetLoader connected to ${spreadsheet.title}`)
    return spreadsheet
  } catch (err) {
    console.log('err')
  }
}

export { gKey, spreadsheetInfo, rowToData, limiter, loadSpreadsheet }
