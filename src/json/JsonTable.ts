import {
  existsSync,
  mkdirSync,
  PathLike,
  readFileSync,
  writeFileSync,
} from 'fs'
import { Table, tableData } from '../Table'
import { DataOperationError, ValidationError } from '../errors/TableErrors'

import { default as stringify } from 'json-stable-stringify'
import path from 'path'
import { nowString } from '../utilities'

const stringifyOpts = {
  space: 2,
}
const DEFAULT_DIRECTORY = './devDb/'
const fileExt = '.tablet.json'

interface jsonStore<T extends tableData> {
  __name: string
  _lastUpdate: string
  data: Array<T>
}

class JsonTable<T extends tableData> extends Table<T> {
  public readonly dirPath: PathLike
  public loadPromise: Promise<boolean>
  public readonly filePath: PathLike
  private cache: Map<string, T> = new Map<string, T>()
  private bufferWrite = false
  private ioBufferInterval = setInterval(() => this.ioBuffer(), 1000)
  /**
   *
   * @param name the name of the table, this is used to name the local file
   * @param fileDir where to store the table data
   */
  constructor(public readonly name: string, fileDir: PathLike | 'DEFAULT') {
    super(name)
    this.dirPath = fileDir == 'DEFAULT' ? DEFAULT_DIRECTORY : fileDir
    this.filePath = path.join(this.dirPath.toString(), name + fileExt)
    this.summary['FILE'] = { value: this.filePath.toString() }
    this.loadPromise = this.loadTable()
  }
  /**
   * @returns how many entries are in this table
   */
  public async numEntries(): Promise<number> {
    return this.cache.size
  }

  /**
   * @returns an array of this table's entries
   */
  public async toArray() {
    const arr: Array<T> = []
    this.cache.forEach((value) => {
      arr.push(value)
    })
    arr.sort((a, b) => {
      return a._id.toString().localeCompare(b._id.toString())
    })
    return arr
  }

  /**
   * filters the table by a given filter function
   * @param filter the filter function
   * @returns an array of matching entries
   */
  public async filter(filter: (entry: T) => boolean): Promise<Array<T>> {
    const entries: Array<T> = []
    this.cache.forEach((element) => {
      if (filter(element)) entries.push(element)
    })
    return entries
  }

  /**
   * find a given entry based on a function
   * @param finder the function used to evaluate entries
   * @returns an entry matching the function
   */
  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    let found: T | undefined
    this.cache.forEach((entry) => {
      if (found) return found
      if (finder(entry)) found = entry
    })
    return found
  }

  /**
   *
   * @param id the id of the record to fetch
   * @param forceRefresh if the table should be reinstantiated, does nothing for json
   * @returns fthe matching entry, or null if no id matched
   */
  public async fetch(id: string): Promise<T | null> {
    const cachedVal = this.cache.get(id)
    if (cachedVal !== undefined) return cachedVal
    return null
  }

  /**
   *
   * @returns an array of all values in the table
   */
  public async fetchAll(): Promise<Array<T>> {
    return Array.from(this.cache.values())
  }

  /**
   * CReates or UPDATEs an entry in the table
   * @param entry the entry to crupdate
   * @returns the entry, now updated in the table
   */
  public async crupdate(entry: T) {
    if (!this.validate(entry)) {
      throw new ValidationError(`${entry} is not valid`, this.name)
    }
    this.cache.set(entry._id, entry)
    this.bufferWrite = true
    this.summary.UPDATES.value++
    return entry
  }

  /**
   * CReates or UPDATEs multiple entries
   * @param entries the entries to crupdate
   * @returns an array of successfully crupdated entries
   */
  public async crupdates(entries: Array<T>) {
    const successfulCrupdates: Array<T> = []

    for (const entry of entries) {
      try {
        const success = await this.crupdate(entry)
        if (success) successfulCrupdates.push(success)
      } catch (err) {
        this.summary.ERRORS.value++
        // Re-throw the error instead of just logging
        throw new DataOperationError(
          `Failed to crupdate entry ${entry._id}`,
          this.name,
          err instanceof Error ? err : new Error(String(err))
        )
      }
    }
    return successfulCrupdates
  }

  /**
   *
   * @param entry the entry to delete
   * @returns true if the deletion was successful
   */
  public async delete(entry: T) {
    const res = this.cache.delete(entry._id)
    this.bufferWrite = true
    return res
  }

  private ioBuffer() {
    if (this.bufferWrite) {
      this.saveTable()
        .then(() => (this.bufferWrite = false))
        .catch((err) => {
          // Re-throw instead of just logging
          throw new DataOperationError(
            `Failed to save table ${this.name}`,
            this.name,
            err instanceof Error ? err : new Error(String(err))
          )
        })
    }
  }

  private async saveTable() {
    this.touchDir()
    const savable: jsonStore<T> = {
      __name: this.name,
      _lastUpdate: nowString(),
      data: await this.toArray(),
    }
    const stringifiedTable = stringify(savable, stringifyOpts)

    try {
      writeFileSync(this.filePath, stringifiedTable)
      const entries = savable.data.length
      this.summary['SAVED_ENTRIES'] = { value: entries }
    } catch (err) {
      this.summary.ERRORS.value++
      // Re-throw instead of just logging
      throw new DataOperationError(
        `Failed to save table to file ${this.filePath}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  private retries = 0
  private async loadTable(): Promise<boolean> {
    this.touchDir()
    let fileOut: jsonStore<T>
    try {
      fileOut = JSON.parse(readFileSync(this.filePath, 'utf-8').toString())
      if (!Array.isArray(fileOut.data)) {
        throw new ValidationError(
          `${this.filePath} data is formatted incorrectly, needs to be an array`,
          this.name
        )
      }
      fileOut.data.forEach((entry) => {
        this.crupdate(entry).catch((err) => {
          // Re-throw instead of just logging
          throw new DataOperationError(
            'Failed to load entry during table initialization',
            this.name,
            err instanceof Error ? err : new Error(String(err))
          )
        })
      })
      this.summary.READS.value = fileOut.data.length

      return true
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message ==
          `ENOENT: no such file or directory, open '${this.filePath}'`
        ) {
          if (this.retries > 3) {
            throw new DataOperationError(
              `JsonTable.load failed after ${this.retries} attempts`,
              this.name
            )
          }
          this.retries++
          await this.saveTable()
          return this.loadTable()
        } else if (err.name.substring(0, 11) == 'SyntaxError') {
          throw new ValidationError(
            `JSONTABLE FILE ${this.filePath} IS INCORRECTLY FORMATTED`,
            this.name
          )
        } else {
          this.summary.ERRORS.value++
          throw err
        }
      } else throw err
    }
  }
  private dirCheck = false
  private touchDir = () => {
    if (this.dirCheck) return
    if (!existsSync(this.dirPath)) {
      mkdirSync(this.dirPath, { recursive: true })
    }
    this.dirCheck = true
  }
}

export { JsonTable }
