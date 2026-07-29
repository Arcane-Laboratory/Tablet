import { SheetTable } from './SheetTable'
import { baseTableData } from '../../types/tableTypes'

interface TestEntry extends baseTableData {
  name: string
}

// eslint-disable-next-line no-var
var testMocks: {
  mockGetRows: jest.Mock
  mockSpreadsheet: {
    title: string
    sheetsByTitle: Record<string, unknown>
    addSheet: jest.Mock
  }
}

jest.mock('./sheetsUtil', () => {
  const mockGetRows = jest.fn().mockResolvedValue([])
  const mockSheet = {
    loadHeaderRow: jest.fn().mockResolvedValue(undefined),
    headerValues: ['_id', 'createdAt', 'lastUpdate', 'name'],
    setHeaderRow: jest.fn().mockResolvedValue(undefined),
    getRows: mockGetRows,
    addRow: jest.fn().mockResolvedValue(undefined),
  }
  const mockSpreadsheet = {
    title: 'Test Spreadsheet',
    sheetsByTitle: {} as Record<string, unknown>,
    addSheet: jest.fn().mockResolvedValue(mockSheet),
  }
  testMocks = { mockGetRows, mockSpreadsheet }
  return {
    loadSpreadsheet: jest.fn().mockResolvedValue(mockSpreadsheet),
    limiter: { removeTokens: jest.fn().mockResolvedValue(1) },
    parseVal: jest.fn((val: string) => {
      try {
        return JSON.parse(val)
      } catch {
        return val
      }
    }),
  }
})

const spreadsheetInfo = {
  spreadsheetId: 'test-spreadsheet-id',
  gKey: {
    private_key: 'test-key',
    client_email: 'test@example.com',
  },
}

function makeRow(id: string, name: string) {
  return {
    rowNumber: 2,
    _id: JSON.stringify(id),
    createdAt: JSON.stringify('2020-01-01'),
    lastUpdate: JSON.stringify('2020-01-01'),
    name: JSON.stringify(name),
  }
}

function createTable(name: string): SheetTable<TestEntry> {
  testMocks.mockSpreadsheet.sheetsByTitle[name] = {
    loadHeaderRow: jest.fn().mockResolvedValue(undefined),
    headerValues: ['_id', 'createdAt', 'lastUpdate', 'name'],
    setHeaderRow: jest.fn().mockResolvedValue(undefined),
    getRows: testMocks.mockGetRows,
    addRow: jest.fn().mockResolvedValue(undefined),
  }
  return new SheetTable<TestEntry>(name, spreadsheetInfo, {
    _id: 'example',
    name: 'example',
  })
}

describe('SheetTable.fetchAll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testMocks.mockGetRows.mockResolvedValue([])
    testMocks.mockSpreadsheet.sheetsByTitle = {}
  })

  it('reloads rows from the sheet on each fetchAll call', async () => {
    testMocks.mockGetRows.mockResolvedValue([makeRow('1', 'alpha')])
    const table = createTable('FetchAllRefreshTable')
    await table.loadPromise

    const first = await table.fetchAll()
    expect(first).toEqual([
      expect.objectContaining({ _id: '1', name: 'alpha' }),
    ])

    testMocks.mockGetRows.mockResolvedValue([makeRow('1', 'beta')])
    const second = await table.fetchAll()
    expect(second).toEqual([
      expect.objectContaining({ _id: '1', name: 'beta' }),
    ])
    expect(testMocks.mockGetRows.mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('clears loadPromise after a fetch-triggered load', async () => {
    testMocks.mockGetRows.mockResolvedValue([makeRow('1', 'alpha')])
    const table = createTable('FetchAllClearPromiseTable')
    await table.loadPromise

    await table.fetchAll()
    expect(table.loadPromise).toBeNull()
  })

  it('honors forceRefresh=false while a load is in flight', async () => {
    let resolveRows!: (rows: ReturnType<typeof makeRow>[]) => void
    const pendingRows = new Promise<ReturnType<typeof makeRow>[]>((resolve) => {
      resolveRows = resolve
    })
    testMocks.mockGetRows.mockReturnValueOnce(pendingRows)

    const table = createTable('FetchAllForceRefreshFalseTable')
    // Constructor load is still pending; start a shared in-flight fetchAll.
    const inFlight = table.fetchAll(false)
    const coalesced = table.fetchAll(false)

    resolveRows([makeRow('1', 'shared')])
    const [a, b] = await Promise.all([inFlight, coalesced])

    expect(a).toEqual([expect.objectContaining({ _id: '1', name: 'shared' })])
    expect(b).toEqual([expect.objectContaining({ _id: '1', name: 'shared' })])
    // Both calls await the in-flight constructor load; no extra reload.
    expect(testMocks.mockGetRows).toHaveBeenCalledTimes(1)
  })
})
