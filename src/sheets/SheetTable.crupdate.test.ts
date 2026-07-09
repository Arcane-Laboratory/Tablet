import { randomUUID } from 'crypto'
import { SheetTable } from './SheetTable'
import { baseTableData } from '../../types/tableTypes'

const TEST_UUID = '00000000-0000-4000-8000-000000000001'
const EXISTING_ID = 'existing-id-1234'

interface TestEntry extends baseTableData {
  name: string
}

// eslint-disable-next-line no-var
var testMocks: {
  mockAddRow: jest.Mock
  mockGetRows: jest.Mock
  mockSpreadsheet: {
    title: string
    sheetsByTitle: Record<string, unknown>
    addSheet: jest.Mock
  }
}

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => TEST_UUID),
}))

jest.mock('./sheetsUtil', () => {
  const mockAddRow = jest.fn().mockResolvedValue(undefined)
  const mockGetRows = jest.fn().mockResolvedValue([])
  const mockSheet = {
    loadHeaderRow: jest.fn().mockResolvedValue(undefined),
    headerValues: ['_id', 'createdAt', 'lastUpdate', 'name'],
    setHeaderRow: jest.fn().mockResolvedValue(undefined),
    getRows: mockGetRows,
    addRow: mockAddRow,
  }
  const mockSpreadsheet = {
    title: 'Test Spreadsheet',
    sheetsByTitle: {} as Record<string, unknown>,
    addSheet: jest.fn().mockResolvedValue(mockSheet),
  }
  testMocks = { mockAddRow, mockGetRows, mockSpreadsheet }
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

function createTable(name: string): SheetTable<TestEntry> {
  testMocks.mockSpreadsheet.sheetsByTitle[name] = {
    loadHeaderRow: jest.fn().mockResolvedValue(undefined),
    headerValues: ['_id', 'createdAt', 'lastUpdate', 'name'],
    setHeaderRow: jest.fn().mockResolvedValue(undefined),
    getRows: testMocks.mockGetRows,
    addRow: testMocks.mockAddRow,
  }
  return new SheetTable<TestEntry>(name, spreadsheetInfo, {
    _id: 'example',
    name: 'example',
  })
}

describe('SheetTable.crupdate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testMocks.mockGetRows.mockResolvedValue([])
    testMocks.mockSpreadsheet.sheetsByTitle = {}
  })

  it('assigns a new UUID when _id is missing', async () => {
    const table = createTable('AutoIdTable')
    await table.loadPromise

    const entry = { name: 'new-entry' } as TestEntry
    const result = await table.crupdate(entry)

    expect(result).toBe(entry)
    expect(entry._id).toBe(TEST_UUID)
    expect(randomUUID).toHaveBeenCalled()
    expect(testMocks.mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({ _id: JSON.stringify(TEST_UUID) }),
      { raw: true, insert: false }
    )
  })

  it('preserves an existing _id', async () => {
    const table = createTable('PreserveIdTable')
    await table.loadPromise

    const entry: TestEntry = { _id: EXISTING_ID, name: 'existing-entry' }
    const result = await table.crupdate(entry)

    expect(result).toBe(entry)
    expect(entry._id).toBe(EXISTING_ID)
    expect(randomUUID).not.toHaveBeenCalled()
    expect(testMocks.mockAddRow).toHaveBeenCalledWith(
      expect.objectContaining({ _id: JSON.stringify(EXISTING_ID) }),
      { raw: true, insert: false }
    )
  })
})
