import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { JsonTable } from './JsonTable'
import { Table } from '../Table'
import { tableData } from '../../types/tableTypes'

interface TestEntry extends tableData {
  name: string
}

// Access private flush fields for race coverage without widening production API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function internals(table: JsonTable<TestEntry>): any {
  return table
}

describe('JsonTable.crupdate and ioBuffer', () => {
  let tempDir: string

  beforeEach(() => {
    Table.all.clear()
    tempDir = mkdtempSync(path.join(tmpdir(), 'tablet-json-'))
  })

  afterEach(() => {
    Table.all.clear()
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('treats _version 0 as present and bumps to 1', async () => {
    const table = new JsonTable<TestEntry>('VersionZero', tempDir)
    await table.loadPromise
    clearInterval(internals(table).ioBufferInterval)

    const result = await table.crupdate({
      _id: 'a',
      _version: 0,
      name: 'zero',
    })

    expect(result).toEqual(
      expect.objectContaining({ _id: 'a', _version: 1, name: 'zero' })
    )
  })

  it('keeps bufferWrite true when a write lands during flush', async () => {
    const table = new JsonTable<TestEntry>('FlushRace', tempDir)
    await table.loadPromise
    const t = internals(table)
    clearInterval(t.ioBufferInterval)

    await table.crupdate({
      _id: 'a',
      _version: undefined,
      name: 'first',
    })
    expect(t.bufferWrite).toBe(true)
    const generationBeforeFlush = t.writeGeneration

    let resolveSave!: () => void
    const saveGate = new Promise<void>((resolve) => {
      resolveSave = resolve
    })
    const originalSave = t.saveTable.bind(table)
    jest.spyOn(t, 'saveTable').mockImplementation(async () => {
      await saveGate
      return originalSave()
    })

    t.ioBuffer()
    // Mid-flush write bumps generation while save is still in flight.
    await table.crupdate({
      _id: 'a',
      _version: 1,
      name: 'second',
    })
    expect(t.writeGeneration).toBeGreaterThan(generationBeforeFlush)

    resolveSave()
    await Promise.resolve()
    await Promise.resolve()

    expect(t.bufferWrite).toBe(true)
  })
})
