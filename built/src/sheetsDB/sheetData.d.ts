import {
  GihaTable,
  headerTypeMap,
  idData,
  PARSABLE_TYPE,
} from '../tables/_tableIndex'
declare class SheetData<data extends idData> {
  readonly tabTitle: string
  readonly headerTypeMap: headerTypeMap
  private spreadsheet
  private sheet
  private rows
  constructor(spreadsheetTitle: string, table: GihaTable<data>)
  add: (values: data) => Promise<void>
  getById: (id: string) => data | undefined
  getRowById: (id: string) => any
  getAll: () => data[]
  private parseRow
  updateOrAdd: (values: data) => Promise<boolean>
  loadData: () => Promise<boolean>
  private createSheet
  private syncSheetHeaders
}
export { SheetData, PARSABLE_TYPE, headerTypeMap, idData }
//# sourceMappingURL=sheetData.d.ts.map
