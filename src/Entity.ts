import { Table, tableData } from './Table'

type entityConstructor<T extends tableData> = new (...args: any[]) => Entity<T>

type loadFactory<T extends tableData> = (record: T) => Promise<Entity<T>>

type registryConfirmation = {
  tableUpdate: Map<entityConstructor<any>, Table<any>>
  cacheUpdate: Map<entityConstructor<any>, Array<Entity<any>>>
  loadFactoryUpdate: Map<entityConstructor<any>, loadFactory<any>>
}

export abstract class Entity<T extends tableData> {
  private static tables: Map<entityConstructor<any>, Table<any>>
  private static caches: Map<entityConstructor<any>, Array<Entity<any>>>
  private static loadFactories: Map<entityConstructor<any>, loadFactory<any>>

  constructor() {
    const ctor = extractCtor(this)
    const table = Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    const loadFactory = Entity.findLoadFactory(ctor)
  }

  public abstract generateRecord(): T

  public abstract registryConfirmation: registryConfirmation

  protected static register<T extends tableData>(
    entityConstructor: entityConstructor<T>,
    table: Table<T>,
    loadFactory: loadFactory<T>
  ): registryConfirmation {
    const registryConfirmation = {
      tableUpdate: this.tables.set(entityConstructor, table),
      cacheUpdate: this.caches.set(entityConstructor, []),
      loadFactoryUpdate: this.loadFactories.set(entityConstructor, loadFactory),
    }
    return registryConfirmation
  }

  static async fetchEntity<T extends tableData>(
    entityConstructor: entityConstructor<T>,
    id: string
  ): Promise<Entity<T> | null> {
    const table = Entity.findTable<T>(entityConstructor)
    const loadFactory = Entity.findLoadFactory<T>(entityConstructor)
    const record = await table.fetch(id)
    if (record == null) return null
    const newEntity = await loadFactory(record)
    return newEntity
  }

  save<T extends tableData>(entity: Entity<T>) {
    const ctor = extractCtor(entity)
    const table = Entity.findTable(ctor)
    const record = entity.generateRecord()
    table.crupdate(record)
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

  private static findLoadFactory<T extends tableData>(
    entityConstructor: entityConstructor<T>
  ): loadFactory<T> {
    const loadFactory = Entity.loadFactories.get(entityConstructor)
    if (loadFactory) return loadFactory
    else
      throw `no factory exists with constructor ${entityConstructor.toString()}`
  }

  public static entityCacheList(): string {
    const cacheList: Array<string> = []
    Entity.caches.forEach((cache, ctor) => {
      cacheList.push(`${ctor.name} - ${cache.length} entries cached`)
    })
    return cacheList.join('\n')
  }
}

const extractCtor = (entity: Entity<any>) =>
  Object.getPrototypeOf(entity).constructor
