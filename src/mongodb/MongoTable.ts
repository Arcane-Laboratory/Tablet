import { Table, tableData } from '../Table'
import { Collection, Filter, MongoClient } from 'mongodb'
import {
  DatabaseConnectionError,
  DataOperationError,
} from '../errors/TableErrors'

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
    try {
      await this.client.connect()
      this.collection = this.client.db(this.dbName).collection<T>(this.name)
      return true
    } catch (err) {
      throw new DatabaseConnectionError(
        `Failed to connect to MongoDB database ${this.dbName}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async numEntries(): Promise<number> {
    try {
      await this.loadPromise
      return await this.collection.countDocuments()
    } catch (err) {
      throw new DataOperationError(
        `Failed to count documents in collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async toArray(): Promise<Array<T>> {
    try {
      await this.loadPromise
      return await this.collection.find<T>({}).toArray()
    } catch (err) {
      throw new DataOperationError(
        `Failed to fetch all documents from collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }

  public async fetch(id: string, forceRefresh?: boolean): Promise<T | null> {
    try {
      if (forceRefresh) this.loadPromise = this.load()
      await this.loadPromise
      const filter = { _id: id } as Filter<T>
      return await this.collection.findOne<T>(filter)
    } catch (err) {
      throw new DataOperationError(
        `Failed to fetch document with id ${id} from collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async fetchAll(forceRefresh?: boolean): Promise<Array<T> | false> {
    try {
      if (forceRefresh) this.loadPromise = this.load()
      await this.loadPromise
      return await this.toArray()
    } catch (err) {
      throw new DataOperationError(
        `Failed to fetch all documents from collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async crupdate(entry: T): Promise<T | false> {
    try {
      await this.loadPromise
      const filter = { _id: entry._id } as Filter<T>
      const result = await this.collection.replaceOne(filter, entry, {
        upsert: true,
      })
      if (!result.acknowledged || result.modifiedCount === 0) return false
      return entry
    } catch (err) {
      throw new DataOperationError(
        `Failed to crupdate document with id ${entry._id} in collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async crupdates(entries: Array<T>): Promise<Array<T | false>> {
    try {
      await this.loadPromise
      const promises = entries.map((entry) => this.crupdate(entry))
      return await Promise.all(promises)
    } catch (err) {
      throw new DataOperationError(
        `Failed to crupdate multiple documents in collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async delete(entry: T): Promise<boolean> {
    try {
      await this.loadPromise
      const filter = { _id: entry._id } as Filter<T>
      const result = await this.collection.deleteOne(filter)
      if (!result.acknowledged || result.deletedCount === 0) return false
      return true
    } catch (err) {
      throw new DataOperationError(
        `Failed to delete document with id ${entry._id} from collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async filter(filter: (entry: T) => boolean): Promise<Array<T>> {
    try {
      await this.loadPromise
      // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
      const fullCollection = (await this.fetchAll()) || []
      return fullCollection.filter(filter) || []
    } catch (err) {
      throw new DataOperationError(
        `Failed to filter documents in collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
  public async find(finder: (entry: T) => boolean): Promise<T | undefined> {
    try {
      await this.loadPromise
      // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
      const fullCollection = (await this.fetchAll()) || []
      return fullCollection.find(finder)
    } catch (err) {
      throw new DataOperationError(
        `Failed to find document in collection ${this.name}`,
        this.name,
        err instanceof Error ? err : new Error(String(err))
      )
    }
  }
}

export { MongoTable }
