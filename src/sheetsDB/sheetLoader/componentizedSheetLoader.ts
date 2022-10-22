import { SheetData } from '../db_sheets/sheetData'
import {
  componentData,
  componentizedIdData,
  GihaTable,
  linkData,
  PARSABLE_TYPE,
} from '../tables/table'
import { warn } from '../util/logUtil'

const loadComponentizedTable = async <
  T extends componentizedIdData,
  U extends componentData
>(
  table: GihaTable<T>,
  linkTableName: string,
  componentTables: Array<GihaTable<U>>,
  dbName: string
) => {
  const linkTable = new GihaTable<linkData>(
    linkTableName,
    new Map<string, PARSABLE_TYPE>()
      .set('id', PARSABLE_TYPE.STRING)
      .set('parentId', PARSABLE_TYPE.STRING)
      .set('componentDb', PARSABLE_TYPE.STRING)
      .set('componentId', PARSABLE_TYPE.STRING),
    true
  )

  const mainSheet = new SheetData<T>(dbName, table)

  const componentLinkSheet = new SheetData<linkData>(dbName, linkTable)

  const componentSheets: Array<SheetData<U>> = []
  componentTables.forEach((componentTable) => {
    componentSheets.push(new SheetData<U>(dbName, componentTable))
  })
  const loadPromises: Array<Promise<boolean>> = []
  loadPromises.push(mainSheet.loadData())
  loadPromises.push(componentLinkSheet.loadData())
  componentSheets.forEach((compSheet) =>
    loadPromises.push(compSheet.loadData())
  )
  await Promise.all(loadPromises)

  table.addEntries(mainSheet.getAll())
  linkTable.addEntries(componentLinkSheet.getAll())
  componentTables.forEach((componentTable) => {
    const compSheet = componentSheets.find(
      (sheet) => sheet.table === componentTable
    )
    if (!compSheet) throw `could not find a sheet with name ${componentTable}`
    componentTable.addEntries(compSheet.getAll())
  })

  linkTable.data.forEach((link) => {
    const entry = table.getEntryById(link.id)
    if (!entry)
      return warn(
        'componentizedSheetLoader',
        `no entry ${link.id} found in ${table.name}`
      )

    const componentTable = componentTables.find(
      (componentTable) => componentTable.name == link.componentDb
    )
    if (!componentTable)
      return warn(
        'componentizedSheetLoader',
        `no componentTable named ${link.componentDb} found. Skipping link ${link.id} in table ${table.name}`
      )

    const component = componentTable.data.find(
      (comp) => comp.id == link.componentId
    )
    if (!component)
      return warn(
        'componentizedSheetLoader',
        `no entry ${link.componentId} found in ${link.componentDb}. Skipping link ${link.id} in table ${table.name}`
      )
    if (!entry.components) entry.components = []
    entry.components.push(component)
  })
}

export { loadComponentizedTable }
