const nowString = () => Date.now().toLocaleString()

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
  CREATIONS: { value: number; verboseOnly: false }
  READS: { value: number; verboseOnly: false }
  UPDATES: { value: number; verboseOnly: false }
  DELETIONS: { value: number; verboseOnly: false }
}

export { nowString, summary, summaryEntry, tableSummary }
