import { tableData } from '../types/tableTypes'
import { tableSummary } from './utilities'

abstract class Table<T extends tableData> {
  public static all = new Map<string, Table<tableData>>()
  public abstract loadPromise: Promise<boolean>
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

  /**
   *
   * @param targetTable the table to clone this one into
   * @returns a promise of all crupdate calls to the target Table
   */
  public async clone(targetTable: Table<T>, verbose?: boolean) {
    await this.loadPromise
    await targetTable.loadPromise
    const crupdates: Promise<false | T>[] = []
    this.toArray().map((entry) => targetTable.crupdate(entry))
    if (verbose)
      console.log(
        ` Tablet: Cloning ${this.numEntries()} entries from ${this.name} into ${
          targetTable.name
        }`
      )
    return Promise.all(crupdates)
  }

  /**
   *
   * @param entry an entry on a table
   * @returns true if the entry is valid
   */
  protected validate(entry: T): boolean {
    return entry.id !== undefined
  }

  protected summary: tableSummary = {
    ERRORS: { value: 0, verboseOnly: false },
    CREATIONS: { value: 0, verboseOnly: true },
    READS: { value: 0, verboseOnly: true },
    UPDATES: { value: 0, verboseOnly: true },
    DELETIONS: { value: 0, verboseOnly: true },
  }

  protected generateSummary(): tableSummary {
    return this.summary
  }

  /**
   *
   * @param verbose if true, shows everything, otherwise only shows impactful items
   * @returns a string, the summary of what Table has done so far
   */
  public static getSummary(verbose?: false): string {
    const info = ['Table Summary:']
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
