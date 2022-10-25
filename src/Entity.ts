import { Table, tableData } from './Table'

type entityConstructor<T extends tableData> = new (...args: any[]) => Entity<T>

type loadFactory<T extends tableData, U extends Entity<T>> = (
  record: T
) => Promise<U>

type registryConfirmation = {
  tableUpdate: Map<entityConstructor<any>, Table<any>>
  cacheUpdate: Map<entityConstructor<any>, Array<Entity<any>>>
  loadFactoryUpdate: Map<
    entityConstructor<tableData>,
    loadFactory<tableData, Entity<tableData>>
  >
}

export abstract class Entity<T extends tableData> implements tableData {
  public abstract readonly id: string
  private static tables: Map<entityConstructor<any>, Table<any>>
  private static caches: Map<entityConstructor<any>, Array<Entity<any>>>
  private static loadFactories: Map<
    entityConstructor<any>,
    loadFactory<any, Entity<any>>
  >

  constructor() {
    const ctor = extractCtor(this)
    const table = Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    const loadFactory = Entity.findLoadFactory(ctor)
  }

  public abstract generateRecord(): T

  public abstract registryConfirmation: registryConfirmation

  public static register<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>,
    table: Table<T>,
    loadFactory: loadFactory<T, U>
  ): registryConfirmation {
    const registryConfirmation = {
      tableUpdate: this.tables.set(entityConstructor, table),
      cacheUpdate: this.caches.set(entityConstructor, []),
      loadFactoryUpdate: this.loadFactories.set(entityConstructor, loadFactory),
    }
    return registryConfirmation
  }

  static async fetchEntity<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>,
    id: string
  ): Promise<U | null> {
    const table = Entity.findTable<T>(entityConstructor)
    const loadFactory = Entity.findLoadFactory<T, U>(entityConstructor)
    const record = await table.fetch(id)
    if (record == null) return null
    const newEntity = await loadFactory(record)
    return newEntity
  }

  static async filterEntity<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>,
    filterFn: (entity: T) => boolean
  ): Promise<Array<U>> {
    const table = Entity.findTable<T>(entityConstructor)
    const loadFactory = Entity.findLoadFactory<T, U>(entityConstructor)
    const records = await table.filter(filterFn)
    const newEntities = await Promise.all(
      records.map(async (record) => await loadFactory(record))
    )

    return newEntities
  }

  static async findEntity<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>,
    findFn: (entity: T) => boolean
  ): Promise<U | undefined> {
    const table = Entity.findTable<T>(entityConstructor)
    const loadFactory = Entity.findLoadFactory<T, U>(entityConstructor)
    const record = await table.find(findFn)
    if (!record) return undefined
    const newEntity = await loadFactory(record)
    return newEntity
  }

  save() {
    const ctor = extractCtor(this)
    const table = Entity.findTable(ctor)
    const record = this.generateRecord()
    table.crupdate(record)
  }

  public static async generateId<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Promise<string> {
    const table = this.findTable(entityConstructor)
    return table.generateId()
  }

  public static entityCacheList(): string {
    const cacheList: Array<string> = []
    Entity.caches.forEach((cache, ctor) => {
      cacheList.push(`${ctor.name} - ${cache.length} entries cached`)
    })
    return cacheList.join('\n')
  }

  private static findTable<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Table<T> {
    const table = Entity.tables.get(entityConstructor)
    if (table) return table
    else
      throw `no table exists with constructor ${entityConstructor.toString()}`
  }

  private static findCache<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): Array<Entity<T>> {
    const cache = Entity.caches.get(entityConstructor)
    if (cache) return cache
    else
      throw `no cache exists with constructor ${entityConstructor.toString()}`
  }

  private static findLoadFactory<T extends tableData, U extends Entity<T>>(
    entityConstructor: entityConstructor<T>
  ): loadFactory<T, U> {
    const loadFactory = Entity.loadFactories.get(entityConstructor)
    if (loadFactory) return loadFactory as loadFactory<T, U>
    else
      throw `no factory exists with constructor ${entityConstructor.toString()}`
  }
}

const extractCtor = (entity: Entity<any>) =>
  Object.getPrototypeOf(entity).constructor
