import {
  existsSync,
  mkdirSync,
  PathLike,
  readFileSync,
  writeFileSync,
} from 'fs'
import { Table, tableData } from './Table'

import { stringify } from 'json-stable-stringify'

const stringifyOpts = {
  space: 2,
}
const fileDir = './devDb/'

interface jsonStore<T extends tableData> {
  name: string
  lastUpdate: string
  data: Array<T>
}

class JsonTable<T extends tableData> extends Table<T> {
  public readonly filePath: PathLike
  private cache: Map<string, T> = new Map<string, T>()
  private bufferWrite = false
  private ioBufferInterval = setInterval(() => this.ioBuffer(), 1000)
  constructor(public readonly name: string, filePath?: PathLike) {
    super(name)
    this.filePath = filePath ? filePath : fileDir + `${name}.gha.json`
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

  public async fetch(id: string, forceRefresh?: boolean): Promise<T | null> {
    const cachedVal = this.cache.get(id)
    if (cachedVal !== undefined) return cachedVal
    return null
  }

  public async generateId(): Promise<string> {
    return '00' + this.name + this.cache.size
  }

  public async crupdate(entry: T) {
    if (!this.validate(entry)) throw `${entry} is not valid`
    this.cache.set(entry.id, entry)
    this.bufferWrite = true
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
    touchDir()
    const savable: jsonStore<T> = {
      name: this.name,
      lastUpdate: new Date().toLocaleDateString(),
      data: this.toArray(),
    }
    const stringifiedTable = stringify(savable, stringifyOpts)

    try {
      writeFileSync(this.filePath, stringifiedTable)
      console.log(
        `saved table '${this.name}' with ${this.numEntries()} entries`
      )
    } catch (err) {
      console.log(err)
    }
  }

  private loadTable(): Table<T> {
    touchDir()
    const fileOut: jsonStore<T> = JSON.parse(
      readFileSync(this.filePath, 'utf-8').toString()
    )
    if (!Array.isArray(fileOut.data))
      throw `${this.filePath} data is formatted incorrectly, needs to be an array`
    fileOut.data.forEach((entry) => {
      this.crupdate(entry)
    })
    console.log(`read ${fileOut.data.length} entries from file`)
    return this
  }
}

let dirCheck = false
const touchDir = () => {
  if (dirCheck) return
  if (!existsSync(fileDir)) {
    mkdirSync(fileDir, { recursive: true })
  }
  dirCheck = true
}

export { JsonTable }
