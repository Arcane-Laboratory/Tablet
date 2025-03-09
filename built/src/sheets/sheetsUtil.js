'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.parseVal = exports.loadSpreadsheet = exports.limiter = void 0
const limiter_1 = require('limiter')
const google_spreadsheet_1 = require('google-spreadsheet')
const limiter = new limiter_1.RateLimiter({
  tokensPerInterval: 1,
  interval: 1000,
})
exports.limiter = limiter
const spreadsheetIdMap = new Map()
const loadSpreadsheet = async (spreadsheetInfo) => {
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
exports.loadSpreadsheet = loadSpreadsheet
const load = async (spreadsheetInfo) => {
  const spreadsheet = new google_spreadsheet_1.GoogleSpreadsheet(
    spreadsheetInfo.spreadsheetId
  )
  await spreadsheet.useServiceAccountAuth(spreadsheetInfo.gKey)
  await spreadsheet.loadInfo()
  console.log(` Tablet: Connected to spreadsheet '${spreadsheet.title}'`)
  return spreadsheet
}
const parseVal = (val) => {
  let parsedVal
  try {
    parsedVal = JSON.parse(val)
  } catch {
    parsedVal = val
  }
  if (parsedVal == 'TRUE') parsedVal = true
  if (parsedVal == 'FALSE') parsedVal = false
  return parsedVal
}
exports.parseVal = parseVal
