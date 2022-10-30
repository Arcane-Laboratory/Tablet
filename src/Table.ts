import { tableData } from '../types/tableTypes'

abstract class Table<T extends tableData> {
  public static all = new Map<string, Table<tableData>>()
  constructor(public readonly name: string) {
    Table.all.set(this.name, this)
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

  protected validate(entry: T): boolean {
    return entry.id !== undefined
  }

  private static idDataStringify(datum: {
    id: string
    name?: string
    size?: number
    description?: string
  }): string {
    let str = ''

    if (datum.name) str += datum.name
    if (datum.size) str += '\n   size: ' + datum.size
    if (datum.description) str += '\n  > ' + datum.description
    return str
  }

  protected summary: summary = {
    ERRORS: {
      value: 0,
      verboseOnly: false,
    },
  }

  protected generateSummary(): summary {
    return this.summary
  }
  public static getSummary(verbose?: false): string {
    const info = [`Table Summary:`]
    info.push(`${Table.all.size} tables`)
    Table.all.forEach((table) => {
      const tableSummary = table.generateSummary()
      info.push(
        `  ${table.name} [${Object.getPrototypeOf(table).constructor.name}]:`
      )
      Object.keys(tableSummary).forEach((key) => {
        const entry = tableSummary[key]
        if ((entry.verboseOnly === false || verbose) && entry.value != 0)
          info.push(`    ${key}: ${entry.value}`)
      })
    })
    return info.join('\n ')
  }
}

export { Table, tableData }

interface summaryEntry {
  value: string | number | boolean
  verboseOnly?: boolean
}

interface summary {
  [key: string]: summaryEntry
  ERRORS: { value: number; verboseOnly: false }
}
