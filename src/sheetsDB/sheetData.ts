import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet'
import {
  GihaTable,
  headerTypeMap,
  idData,
  PARSABLE_TYPE,
  parseType,
} from '../tables/_tableIndex'
import { log, warn } from '../util/_utilIndex'
import { spreadsheetList } from './spreadsheetLoader'

class SheetData<data extends idData> {
  table: GihaTable<data>
  readonly spreadsheetTitle: string
  readonly tabTitle: string
  readonly headerTypeMap: headerTypeMap
  private spreadsheet!: GoogleSpreadsheet
  private sheet!: GoogleSpreadsheetWorksheet
  private rows!: GoogleSpreadsheetRow[]

  constructor(spreadsheetTitle: string, table: GihaTable<data>) {
    this.table = table
    this.tabTitle = table.name
    this.spreadsheetTitle = spreadsheetTitle
    // remake headerTypeMap to force id to be the first key for sheetsDB purposes
    this.headerTypeMap = new Map<string, PARSABLE_TYPE>()
    this.headerTypeMap.set('id', PARSABLE_TYPE.STRING)
    table.headerMap.forEach((type, key) => {
      if (key != 'id') this.headerTypeMap.set(key, type)
    })
  }

  /*
   * Add new row
   */
  add = async (values: data) => {
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
  getById = (id: string): data | undefined => {
    const row = this.getRowById(id)
    if (!row) return undefined
    return this.parseRow(row)
  }

  getRowById = (id: string) => {
    const found = this.rows?.find((row) => row.id == id)
    return found
  }

  getAll = (): Array<data> => {
    const data: Array<data> = []
    this.rows.forEach((row) => {
      try {
        data.push(this.parseRow(row))
      } catch (err) {
        console.log(err)
        warn('sheetData', `row ${row.id} skipped in ${this.tabTitle}`)
      }
    })
    return data
  }

  private parseRow = (row: GoogleSpreadsheetRow): data => {
    const rowObj = {}
    this.headerTypeMap.forEach((type, header) => {
      const datum = row[header]
      if (!datum)
        throw `row ${row['id']} is missing value for header "${header}"`
      rowObj[header] = parseType(row[header], type)
    })
    return rowObj as data
  }

  /*
   * Update row
   * Or add if new
   */
  updateOrAdd = async (values: data): Promise<boolean> => {
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
  loadData = async () => {
    this.spreadsheet = spreadsheetList[this.spreadsheetTitle]
    if (!this.spreadsheet)
      throw `no spreadsheet named ${this.spreadsheetTitle} found in sheetList. ${this.tabTitle} sheetDb was not initialized`

    this.sheet = this.spreadsheet.sheetsByTitle[this.tabTitle]
    if (!this.sheet) await this.createSheet()
    await this.syncSheetHeaders()
    this.rows = await this.sheet.getRows()
    log(`Sheet Tab Loaded: ${this.tabTitle}`)
    return true
  }

  /*
   * Load the class sheet
   * Create a new sheet if not found
   */
  private createSheet = async () => {
    if (!this.sheet) {
      const title = this.tabTitle
      log(`creating sheet with tab name '${title}'`)
      this.sheet = await this.spreadsheet.addSheet({ title })
    }
  }

  /*
   * Sync the class Headers
   * Add any property types
   * Must manually delete old
   */
  private syncSheetHeaders = async () => {
    const savedHeaders = this.sheet.headerValues
    const newHeaders: string[] = []
    this.headerTypeMap.forEach((value, header) => {
      if (!savedHeaders?.includes(header)) {
        newHeaders.push(header)
      }
    })
    await this.sheet.setHeaderRow(newHeaders)
  }
}

export { SheetData, PARSABLE_TYPE, headerTypeMap, idData }
