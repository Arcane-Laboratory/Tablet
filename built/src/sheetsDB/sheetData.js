'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.idData =
  exports.headerTypeMap =
  exports.PARSABLE_TYPE =
  exports.SheetData =
    void 0
const _tableIndex_1 = require('../tables/_tableIndex')
Object.defineProperty(exports, 'headerTypeMap', {
  enumerable: true,
  get: function () {
    return _tableIndex_1.headerTypeMap
  },
})
Object.defineProperty(exports, 'idData', {
  enumerable: true,
  get: function () {
    return _tableIndex_1.idData
  },
})
Object.defineProperty(exports, 'PARSABLE_TYPE', {
  enumerable: true,
  get: function () {
    return _tableIndex_1.PARSABLE_TYPE
  },
})
const _utilIndex_1 = require('../util/_utilIndex')
const spreadsheetLoader_1 = require('./spreadsheetLoader')
class SheetData {
  constructor(spreadsheetTitle, table) {
    /*
     * Add new row
     */
    this.add = async (values) => {
      values.lastEdit = new Date().toString()
      const keys = Object.keys(values)
      const sheetRowInput = []
      keys.forEach((key) => {
        sheetRowInput[key] = values[key].toString()
      })
      await this.sheet.addRow(sheetRowInput)
    }
    /*
     * Get object by id
     */
    this.getById = (id) => {
      const row = this.getRowById(id)
      if (!row) return undefined
      return this.parseRow(row)
    }
    this.getRowById = (id) => {
      const found = this.rows?.find((row) => row.id == id)
      return found
    }
    this.getAll = () => {
      const data = []
      this.rows.forEach((row) => {
        try {
          data.push(this.parseRow(row))
        } catch (err) {
          console.log(err)
          ;(0, _utilIndex_1.warn)(
            'sheetData',
            `row ${row.id} skipped in ${this.tabTitle}`
          )
        }
      })
      return data
    }
    this.parseRow = (row) => {
      const rowObj = {}
      this.headerTypeMap.forEach((type, header) => {
        const datum = row[header]
        if (!datum)
          throw `row ${row['id']} is missing value for header "${header}"`
        rowObj[header] = (0, _tableIndex_1.parseType)(row[header], type)
      })
      return rowObj
    }
    /*
     * Update row
     * Or add if new
     */
    this.updateOrAdd = async (values) => {
      const row = this.getRowById(values.id)
      if (row) {
        this.headerTypeMap.forEach((_key, header) => {
          if (values[header]) {
            row[header] = values[header]
          }
        })
        row.lastUpdate = new Date().toString()
        await row.save()
      } else {
        this.add(values)
      }
      return true
    }
    /*
     * Load saved data
     */
    this.loadData = async () => {
      this.spreadsheet = spreadsheetLoader_1.spreadsheetList[this.name]
      if (!this.spreadsheet)
        throw `no spreadsheet named ${this.name} found in sheetList. ${this.tabTitle} sheetDb was not initialized`
      this.sheet = this.spreadsheet.sheetsByTitle[this.tabTitle]
      if (!this.sheet) await this.createSheet()
      await this.syncSheetHeaders()
      this.rows = await this.sheet.getRows()
      ;(0, _utilIndex_1.log)(`Sheet Tab Loaded: ${this.tabTitle}`)
      return true
    }
    /*
     * Load the class sheet
     * Create a new sheet if not found
     */
    this.createSheet = async () => {
      if (!this.sheet) {
        const title = this.tabTitle
        ;(0, _utilIndex_1.log)(`creating sheet with tab name '${title}'`)
        this.sheet = await this.spreadsheet.addSheet({ title })
      }
    }
    /*
     * Sync the class Headers
     * Add any property types
     * Must manually delete old
     */
    this.syncSheetHeaders = async () => {
      const savedHeaders = this.sheet.headerValues
      const newHeaders = []
      this.headerTypeMap.forEach((value, header) => {
        if (!savedHeaders?.includes(header)) {
          newHeaders.push(header)
        }
      })
      await this.sheet.setHeaderRow(newHeaders)
    }
    this.tabTitle = table.name
    // remake headerTypeMap to force id to be the first key for sheetsDB purposes
    this.headerTypeMap = new Map()
    this.headerTypeMap.set('id', _tableIndex_1.PARSABLE_TYPE.STRING)
    table.headerMap.forEach((type, key) => {
      if (key != 'id') this.headerTypeMap.set(key, type)
    })
  }
}
exports.SheetData = SheetData
