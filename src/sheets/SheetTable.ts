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
  rowToData,
  spreadsheetInfo,
} from './sheetsUtil'

class SheetTable<T extends tableData> extends Table<T> {
  public readonly spreadsheetId: string
  private spreadsheet!: Spreadsheet
  private sheet!: Sheet
  private rows!: Array<Row>
  constructor(
    public readonly name: string, // also used as spreadsheet tab name
    public readonly spreadsheetInfo: spreadsheetInfo,
    public readonly headers: Array<string>
  ) {
    super(name)
    this.spreadsheetId = spreadsheetInfo.spreadsheetId
    this.load()
  }

  public async crupdate(entry: T, changes = false): Promise<T | false> {
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
    await limiter.removeTokens(1)
    try {
      await this.sheet.addRow(
        { ...entry, lastUpdate: nowString() },
        { raw: true, insert: false }
      )
      this.rows = await this.sheet.getRows()
      return true
    } catch (err) {
      console.log('Sheet Add')
      return false
    }
  }

  private async update(entry: T, changes = false): Promise<true | null> {
    const index = this.rows.findIndex((row) => row.id == entry.id)
    if (index === -1) return null

    if (this.hasChanges(entry)) changes = true

    if (changes) {
      try {
        await limiter.removeTokens(1)
        this.rows[index].lastUpdate = nowString()
        // @ts-ignore
        await this.rows[index].save({ raw: true })
        return true
      } catch (err) {
        console.log(err)
        return true
      }
    } else {
      return true
    }
  }

  public async delete(entry: T): Promise<boolean> {
    const id = entry.id
    const found = this.rows?.find((row) => row.id == id)
    if (!found) return false
    await limiter.removeTokens(1)
    try {
      await found.delete()
      this.rows = await this.sheet.getRows()
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }

  public async fetch(
    id: string,
    forceRefresh?: boolean | undefined
  ): Promise<T | null> {
    const found = this.rows?.find((row) => row.id === id)
    if (!found) return null
    const foundObj: any = {}
    this.headers.forEach((header) => {
      foundObj[header] = found[header]
    })
    return foundObj as T
  }

  public async fetchAll(forceRefresh?: boolean | undefined): Promise<T[]> {
    const allData = this.rows.map((row) => {
      const obj: any = {}
      this.headers.forEach((header) => {
        obj[header] = row[header]
      })
      return obj as T
    })
    return allData
  }

  public async filter(filter: (entry: T) => boolean): Promise<T[]> {
    const data = this.toArray()
    return data.filter(filter)
  }
  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    const data = this.toArray()
    return data.find(finder)
  }
  public numEntries(): number {
    return this.rows.length
  }
  public toArray(): T[] {
    const array: Array<T> = []
    this.rows.forEach((row) => {
      array.push(rowToData<T>(row))
    })
    return array
  }

  private hasChanges(entry: T, index = -1): boolean {
    let changes = false
    if (index === -1) index = this.rows.findIndex((row) => row.id === entry.id)
    if (index === -1) return false
    this.headers.forEach((header) => {
      if (
        header != 'lastUpdate' &&
        entry[header] &&
        this.rows[index][header] != entry[header]
      ) {
        this.rows[index][header] = entry[header]
        changes = true
      }
    })
    return changes
  }

  private async load() {
    this.loadSpreadsheet()
    this.getOrCreateSheet()
    this.syncSheetHeaders()
    this.loadRows()
  }

  private async loadSpreadsheet(): Spreadsheet {
    this.spreadsheet = getSpreadsheet(this.spreadsheetInfo)
  }

  /*
   * Load the class sheet
   * Create a new sheet if not found
   */
  private getOrCreateSheet = async () => {
    if (!this.spreadsheet) return
    let sheet = this.spreadsheet.sheetsByTitle[this.name]
    if (!sheet) {
      sheet = await this.spreadsheet.addSheet(this.name)
    }
    this.sheet = sheet
  }

  /*
   * Sync the class Headers
   * Add any property types
   * Must manually delete old
   */
  private syncSheetHeaders = async () => {
    const savedHeaders = this.sheet.headerValues
    const newHeaders: string[] = []
    this.headers.forEach((header) => {
      if (!savedHeaders?.includes(header)) {
        newHeaders.push(header)
      }
    })
    await this.sheet.setHeaderRow(newHeaders)
  }
  /*
   * Reload rows
   */
  private loadRows = async () => {
    try {
      this.rows = await this.sheet.getRows()
    } catch (err) {
      console.log(err)
    }
  }
}
