'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Entity = void 0
const crypto_1 = require('crypto')
/**
 * abstract class Entity can be implemented to make classes integrated with a Table
 * the generic T is the type of data stored in and read from the table
 * extended classes must also initialize themselves by calling their
 *   .registerEntity method
 *
 */
class Entity {
  /**
   *
   * @param _id the id of a given entity, if none exists, one is assigned
   */
  constructor(_id) {
    _id ?? (_id = (0, crypto_1.randomUUID)())
    this._id = _id
    // Ensure that Entity Subclass has been registered
    const ctor = Entity.ctorOf(this)
    Entity.findLoadFactory(ctor)
    Entity.findTable(ctor)
    const cache = Entity.findCache(ctor)
    // add this item to the cache
    cache.set(_id, this)
  }
  /**
   *
   * @param table a Table which will store this Entity's records
   * @param loadFactory a function which takes a record and returns an instance of the Entity
   * @returns true if everything worked
   */
  static registerEntity(table, loadFactory) {
    if (table == undefined)
      throw new Error(
        `TABLET_ENTITY.registerEntity: ${this.name} table can't be undefined`
      )
    if (loadFactory == undefined)
      throw new Error(
        `TABLET_ENTITY.registerEntity: ${this.name} loadFactory can't be undefined`
      )
    Entity.tables.set(this.name, table)
    Entity.caches.set(this.name, new Map())
    Entity.loadFactories.set(this.name, loadFactory)
    Entity.loadPromises.set(this.name, new Map())
    return true
  }
  /**
   *
   * @param id the id of the entity to fetch
   * @returns a promise, which will be the proper entity if it's found and null otherwise
   */
  static async fetch(id) {
    const table = Entity.findTable(this)
    if (table === null) return null
    const record = await table.fetch(id)
    if (record == null) return null
    try {
      return await Entity.build(record, this)
    } catch (err) {
      console.log(err)
      return null
    }
  }
  /**
   *
   * @returns a promise of an array of all entities from the table
   */
  static async fetchAll() {
    let successes = 0
    let failures = 0
    const table = Entity.findTable(this)
    if (table === null) return null
    const allRecords = await table.fetchAll()
    if (allRecords == false) return null
    const entities = []
    const entityPromises = allRecords.map((record) =>
      Entity.build(record, this)
        .then((entity) => {
          if (entity) {
            entities.push(entity)
            successes++
          } else failures++
        })
        .catch((err) => {
          console.log(err)
          failures++
        })
    )
    await Promise.all(entityPromises)
    return { successes, failures, entities }
  }
  /**
   *
   * @param filterFn a function used to filter entity records
   * @returns an array of instantiated entities with a record which matches properly
   */
  static async filterEntity(filterFn) {
    const table = Entity.findTable(this)
    if (table === null) return []
    const records = await table.filter(filterFn)
    const newEntities = await Promise.all(
      records.map(async (record) => {
        const cache = Entity.findCache(this)
        const foundEntity = cache.get(record._id)
        if (foundEntity) return foundEntity
        else return Entity.build(record, this)
      })
    )
    return newEntities.filter((entity) => entity !== null) // remove nulls
  }
  /**
   *
   * @param findFn a function used to find an entity record
   * @returns an instantiated entity with a record matching the findFn
   */
  static async findEntity(findFn) {
    const table = Entity.findTable(this)
    if (table === null) return undefined
    const record = await table.find(findFn)
    if (!record) return undefined
    const newEntity = await Entity.build(record, this)
    if (newEntity) return newEntity
  }
  static async findRecord(findFn) {
    const table = Entity.findTable(this)
    if (table === null) return undefined
    return table.find(findFn)
  }
  /**
   * CReate or UPDATE a specific entity's record on the table
   * @param record the record to create or update on a table
   * @returns the record that has been updated
   */
  static async crupdate(record) {
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
  async save() {
    const ctor = Entity.ctorOf(this)
    // ensure the cache is up to date
    Entity.findCache(ctor).set(this._id, this)
    const table = Entity.findTable(ctor)
    const record = this.generateRecord()
    if (table === null) return null
    const writtenRecord = await table.crupdate(record)
    if (writtenRecord) return writtenRecord._id
    else return null
  }
  saveSync() {
    this.save().catch((err) => {
      console.log(err)
    })
  }
  /**
   * delete the given entity from the table
   */
  async delete() {
    const table = Entity.findTable(Entity.ctorOf(this))
    if (table === null) return false
    const record = this.generateRecord()
    return table.delete(record)
  }
  /**
   *
   * @returns a list of all instantiated entities
   */
  static entityCacheList() {
    const ctors = []
    Entity.caches.forEach((cache, ctor) => {
      ctors.push({ ctorName: ctor, cacheSize: cache.size, cache: cache })
    })
    return ctors
  }
  /**
   *
   * @returns the number of entities in the table cache
   */
  static numCached() {
    return Entity.findCache(this).size
  }
  /**
   * delete a given entity from the table
   */
  static async deleteEntry(id) {
    const table = Entity.findTable(this)
    if (table === null) return false
    return table.delete({ _id: id })
  }
  /**
   * find a table belonging to a child class given the child class
   * @param entityConstructor the child class
   * @returns the table which stores that child class's information
   */
  static findTable(entityConstructor) {
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
  static findCache(entityConstructor) {
    const cache = Entity.caches.get(entityConstructor.name)
    if (cache) return cache
    else
      throw `no cache exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }
  static findLoadPromises(entityConstructor) {
    const loadPromises = Entity.loadPromises.get(entityConstructor.name)
    if (loadPromises) return loadPromises
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
  static findLoadFactory(entityConstructor) {
    const loadFactory = Entity.loadFactories.get(entityConstructor.name)
    if (loadFactory) return loadFactory
    else
      throw `no factory exists with constructor ${Object.getPrototypeOf(
        this
      ).constructor.toString()}`
  }
  static async build(record, ctor) {
    // if entity is already cached, return it
    const cache = Entity.findCache(ctor)
    const foundEntity = cache.get(record._id)
    if (foundEntity) return foundEntity
    // if entity is being loaded, return the promise
    const loadPromises = Entity.findLoadPromises(ctor)
    const loadPromise = loadPromises.get(record._id)
    if (loadPromise) return loadPromise
    const factory = Entity.findLoadFactory(ctor)
    const entityPromise = factory(record).catch((err) => {
      const str = `TABLET BUILD ERROR: ${ctor.name}[_id: ${record._id}]`
      console.log(str + '\n ' + err)
      return null
    })
    loadPromises.set(record._id, entityPromise)
    const newEntity = await entityPromise
    if (newEntity) {
      cache.set(newEntity._id, newEntity)
      return newEntity
    }
    return null
  }
}
exports.Entity = Entity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Entity.tables = new Map()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Entity.caches = new Map()
Entity.loadFactories = new Map()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Entity.loadPromises = new Map()
/**
 * extracts a constructor from an entity
 * @param entity the object to get the constructor of
 * @returns
 */
Entity.ctorOf = (entity) => {
  return Object.getPrototypeOf(entity).constructor
}
