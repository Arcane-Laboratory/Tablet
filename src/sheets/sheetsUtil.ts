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

const parseRow = <T extends tableData>(row: Row): T => {
  const keys = Object.keys(row)
  const keyValuePairs = keys.map((key) => `${key}: ${JSON.parse(row[key])}`)
  const stringObject = '{' + keyValuePairs.join(',\n')
  return JSON.parse(stringObject) as T
}

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1000 })

const spreadsheetIdMap = new Map<string, Promise<Spreadsheet>>()

const loadSpreadsheet = async (
  spreadsheetInfo: spreadsheetInfo
): Promise<Spreadsheet> => {
  const id = spreadsheetInfo.spreadsheetId
  const loadedSpreadsheet = spreadsheetIdMap.get(id)
  if (loadedSpreadsheet) return loadedSpreadsheet

  try {
    console.log(`loading ${id}`)
    const loadPromise = load(spreadsheetInfo)
    spreadsheetIdMap.set(id, loadPromise)
    return loadPromise
  } catch (err) {
    if (err) console.log(err)
  }
}

const load = async (spreadsheetInfo: spreadsheetInfo): Promise<Spreadsheet> => {
  console.log('triggering load')
  const spreadsheet = new Spreadsheet(spreadsheetInfo.spreadsheetId)
  await spreadsheet.useServiceAccountAuth(spreadsheetInfo.gKey)
  await spreadsheet.loadInfo()
  console.log(`connected to ${spreadsheet.title}`)
  return spreadsheet
}

export {
  gKey,
  spreadsheetInfo,
  parseRow as rowToData,
  limiter,
  loadSpreadsheet,
}
