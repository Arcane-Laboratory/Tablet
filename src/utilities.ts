import { TableError } from './errors/TableErrors'

const nowString = () => new Date().toLocaleString()

export const createTableError = (
  message: string,
  operation: string,
  tableName: string,
  originalError?: Error
): TableError => {
  return new TableError(message, operation, tableName, originalError)
}

export const handleAsyncError = (
  error: unknown,
  operation: string,
  tableName: string
): never => {
  if (error instanceof Error) {
    throw new TableError(error.message, operation, tableName, error)
  } else {
    throw new TableError(
      String(error),
      operation,
      tableName,
      new Error(String(error))
    )
  }
}

interface summaryEntry {
  value: string | number | boolean
  verboseOnly?: boolean
}

interface summary {
  [key: string]: summaryEntry
  ERRORS: { value: number; verboseOnly: false }
}

interface tableSummary extends summary {
  [key: string]: summaryEntry
  ERRORS: { value: number; verboseOnly: false }
  CREATIONS: { value: number; verboseOnly: boolean }
  READS: { value: number; verboseOnly: boolean }
  UPDATES: { value: number; verboseOnly: boolean }
  DELETIONS: { value: number; verboseOnly: boolean }
}

export { nowString, summary, summaryEntry, tableSummary }
