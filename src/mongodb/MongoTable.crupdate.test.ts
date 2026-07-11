import { MongoClient } from 'mongodb'
import { MongoTable } from './MongoTable'
import { Table } from '../Table'
import { tableData } from '../../types/tableTypes'

interface TestEntry extends tableData {
  name: string
}

const mockFindOneAndReplace = jest.fn()
const mockCollection = {
  findOneAndReplace: mockFindOneAndReplace,
}
const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
}
const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db: jest.fn().mockReturnValue(mockDb),
} as unknown as MongoClient

function createTable(name: string): MongoTable<TestEntry> {
  return new MongoTable<TestEntry>(mockClient, 'test-db', name)
}

describe('MongoTable.crupdate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Table.all.clear()
    mockClient.connect = jest.fn().mockResolvedValue(undefined)
    mockClient.db = jest.fn().mockReturnValue(mockDb)
    mockDb.collection.mockReturnValue(mockCollection)
  })

  it('updates a versioned entry and increments _version', async () => {
    const table = createTable('VersionedUpdate')
    await table.loadPromise

    const entry: TestEntry = {
      _id: 'player-1',
      name: 'Ada',
      _version: 3,
    }
    const saved: TestEntry = { ...entry, _version: 4, name: 'Ada' }
    mockFindOneAndReplace.mockResolvedValue(saved)

    const result = await table.crupdate(entry)

    expect(result).toEqual(saved)
    expect(mockFindOneAndReplace).toHaveBeenCalledWith(
      { _id: 'player-1', _version: 3 },
      { _id: 'player-1', name: 'Ada', _version: 4 },
      { upsert: false, returnDocument: 'after' }
    )
  })

  it('upserts an unversioned entry starting at _version 1', async () => {
    const table = createTable('UnversionedUpsert')
    await table.loadPromise

    const entry: TestEntry = {
      _id: 'player-2',
      name: 'Bea',
      _version: undefined,
    }
    const saved: TestEntry = { ...entry, _version: 1 }
    mockFindOneAndReplace.mockResolvedValue(saved)

    const result = await table.crupdate(entry)

    expect(result).toEqual(saved)
    expect(mockFindOneAndReplace).toHaveBeenCalledWith(
      { _id: 'player-2' },
      { _id: 'player-2', name: 'Bea', _version: 1 },
      { upsert: true, returnDocument: 'after' }
    )
  })

  it('returns false when a versioned update matches no document', async () => {
    const table = createTable('StaleVersion')
    await table.loadPromise

    const entry: TestEntry = {
      _id: 'player-3',
      name: 'Cyd',
      _version: 1,
    }
    mockFindOneAndReplace.mockResolvedValue(null)

    const result = await table.crupdate(entry)

    expect(result).toBe(false)
    expect(mockFindOneAndReplace).toHaveBeenCalledWith(
      { _id: 'player-3', _version: 1 },
      { _id: 'player-3', name: 'Cyd', _version: 2 },
      { upsert: false, returnDocument: 'after' }
    )
  })
})
