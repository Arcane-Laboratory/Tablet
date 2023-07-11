import { RateLimiter } from 'limiter'
import { GoogleSpreadsheet as Spreadsheet } from 'google-spreadsheet'

interface gKey {
  private_key: string
  client_email: string
}

interface spreadsheetInfo {
  gKey: gKey
  spreadsheetId: string
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
    console.log(` Tablet: Loading spreadsheet '${id}'`)
    const loadPromise = load(spreadsheetInfo)
    spreadsheetIdMap.set(id, loadPromise)
    return loadPromise
  } catch (err) {
    if (err) console.log(err)
  }
}

const load = async (spreadsheetInfo: spreadsheetInfo): Promise<Spreadsheet> => {
  const spreadsheet = new Spreadsheet(spreadsheetInfo.spreadsheetId)
  await spreadsheet.useServiceAccountAuth(spreadsheetInfo.gKey)
  await spreadsheet.loadInfo()
  console.log(` Tablet: Connected to spreadsheet '${spreadsheet.title}'`)
  return spreadsheet
}

const parseVal = (val: string): number | string | boolean => {
  let parsedVal: unknown
  try {
    parsedVal = JSON.parse(val)
  } catch {
    parsedVal = val
  }
  if (parsedVal == 'TRUE') parsedVal = true
  if (parsedVal == 'FALSE') parsedVal = false
  return parsedVal as any
}

export { gKey, spreadsheetInfo, limiter, loadSpreadsheet, parseVal }
