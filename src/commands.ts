import { Entity } from './Entity'
import { Table } from './Table'

const tableToString = (tableName: string): string => {
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
  const cacheList: Array<string> = []
  Entity.entityCacheList().forEach((entity) => {
    cacheList.push(`${entity.ctor.name} - ${entity.cacheSize} entries cached`)
  })
  return cacheList.join('\n')
}

export { tableToString, tableList, entityList, allEntities }
