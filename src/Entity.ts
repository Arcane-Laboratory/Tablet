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
  >
  
  private _id: string = 'ID_PENDING'
  
  constructor(id?: string) {
    if(id)this.id = id
    // Ensure that Entity Subclass has been registered
    const ctor = Entity.ctorOf(this)
    const table = Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    const loadFactory = Entity.findLoadFactory(ctor)
    // add this item to the cache
    cache.push(this)
  }

  
  public get id() : string {
    return this._id
  }
  
  public set id(id: string) {
    if(id == this._id) return 
    else if (this._id == 'ID_PENDING')
      this._id = id
    else console.warn(`TABLET_WARNING_001: NO_ID_OVERRIDES\nEntity ID set as ${this._id}, did not override to ${id}`)
  }

  public abstract generateRecord(): T

  public static registerEntity<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    table: Table<T>,
    loadFactory: loadFactory<T, U>
  ): boolean {
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

  public static async crupdate<T extends tableData, U extends Entity<T>>(
    this: new (...args: any[]) => U,
    record: T
  ): Promise<U> {
    const table = Entity.findTable(this)
    const savedRecord = await table.crupdate(record)
    const loadFactory = Entity.findLoadFactory<T, U>(this)
    return loadFactory(savedRecord)
  }

  async save():Promise<string> {
    const ctor = Entity.ctorOf(this)
    const table = Entity.findTable(ctor)
    const record = this.generateRecord()
    const writtenRecord = await table.crupdate(record)
    return writtenRecord.id
  }

  public static entityCacheList(): string {
    const cacheList: Array<string> = []
    Entity.caches.forEach((cache, ctor) => {
      cacheList.push(`${ctor.name} - ${cache.length} entries cached`)
    })
    return cacheList.join('\n')
  }

  /** */
  private static findTable<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Table<T> {
    const table = Entity.tables.get(entityConstructor)
    if (table) return table
    else
      throw `no table exists with constructor ${entityConstructor.toString()}`
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
  
  /**
   * 
   * @param entity 
   * @returns 
   */
  private static ctorOf = <T extends tableData, U extends Entity<T>>(entity: U): entityConstructor<T> => {
    return Object.getPrototypeOf(
      entity
      ).constructor
    }
  }