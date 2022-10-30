const nowString = () => Date.now().toString()

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
  CREATED_ENTRIES: { value: number; verboseOnly: false }
  READ_ENTRIES: { value: number; verboseOnly: false }
  UPDATED_ENTRIES: { value: number; verboseOnly: false }
  DELETED_ENTRIES: { value: number; verboseOnly: false }
}

export { nowString, summary, summaryEntry, tableSummary }
