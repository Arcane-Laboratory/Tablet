import { randomUUID } from 'crypto'
import { Table, tableData } from './Table'

type entityConstructor<T extends tableData> = new (...args: any[]) => Entity<T>

type loadFactory<T extends tableData, U extends Entity<T>> = (
  record: T
) => Promise<U>

export abstract class Entity<T extends tableData> implements tableData {
  private static tables = new Map<entityConstructor<any>, Table<any>>()
  private static caches = new Map<entityConstructor<any>, Array<Entity<any>>>()
  private static loadFactories = new Map<
    entityConstructor<any>,
    loadFactory<any, Entity<any>>
  >()

  public readonly id: string

  constructor(id?: string) {
    if (id) this.id = id
    else this.id = randomUUID()
    // Ensure that Entity Subclass has been registered
    const ctor = Entity.ctorOf(this)
    const table = Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    const loadFactory = Entity.findLoadFactory(ctor)
    // add this item to the cache
    cache.push(this)
  }

  public abstract generateRecord(): T

  public static registerEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    table: Table<T>,
    loadFactory: loadFactory<T, U>
  ): boolean {
    if (table == undefined)
      throw `TABLET_ENTITY.registerEntity: ${this.name} table can't be undefined`
    if (loadFactory == undefined)
      throw `TABLET_ENTITY.registerEntity: ${this.name} loadFactory can't be undefined`
    const registryConfirmation = {
      tableUpdate: Entity.tables.set(this, table),
      cacheUpdate: Entity.caches.set(this, []),
      loadFactoryUpdate: Entity.loadFactories.set(this, loadFactory),
    }
    return true
  }

  static async fetch<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    id: string
  ): Promise<U | null> {
    const table = Entity.findTable<T>(this)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    const record = await table.fetch(id)
    if (record == null) return null
    return loadFactory(record)
  }

  static async fetchAll<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U
  ): Promise<Array<U>> {
    const table = Entity.findTable<T>(this)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    const allRecords = await table.fetchAll()
    return await Promise.all(
      allRecords.map(async (record) => await loadFactory(record))
    )
  }

  static async filterEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    filterFn: (entity: T) => boolean
  ): Promise<Array<U>> {
    const table = Entity.findTable<T>(this)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    const records = await table.filter(filterFn)
    const newEntities = await Promise.all(
      records.map(async (record) => await loadFactory(record))
    )

    return newEntities
  }

  static async findEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    findFn: (entity: T) => boolean
  ): Promise<U | undefined> {
    const table = Entity.findTable<T>(this)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    const record = await table.find(findFn)
    if (!record) return undefined
    const newEntity = await loadFactory(record)
    return newEntity
  }

  static findRecord<T extends tableData>(
    this: new (...args: any[]) => Entity<T>,
    findFn: (entity: T) => boolean
  ): Promise<T | undefined> {
    const table = Entity.findTable<T>(this)
    return table.find(findFn)
  }

  public static async crupdate<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    record: T
  ): Promise<U> {
    const table = Entity.findTable(this)
    const savedRecord = await table.crupdate(record)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    return loadFactory(savedRecord)
  }

  async save(): Promise<string> {
    const ctor = Entity.ctorOf(this)
    const table = Entity.findTable(ctor)
    const record = this.generateRecord()
    const writtenRecord = await table.crupdate(record)
    return writtenRecord.id
  }

  public static entityCacheList(): Array<{
    ctor: entityConstructor<any>
    cacheSize: number
  }> {
    const ctors: Array<{ ctor: entityConstructor<any>; cacheSize: number }> = []
    Entity.caches.forEach((cache, ctor) => {
      ctors.push({ ctor: ctor, cacheSize: cache.length })
    })
    return ctors
  }
  3

  public static numCached<T extends tableData>(
    this: new (...args: any[]) => Entity<T>
  ): number {
    return Entity.findCache(this).length
  }

  /** */
  private static findTable<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Table<T> {
    const table = Entity.tables.get(entityConstructor)
    if (table) return table
    else throw `no table exists with constructor ${entityConstructor.name}`
  }

  private static findCache<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): Array<U> {
    const cache = Entity.caches.get(entityConstructor)
    if (cache) return cache as U[]
    else
      throw `no cache exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }

  private static findLoadFactory<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): loadFactory<T, U> {
    const loadFactory = Entity.loadFactories.get(entityConstructor)
    if (loadFactory) return loadFactory as loadFactory<T, U>
    else
      throw `no factory exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }

  private static ctorOf = <T extends tableData, U extends Entity<T>>(
    entity: U
  ): entityConstructor<T> => {
    return Object.getPrototypeOf(entity).constructor
  }
}
