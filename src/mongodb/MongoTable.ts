import { Table, tableData } from '../Table'
import { Collection, Filter, MongoClient } from 'mongodb'

class MongoTable<T extends tableData> extends Table<T> {
  public loadPromise: Promise<boolean>
  private collection!: Collection<T>
  constructor(
    public readonly client: MongoClient,
    public readonly dbName: string,
    public readonly name: string // collection name
  ) {
    super(name)
    this.loadPromise = this.load()
  }

  public async load(): Promise<boolean> {
    await this.client.connect()
    this.collection = this.client.db(this.dbName).collection<T>(this.name)
    return true
  }
  public async numEntries(): Promise<number> {
    await this.loadPromise
    return this.collection.countDocuments()
  }
  public async toArray(): Promise<Array<T>> {
    await this.loadPromise
    return this.collection.find<T>({}).toArray()
  }

  public async fetch(id: string, forceRefresh?: boolean): Promise<T | null> {
    if (forceRefresh) this.loadPromise = this.load()
    await this.loadPromise
    const filter = { _id: id } as Filter<T>
    return this.collection.findOne<T>(filter)
  }
  public async fetchAll(forceRefresh?: boolean): Promise<Array<T> | false> {
    if (forceRefresh) this.loadPromise = this.load()
    await this.loadPromise
    return this.toArray()
  }
  public async crupdate(entry: T): Promise<T | false> {
    await this.loadPromise
    const filter = { _id: entry._id } as Filter<T>
    const result = await this.collection.updateOne(filter, entry, { upsert : true })
    if (!result.acknowledged || result.modifiedCount === 0) return false
    return entry
  }
  public async crupdates(entries: Array<T>): Promise<Array<T | false>> {
    await this.loadPromise
    const promises = entries.map((entry) => this.crupdate(entry))
    return Promise.all(promises)
  }
  public async delete(entry: T): Promise<boolean> {
    await this.loadPromise
    const filter = { _id: entry._id } as Filter<T>
    const result = await this.collection.deleteOne(filter)
    if (!result.acknowledged || result.deletedCount === 0) return false
    return true
  }
  public async filter(filter: (entry: T) => boolean): Promise<Array<T>> {
    await this.loadPromise
    // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
    const fullCollection = (await this.fetchAll()) || []
    return fullCollection.filter(filter) || []
  }
  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    await this.loadPromise
    // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
    const fullCollection = (await this.fetchAll()) || []
    return fullCollection.find(finder)
  }
}

export { MongoTable }
