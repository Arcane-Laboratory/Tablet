import { Table, tableData } from "../Table"
import { MongoClient } from 'mongodb'

class MongoTable<T extends tableData> extends Table<T> {
  public loadPromise: Promise<boolean>
  constructor(
    public readonly client: MongoClient, 
    public readonly dbName: string,
    public readonly name: string, // collection name
  ) {
    super(name)
    this.loadPromise = this.load()
  }

  public async load(): Promise<boolean> {
    await this.client.connect()
    return true
  }
  public numEntries(): number {}
  public toArray(): Array<T> {}

  public fetch(id: string, forceRefresh?: boolean): Promise<T | null> {}
  public fetchAll(forceRefresh?: boolean): Promise<Array<T> | false> {}
  public crupdate(entry: T): Promise<T | false> {}
  public crupdates(entries: Array<T>): Promise<Array<T | false>> {}
  public delete(entry: T): Promise<boolean> {}
  public filter(filter: (entry: T) => boolean): Promise<Array<T>> {}
  public find(finder: (entry: T) => boolean): Promise<T | undefined> {}
}

export { MongoTable }
