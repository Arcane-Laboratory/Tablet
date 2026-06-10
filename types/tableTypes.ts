// Sheets "tables"
interface baseTableData {
  _id: string
  createdAt?: string
  lastUpdate?: string
}

// MongoDB and JSON tables
interface tableData extends baseTableData {
  _version: number | undefined // ensures that all the tableData pass the version if it exists
}

export { baseTableData, tableData }
