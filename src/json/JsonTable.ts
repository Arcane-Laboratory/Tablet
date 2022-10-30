import {
  existsSync,
  mkdirSync,
  PathLike,
  readFileSync,
  writeFileSync,
} from 'fs'
import { Table, tableData } from '../Table'

import { default as stringify } from 'json-stable-stringify'
import path from 'path'

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
  public readonly filePath: PathLike
  private cache: Map<string, T> = new Map<string, T>()
  private bufferWrite = false
  private ioBufferInterval = setInterval(() => this.ioBuffer(), 1000)
  constructor(public readonly name: string, fileDir: PathLike | 'DEFAULT') {
    super(name)
    this.dirPath = fileDir == 'DEFAULT' ? DEFAULT_DIRECTORY : fileDir
    this.filePath = path.join(this.dirPath.toString(), name + fileExt)
    this.summary['FILE'] = { value: this.filePath.toString() }
    this.loadTable()
  }
  public numEntries(): number {
    return this.cache.size
  }
  public toArray() {
    const arr: Array<T> = []
    this.cache.forEach((value) => {
      arr.push(value)
    })
    arr.sort((a, b) => a.id.localeCompare(b.id))
    return arr
  }

  public async filter(filter: (entry: T) => boolean): Promise<Array<T>> {
    const entries: Array<T> = []
    this.cache.forEach((element) => {
      if (filter(element)) entries.push(element)
    })
    return entries
  }

  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    let found: T | undefined
    this.cache.forEach((entry) => {
      if (found) return found
      if (finder(entry)) found = entry
    })
    return found
  }

  public async fetch(id: string, forceRefresh?: boolean): Promise<T | null> {
    const cachedVal = this.cache.get(id)
    if (cachedVal !== undefined) return cachedVal
    return null
  }

  public async fetchAll(): Promise<Array<T>> {
    return Array.from(this.cache.values())
  }

  public async generateId(): Promise<string> {
    return '00' + this.name + this.cache.size
  }

  public async crupdate(entry: T) {
    if (!this.validate(entry)) throw `${entry} is not valid`
    this.cache.set(entry.id, entry)
    this.bufferWrite = true
    this.summary.UPDATED_ENTRIES.value++
    return entry
  }

  public async crupdates(entries: Array<T>) {
    const successfulCrupdates: Array<T> = []
    entries.forEach(async (entry) => {
      try {
        const success = await this.crupdate(entry)
        successfulCrupdates.push(success)
      } catch (err) {
        console.log(err)
        this.summary.ERRORS.value++
      }
    })
    return successfulCrupdates
  }

  public async delete(entry: T) {
    this.bufferWrite = true
    return this.cache.delete(entry.id)
  }

  private ioBuffer() {
    if (this.bufferWrite) {
      this.saveTable()
      this.bufferWrite = false
    }
  }

  private saveTable() {
    this.touchDir()
    const savable: jsonStore<T> = {
      __name: this.name,
      _lastUpdate: new Date().toLocaleDateString(),
      data: this.toArray(),
    }
    const stringifiedTable = stringify(savable, stringifyOpts)

    try {
      writeFileSync(this.filePath, stringifiedTable)
      this.summary['SAVED_ENTRIES'] = { value: this.numEntries() }
    } catch (err) {
      this.summary.ERRORS.value++
      console.log(err)
    }
  }
  private retries = 0
  private loadTable(): Table<T> {
    this.touchDir()
    let fileOut: jsonStore<T>
    try {
      fileOut = JSON.parse(readFileSync(this.filePath, 'utf-8').toString())
      if (!Array.isArray(fileOut.data))
        throw `${this.filePath} data is formatted incorrectly, needs to be an array`
      fileOut.data.forEach((entry) => {
        this.crupdate(entry)
      })
      this.summary.READ_ENTRIES.value = fileOut.data.length

      return this
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message ==
          `ENOENT: no such file or directory, open '${this.filePath}'`
        ) {
          if (this.retries > 3)
            throw `TABLET_ERROR: JsonTable.load failed after ${this.retries} attempts`
          this.retries++
          this.saveTable()
          return this.loadTable()
        } else if (err.name.substring(0, 11) == 'SyntaxError') {
          throw `TABLET_ERROR: JSONTABLE FILE ${this.filePath} IS INCORRECTLY FORMATTED`
        } else {
          console.log(err.message.substring(0, 10))
          console.log(err.name.substring(0, 10))
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
