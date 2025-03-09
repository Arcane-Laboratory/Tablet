'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.MongoTable = void 0
const Table_1 = require('../Table')
class MongoTable extends Table_1.Table {
  constructor(
    client,
    dbName,
    name // collection name
  ) {
    super(name)
    this.client = client
    this.dbName = dbName
    this.name = name
    this.loadPromise = this.load()
  }
  async load() {
    await this.client.connect()
    this.collection = this.client.db(this.dbName).collection(this.name)
    return true
  }
  async numEntries() {
    await this.loadPromise
    return this.collection.countDocuments()
  }
  async toArray() {
    await this.loadPromise
    return this.collection.find({}).toArray()
  }
  async fetch(id, forceRefresh) {
    if (forceRefresh) this.loadPromise = this.load()
    await this.loadPromise
    const filter = { _id: id }
    return this.collection.findOne(filter)
  }
  async fetchAll(forceRefresh) {
    if (forceRefresh) this.loadPromise = this.load()
    await this.loadPromise
    return this.toArray()
  }
  async crupdate(entry) {
    await this.loadPromise
    const filter = { _id: entry._id }
    const result = await this.collection.replaceOne(filter, entry, {
      upsert: true,
    })
    if (!result.acknowledged || result.modifiedCount === 0) return false
    return entry
  }
  async crupdates(entries) {
    await this.loadPromise
    const promises = entries.map((entry) => this.crupdate(entry))
    return Promise.all(promises)
  }
  async delete(entry) {
    await this.loadPromise
    const filter = { _id: entry._id }
    const result = await this.collection.deleteOne(filter)
    if (!result.acknowledged || result.deletedCount === 0) return false
    return true
  }
  async filter(filter) {
    await this.loadPromise
    // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
    const fullCollection = (await this.fetchAll()) || []
    return fullCollection.filter(filter) || []
  }
  async find(finder) {
    await this.loadPromise
    // TODO: Use actual mogodb filter instead of getting whole collection and then filtering
    const fullCollection = (await this.fetchAll()) || []
    return fullCollection.find(finder)
  }
}
exports.MongoTable = MongoTable
