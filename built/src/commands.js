'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.entityCache =
  exports.allEntities =
  exports.entityList =
  exports.tableList =
  exports.tableToString =
    void 0
const Entity_1 = require('./Entity')
const Table_1 = require('./Table')
const tableToString = (tableName) => {
  const table = Table_1.Table.all.get(tableName)
  if (table == undefined) return 'undefined'
  else return table.toString()
}
exports.tableToString = tableToString
const tableList = () => {
  const keys = []
  Table_1.Table.all.forEach((table, key) => {
    keys.push(key)
  })
  return keys
}
exports.tableList = tableList
const allEntities = () => {
  return Entity_1.Entity.entityCacheList()
}
exports.allEntities = allEntities
const entityList = () => {
  return Entity_1.Entity.entityCacheList()
    .map((entity) => `${entity.ctorName} - ${entity.cacheSize} entries cached`)
    .join('\n')
}
exports.entityList = entityList
const entityCache = (entityName) => {
  const cache = Entity_1.Entity.entityCacheList().find(
    (entity) => entity.ctorName == entityName
  )
  if (cache === undefined)
    return `no entity cache found with name ${entityName}`
  return (
    `${cache.ctorName}: [${cache.cacheSize} entries]\n   ` +
    Array.from(cache.cache)
      .map((entry) => {
        return entry.toString()
      })
      .join('\n   ')
  )
}
exports.entityCache = entityCache
