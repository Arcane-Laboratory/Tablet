import { randomUUID } from 'crypto'
import { Table, tableData } from './Table'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type entityConstructor<T extends tableData> = new (...args: any[]) => Entity<T>

interface loadFactory<T extends tableData, U extends Entity<T>> {
  (record: T): Promise<U>
}

/**
 * abstract class Entity can be implemented to make classes integrated with a Table
 * the generic T is the type of data stored in and read from the table
 * extended classes must also initialize themselves by calling their
 *   .registerEntity method
 *
 */
export abstract class Entity<T extends tableData> implements tableData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static tables = new Map<string, Table<any>>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static caches = new Map<string, Map<string, Entity<any>>>()

  private static loadFactories = new Map<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadFactory<any, Entity<any>>
  >()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static loadPromises = new Map<string, Map<string, Promise<any>>>()

  public readonly id: string

  /**
   *
   * @param id the id of a given entity, if none exists, one is assigned
   */
  constructor(id?: string) {
    id ??= randomUUID()
    this.id = id
    // Ensure that Entity Subclass has been registered
    const ctor = Entity.ctorOf(this)
    Entity.findLoadFactory(ctor)
    Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    // add this item to the cache
    cache.set(id, this)
  }

  /**
   * generate a record to be stored in a Table
   */
  public abstract generateRecord(): T

  /**
   *
   * @param table a Table which will store this Entity's records
   * @param loadFactory a function which takes a record and returns an instance of the Entity
   * @returns true if everything worked
   */
  public static registerEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    table: Table<T>,
    loadFactory: loadFactory<T, U>
  ): boolean {
    if (table == undefined)
      throw new Error(
        `TABLET_ENTITY.registerEntity: ${this.name} table can't be undefined`
      )
    if (loadFactory == undefined)
      throw new Error(
        `TABLET_ENTITY.registerEntity: ${this.name} loadFactory can't be undefined`
      )
    Entity.tables.set(this.name, table)
    Entity.caches.set(this.name, new Map<string, U>())
    Entity.loadFactories.set(this.name, loadFactory)
    Entity.loadPromises.set(this.name, new Map<string, Promise<U>>())
    return true
  }

  /**
   *
   * @param id the id of the entity to fetch
   * @returns a promise, which will be the proper entity if it's found and null otherwise
   */
  static async fetch<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    id: string
  ): Promise<U | null> {
    const table = Entity.findTable<T>(this)
    if (table === null) return null
    const record = await table.fetch(id)
    if (record == null) return null
    try {
      return await Entity.build<T, U>(record, this)
    } catch (err) {
      console.log(err)
      return null
    }
  }

  /**
   *
   * @returns a promise of an array of all entities from the table
   */
  static async fetchAll<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U
  ): Promise<Array<U> | null> {
    const table = Entity.findTable<T>(this)
    if (table === null) return null
    const allRecords = await table.fetchAll()
    if (allRecords == false) return null

    return await Promise.all(
      allRecords.map(async (record) => Entity.build<T, U>(record, this))
    )
  }

  /**
   *
   * @param filterFn a function used to filter entity records
   * @returns an array of instantiated entities with a record which matches properly
   */
  static async filterEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    filterFn: (entity: T) => boolean
  ): Promise<Array<U>> {
    const table = Entity.findTable<T>(this)
    if (table === null) return []
    const records = await table.filter(filterFn)
    const newEntities = await Promise.all(
      records.map(async (record) => {
        const cache = Entity.findCache<T, U>(this)
        const foundEntity = cache.get(record.id)
        if (foundEntity) return foundEntity
        else return Entity.build<T, U>(record, this)
      })
    )

    return newEntities
  }

  /**
   *
   * @param findFn a function used to find an entity record
   * @returns an instantiated entity with a record matching the findFn
   */
  static async findEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    findFn: (entity: T) => boolean
  ): Promise<U | undefined> {
    const table = Entity.findTable<T>(this)
    if (table === null) return undefined
    const record = await table.find(findFn)
    if (!record) return undefined
    const newEntity = await Entity.build<T, U>(record, this)
    return newEntity
  }

  static async findRecord<T extends tableData>(
    this: new (...args: any[]) => Entity<T>,
    findFn: (entity: T) => boolean
  ): Promise<T | undefined> {
    const table = Entity.findTable<T>(this)
    if (table === null) return undefined
    return table.find(findFn)
  }

  /**
   * CReate or UPDATE a specific entity's record on the table
   * @param record the record to create or update on a table
   * @returns the record that has been updated
   */
  public static async crupdate<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    record: T
  ): Promise<T | null> {
    const table = Entity.findTable(this)
    if (table === null) return null
    const savedRecord = await table.crupdate(record)
    if (savedRecord) return savedRecord
    else return null
  }

  /**
   * save this to the entity table
   * @returns the id of the written entity's record if successful, null otherwise
   */
  async save(): Promise<string | null> {
    const ctor = Entity.ctorOf(this)
    // ensure the cache is up to date
    Entity.findCache(ctor).set(this.id, this)
    const table = Entity.findTable(ctor)
    const record = this.generateRecord()
    if (table === null) return null
    const writtenRecord = await table.crupdate(record)
    if (writtenRecord) return writtenRecord.id
    else return null
  }

  /**
   * delete the given entity from the table
   */
  async delete(): Promise<boolean> {
    const table = Entity.findTable(Entity.ctorOf(this))
    if (table === null) return false
    const record = this.generateRecord()
    return table.delete(record)
  }

  /**
   *
   * @returns a list of all instantiated entities
   */
  public static entityCacheList(): Array<{
    ctorName: string
    cacheSize: number
    cache: Map<string, any>
  }> {
    const ctors: Array<{
      ctorName: string
      cacheSize: number
      cache: Map<string, any>
    }> = []
    Entity.caches.forEach((cache, ctor) => {
      ctors.push({ ctorName: ctor, cacheSize: cache.size, cache: cache })
    })
    return ctors
  }

  /**
   *
   * @returns the number of entities in the table cache
   */
  public static numCached<T extends tableData>(
    this: new (...args: any[]) => Entity<T>
  ): number {
    return Entity.findCache(this).size
  }

  /**
   * find a table belonging to a child class given the child class
   * @param entityConstructor the child class
   * @returns the table which stores that child class's information
   */
  private static findTable<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Table<T> | null {
    const table = Entity.tables.get(entityConstructor.name)
    if (table) return table
    else {
      console.log(
        `TabletError: Entity.findTable\nno table exists with constructor ${entityConstructor.name}`
      )
      return null
    }
  }

  /**
   * find a cache belonging to a child class given a child class
   * @param entityConstructor the child class
   * @returns the cache which stores instance of the child class
   */
  private static findCache<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): Map<string, U> {
    const cache = Entity.caches.get(entityConstructor.name)
    if (cache) return cache as Map<string, U>
    else
      throw `no cache exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }

  private static findLoadPromises<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): Map<string, Promise<U>> {
    const loadPromises = Entity.loadPromises.get(entityConstructor.name)
    if (loadPromises) return loadPromises as Map<string, Promise<U>>
    else
      throw `no loadPromises exist with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }

  /**
   * find the loadFactory of a child class
   * @param entityConstructor the child class
   * @returns the load factory
   */
  private static findLoadFactory<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): loadFactory<T, U> {
    const loadFactory = Entity.loadFactories.get(entityConstructor.name)
    if (loadFactory) return loadFactory as loadFactory<T, U>
    else
      throw `no factory exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }

  /**
   * extracts a constructor from an entity
   * @param entity the object to get the constructor of
   * @returns
   */
  private static ctorOf = <T extends tableData, U extends Entity<T>>(
    entity: U
  ): entityConstructor<T> => {
    return Object.getPrototypeOf(entity).constructor
  }

  private static async build<T extends tableData, U extends Entity<T>>(
    record: T,
    ctor: entityConstructor<T>
  ): Promise<U> {
    // if entity is already cached, return it
    const cache = Entity.findCache<T, U>(ctor)
    const foundEntity = cache.get(record.id)
    if (foundEntity) return foundEntity
    // if entity is being loaded, return the promise
    const loadPromises: Map<string, Promise<U>> = Entity.findLoadPromises<T, U>(
      ctor
    )
    const loadPromise = loadPromises.get(record.id)
    if (loadPromise) return loadPromise
    try {
      const factory = Entity.findLoadFactory<T, U>(ctor)
      const entityPromise = factory(record)
      loadPromises.set(record.id, entityPromise)
      const newEntity = await entityPromise
      cache.set(newEntity.id, newEntity)
      return newEntity
    } catch (err) {
      const str =
        `TABLET_ERROR: ${ctor.name}.build\n` +
        `failure loading recordId: ${record.id}`
      // if (err instanceof Error) {
      //   err.stack += str
      //   throw err
      // } else
      throw new Error(str + '\n' + err)
    }
  }
}
