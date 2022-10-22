import { Table } from './Table'

const printTable = (tableName: string) => {
  const table = Table.all.get(tableName)
  if (table == undefined) return 'undefined'
  else return table.toString()
}

const tableList = () => {
  return Table.all.keys.toString()
}

export { printTable, tableList }
