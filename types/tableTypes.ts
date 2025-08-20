import { TableError } from '../src/errors/TableErrors'

interface tableData {
  _id: string
  createdAt?: string
  lastUpdate?: string
}

// Add error result types for better error handling
type TableResult<T> = T | false
type TableErrorResult<T> = T | TableError

export { tableData, TableResult, TableErrorResult }
