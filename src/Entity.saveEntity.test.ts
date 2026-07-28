import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { Entity } from './Entity'
import { JsonTable } from './json/JsonTable'
import { Table } from './Table'
import { tableData } from '../types/tableTypes'

interface TestRecord extends tableData {
  name: string
}

class SaveTestEntity extends Entity<TestRecord> {
  public name: string

  constructor(id: string | undefined, name: string) {
    super(id)
    this.name = name
  }

  public generateRecord(): TestRecord {
    return {
      _id: this._id,
      _version: this._version,
      name: this.name,
    }
  }

  public async save(): Promise<TestRecord | null> {
    return this.saveEntity()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stopFlush(table: JsonTable<TestRecord>): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clearInterval((table as any).ioBufferInterval)
}

describe('Entity.saveEntity version handling', () => {
  let tempDir: string
  let table: JsonTable<TestRecord>
  let tableName: string

  beforeEach(async () => {
    Table.all.clear()
    tempDir = mkdtempSync(path.join(tmpdir(), 'tablet-entity-'))
    tableName = `SaveEntity_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`
    table = new JsonTable<TestRecord>(tableName, tempDir)
    await table.loadPromise
    SaveTestEntity.registerEntity(table, async (record) => {
      const entity = new SaveTestEntity(record._id, record.name)
      entity._version = record._version
      return entity
    })
  })

  afterEach(() => {
    stopFlush(table)
    Table.all.clear()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('persists updates when live _version is undefined but table has version 1', async () => {
    await table.crupdate({
      _id: 'hero-1',
      _version: undefined,
      name: 'initial',
    })
    const stored = await table.fetch('hero-1')
    expect(stored?._version).toBe(1)

    const entity = new SaveTestEntity('hero-1', 'updated')
    entity._version = undefined

    const written = await entity.save()

    expect(written).not.toBeNull()
    expect(written?.name).toBe('updated')
    expect(written?._version).toBe(2)
    expect(entity._version).toBe(2)
    expect((await table.fetch('hero-1'))?.name).toBe('updated')
  })

  it('persists when live _version is behind cache by 2+ and syncs this._version', async () => {
    await table.crupdate({
      _id: 'hero-2',
      _version: undefined,
      name: 'v1',
    })
    // Bump cache to version 3 (two crupdates from version 1).
    await table.crupdate({ _id: 'hero-2', _version: 1, name: 'v2' })
    await table.crupdate({ _id: 'hero-2', _version: 2, name: 'v3' })
    expect((await table.fetch('hero-2'))?._version).toBe(3)

    const entity = new SaveTestEntity('hero-2', 'recovered')
    entity._version = 1

    const written = await entity.save()

    expect(written).not.toBeNull()
    expect(written?.name).toBe('recovered')
    expect(written?._version).toBe(4)
    expect(entity._version).toBe(written?._version)
  })

  it('returns null and logs after exhausted version retries', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const conflictTable = {
      crupdate: jest.fn().mockResolvedValue(false),
      fetch: jest.fn().mockResolvedValue({
        _id: 'hero-3',
        _version: 9,
        name: 'stale',
      }),
    }

    const entity = new SaveTestEntity('hero-3', 'lost')
    entity._version = 1
    jest.spyOn(entity, 'writeRecordWithMerge').mockImplementation(async () => {
      return Entity.prototype.writeRecordWithMerge.call(
        entity,
        conflictTable as unknown as JsonTable<TestRecord>,
        entity.generateRecord()
      )
    })

    const written = await entity.save()

    expect(written).toBeNull()
    expect(conflictTable.crupdate).toHaveBeenCalledTimes(5)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
