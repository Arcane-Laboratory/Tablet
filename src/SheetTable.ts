import { Table, tableData } from './Table'

class SheetTable<T extends tableData> extends Table<T> {
  public readonly sheetId: string
  constructor(public readonly name: string) {
    super(name)
  }
  public crupdate(entry: T): Promise<T> {}
  public crupdates(entries: T[]): Promise<T[]> {}
  public delete(entry: T): Promise<boolean> {}
  public fetch(
    id: string,
    forceRefresh?: boolean | undefined
  ): Promise<T | null> {}
  public fetchAll(forceRefresh?: boolean | undefined): Promise<T[]> {}
  public filter(filter: (entry: T) => boolean): Promise<T[]> {}
  public find(finder: (entry: T) => boolean): Promise<T | undefined> {}
  public numEntries(): number {}
  public toArray(): T[] {}
}
