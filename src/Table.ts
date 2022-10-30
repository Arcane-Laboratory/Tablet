import { stringify } from 'querystring'
import { tableData } from '../types/tableTypes'
import { tableSummary } from './utilities'

abstract class Table<T extends tableData> {
  public static all = new Map<string, Table<tableData>>()
  constructor(public readonly name: string) {
    const extantTable = Table.all.get(name)
    if (extantTable)
      throw `There is already a table named ${name}. Pick a different name for this one!`
    Table.all.set(name, this)
  }
  public abstract numEntries(): number
  public abstract toArray(): Array<T>

  public abstract fetch(id: string, forceRefresh?: boolean): Promise<T | null>
  public abstract fetchAll(forceRefresh?: boolean): Promise<Array<T> | false>
  public abstract crupdate(entry: T): Promise<T | false>
  public abstract crupdates(entries: Array<T>): Promise<Array<T | false>>
  public abstract delete(entry: T): Promise<boolean>
  public abstract filter(filter: (entry: T) => boolean): Promise<Array<T>>
  public abstract find(finder: (entry: T) => boolean): Promise<T | undefined>

  public toString(): string {
    const str = `Tablet: ${this.name} \n${this.numEntries()} entries`
    // this.cache.forEach(
    //   (datum) => (str += `\n ${datum.id}: ${Table.idDataStringify(datum)}`)
    // )
    return str
  }

  public async clone(targetTable: Table<T>) {
    const crupdates = this.toArray().map((entry) => {
      targetTable.crupdate(entry)
    })
    return Promise.all(crupdates)
  }

  protected validate(entry: T): boolean {
    return entry.id !== undefined
  }

  protected summary: tableSummary = {
    ERRORS: { value: 0, verboseOnly: false },
    CREATIONS: { value: 0, verboseOnly: false },
    READS: { value: 0, verboseOnly: false },
    UPDATES: { value: 0, verboseOnly: false },
    DELETIONS: { value: 0, verboseOnly: false },
  }

  protected generateSummary(): tableSummary {
    return this.summary
  }
  public static getSummary(verbose?: false): string {
    const info = [`Table Summary:`]
    info.push(`${Table.all.size} tables`)
    Table.all.forEach((table) => {
      const tableSummary = table.generateSummary()
      info.push(
        ` ${table.name} [${Object.getPrototypeOf(table).constructor.name}]`
      )
      Object.keys(tableSummary).forEach((key) => {
        const entry = tableSummary[key]
        if ((entry.verboseOnly === false || verbose) && entry.value != 0)
          info.push(`   ${key}: ${entry.value}`)
      })
    })
    return info.join('\n ')
  }
}

export { Table, tableData }
