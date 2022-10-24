import { tableData } from '../types/tableTypes'

abstract class Table<T extends tableData> {
  public static all = new Map<string, Table<tableData>>()
  protected cache: Map<string, T> = new Map<string, T>()
  constructor(public readonly name: string) {
    Table.all.set(this.name, this)
  }

  public abstract numEntries(): number
  public abstract toArray(): Array<T>
  public abstract generateId(): Promise<string>
  public abstract fetch(id: string, forceRefresh?: boolean): Promise<T | null>
  public abstract crupdate(entry: T): Promise<T>
  public abstract crupdates(entries: Array<T>): Promise<Array<T>>
  public abstract delete(entry: T): Promise<boolean>

  public abstract filter(filter: (args0: T) => boolean): Array<T>

  public toString(): string {
    let str = `Tablet: ${this.name} \n${this.cache.size} entries`
    this.cache.forEach(
      (datum) => (str += `\n ${datum.id}: ${Table.idDataStringify(datum)}`)
    )
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
}

export { Table, tableData }
