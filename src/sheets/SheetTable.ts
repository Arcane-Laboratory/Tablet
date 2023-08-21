import { Table, tableData } from '../Table'
import {
  GoogleSpreadsheet as Spreadsheet,
  GoogleSpreadsheetWorksheet as Sheet,
  GoogleSpreadsheetRow as Row,
} from 'google-spreadsheet'
import { nowString } from '../utilities'
import {
  limiter,
  loadSpreadsheet as getSpreadsheet,
  parseVal,
  spreadsheetInfo,
} from './sheetsUtil'
import { randomUUID } from 'crypto'

export class SheetTable<T extends tableData> extends Table<T> {
  public readonly spreadsheetId: string
  private spreadsheet!: Spreadsheet
  private sheet!: Sheet
  public loadPromise: Promise<boolean>
  private rows!: Array<Row>
  private headers = ['_id', 'createdAt', 'lastUpdate']
  /**
   *
   * @param name the name of the table, used to identify a the proper tab on the spreadsheet
   * @param spreadsheetInfo the info used for finding the spreadsheet, including it's id and an auth key
   * @param exampleEntry an example entry on the sheet, only the object keys are used for creating the headers, this object is not saved
   */
  constructor(
    public readonly name: string, // also used as spreadsheet tab name
    public readonly spreadsheetInfo: spreadsheetInfo,
    exampleEntry: T
  ) {
    super(name)
    this.spreadsheetId = spreadsheetInfo.spreadsheetId
    Object.keys(exampleEntry).forEach((key) => {
      if (this.headers.find((header) => header == key) == undefined)
        this.headers.push(key)
    })
    this.loadPromise = this.load()
    this.loadPromise
      .then(() => {
        this.summary['SPREADSHEET'] = this.spreadsheet.title
      })
      .catch((err) => {
        console.log(`error loading ${this.name}`)
        console.log(err)
      })
  }
  public async crupdate(entry: T, changes = false): Promise<T | false> {
    if (!entry._id) entry._id == randomUUID()
    const updateExisting = await this.update(entry, changes)
    if (updateExisting) return entry
    else {
      const create = await this.add(entry)
      return create == false ? create : entry
    }
  }
  public async crupdates(entries: T[]): Promise<Array<T | false>> {
    const crupdates = await Promise.all(
      entries.map(async (entry) => {
        return await this.crupdate(entry)
      })
    )
    return crupdates
  }

  private async add(entry: T): Promise<boolean> {
    await this.loadPromise
    await limiter.removeTokens(1)
    const now = nowString()
    try {
      const flatEntry = { lastUpdate: now, createdAt: now }
      Object.keys(entry).forEach((key) => {
        flatEntry[key] = JSON.stringify(entry[key])
      })
      await this.sheet.addRow({ ...flatEntry }, { raw: true, insert: false })
      this.rows = await this.sheet.getRows()
      return true
    } catch (err) {
      console.log(`error adding entry to ${this.name}`)
      console.log(entry)
      console.log(err)
      throw err
      return false
    }
  }

  private async update(entry: T, changes = false): Promise<true | null> {
    await this.loadPromise
    const index = this.findRowIndexById(entry._id)

    if (index === -1) return null

    if (this.hasChanges(entry)) changes = true

    if (changes) {
      try {
        await limiter.removeTokens(1)
        this.rows[index].lastUpdate = nowString()
        await this.rows[index].save({ raw: true })
        return true
      } catch (err) {
        console.log(err)
        this.summary.ERRORS.value++
        return true
      }
    } else {
      return true
    }
  }

  public async delete(entry: T): Promise<boolean> {
    await this.loadPromise
    const id = entry._id
    const index = this.findRowIndexById(id)
    if (!(index == -1)) return false
    const foundEntry = this.rows[index]
    await limiter.removeTokens(1)
    try {
      await foundEntry.delete()
      this.rows = await this.sheet.getRows()
      return true
    } catch (err) {
      this.summary.ERRORS.value++

      console.log(err)
      return false
    }
  }

  public async fetch(_id: string): Promise<T | null> {
    await this.loadPromise
    const index = this.findRowIndexById(_id)
    if (index == -1) return null
    return this.parseRow(this.rows[index])
  }

  public async fetchAll(): Promise<Array<T>> {
    await this.loadPromise
    return this.toArray()
  }

  public async filter(filter: (entry: T) => boolean): Promise<T[]> {
    await this.loadPromise
    const data = this.toArray()
    return data.filter(filter)
  }
  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    await this.loadPromise
    const data = this.toArray()
    const foundData = data.find(finder)
    return foundData
  }
  public numEntries(): number {
    return this.rows.length
  }
  public toArray(): T[] {
    const array: Array<T> = []
    this.rows.forEach((row) => {
      const parsedRow = this.parseRow(row)
      if (parsedRow != null) array.push(parsedRow)
    })
    return array
  }

  private hasChanges(entry: T, index = -1): boolean {
    let changes = false
    if (index === -1) index = this.findRowIndexById(entry._id)
    if (index === -1) return false

    this.headers.forEach((header) => {
      const flatValue = JSON.stringify(entry[header])
      if (
        header != 'lastUpdate' &&
        flatValue &&
        this.rows[index][header] != flatValue
      ) {
        this.rows[index][header] = flatValue
        changes = true
      }
    })
    return changes
  }

  private async load() {
    this.spreadsheet = await getSpreadsheet(this.spreadsheetInfo)
    this.sheet = await this.getOrCreateSheet()
    await this.syncSheetHeaders()
    await this.loadRows()
    return true
  }

  /*
   * Load the class sheet
   * Create a new sheet if not found
   */
  private getOrCreateSheet = async () => {
    if (!this.spreadsheet)
      throw new Error(`can't get a sheet without spreadsheet ${this.name}`)
    let sheet = this.spreadsheet.sheetsByTitle[this.name]
    if (!sheet) {
      try {
        sheet = await this.spreadsheet.addSheet({ title: this.name })
      } catch (err) {
        console.log(`Sheet Creation Failed for ${this.name}`)
        this.summary.ERRORS.value++

        console.log(err)
      }
    }
    return sheet
  }

  /*
   * Sync the class Headers
   * Add any property types
   * Must manually delete old
   */
  private syncSheetHeaders = async () => {
    const sheetHeaders: Array<string> = []

    try {
      // try to get the header row and check all of it's values
      await this.sheet.loadHeaderRow()
      this.sheet.headerValues.forEach((header) => sheetHeaders.push(header))
    } catch (err) {
      // if the error was about no values in the header row, it's okay because we are about to fill them!
      if (
        !(
          err instanceof Error &&
          err.message ==
            'No values in the header row - fill the first row with header values before trying to interact with rows'
        )
      )
        throw err // something wack happened
    }
    this.headers.forEach((header) => {
      if (!sheetHeaders?.includes(header)) {
        sheetHeaders.push(header)
      }
    })
    await this.sheet.setHeaderRow(sheetHeaders)
    return true
  }
  /*
   * Reload rows
   */
  private loadRows = async () => {
    try {
      this.rows = await this.sheet.getRows()
      return true
    } catch (err) {
      this.summary.ERRORS.value++
      console.log(err)
      return false
    }
  }

  private parseRow(row: Row): T | null {
    const parsedObject = {}
    let failure = false
    this.headers.forEach((header) => {
      if (failure) return
      try {
        parsedObject[header] = parseVal(row[header])
      } catch (err) {
        console.log(
          `unable to parse ${header} of ${this.name} at row ${row.rowNumber}:`
        )
        console.log(row[header])
        failure = true
        return null
      }
    })
    return parsedObject as T
  }

  private findRowIndexById = (_id: string): number => {
    const index = this.rows.findIndex(
      (row) => parseVal(row._id)?.toString() === _id.toString()
    )
    return index
  }
}
