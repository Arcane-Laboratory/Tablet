import { gihaModule } from '../moduleManager'
import { loadSpreadsheets } from '../db_sheets/spreadsheetLoader'
import { getGkey } from '../db_sheets/readGKey'
import { loadStatuses } from './statusComponentLink'
import { loadProtoItems } from './protoItemsComponentLink'

export const sheetLoaderModule: gihaModule = {
  name: 'Sheet Loader',
  type: 'SHEET_LOADER',
  description: '',
  networkRequired: true,
  dependentModuleIds: [
    'UTIL',
    'DATABASE',
    'ITEMS',
    'ITEM_COMPONENTS',
    'STATUS',
  ],
  commands: [],
  initializer: async () => {
    const sheetIds = ['1lmy0kyOahtDg-TWq7SGLD4hMrBCtSzOsWnMOr4_iemY']
    await loadSpreadsheets(sheetIds, getGkey())
    await loadProtoItems()
    await loadStatuses()
  },
}

interface idData {
  id: string
  lastEdit?: string
}

interface componentizedIdData extends idData {
  components?: Array<idData>
}

type componentData = idData

// linkData is used for interfacing with databases which do not support relational structures
interface linkData {
  id: string // parent Id
  parentId: string
  componentId: string
  componentDb: string
}
