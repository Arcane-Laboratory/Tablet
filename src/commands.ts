import { Entity } from './Entity'
import { Table } from './Table'

const tableToString = async (tableName: string): Promise<string> => {
  const table = Table.all.get(tableName)
  if (table == undefined) return 'undefined'
  else return table.toString()
}

const tableList = (): Array<string> => {
  const keys: Array<string> = []
  Table.all.forEach((table, key) => {
    keys.push(key)
  })
  return keys
}

const allEntities = () => {
  return Entity.entityCacheList()
}

const entityList = () => {
  return Entity.entityCacheList()
    .map((entity) => `${entity.ctorName} - ${entity.cacheSize} entries cached`)
    .join('\n')
}

const entityCache = (entityName: string): string => {
  const cache = Entity.entityCacheList().find(
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

export { tableToString, tableList, entityList, allEntities, entityCache }
