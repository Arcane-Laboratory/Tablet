'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.Table = void 0
class Table {
  constructor(name) {
    this.name = name
    this.summary = {
      ERRORS: { value: 0, verboseOnly: false },
      CREATIONS: { value: 0, verboseOnly: true },
      READS: { value: 0, verboseOnly: true },
      UPDATES: { value: 0, verboseOnly: true },
      DELETIONS: { value: 0, verboseOnly: true },
    }
    const extantTable = Table.all.get(name)
    if (extantTable)
      throw `There is already a table named ${name}. Pick a different name for this one!`
    Table.all.set(name, this)
  }
  async toString() {
    const entries = await this.numEntries()
    const str = `Tablet: ${this.name} \n${entries} entries`
    // this.cache.forEach(
    //   (datum) => (str += `\n ${datum.id}: ${Table.idDataStringify(datum)}`)
    // )
    return str
  }
  /**
   *
   * @param targetTable the table to clone this one into
   * @returns a promise of all crupdate calls to the target Table
   */
  async clone(targetTable, verbose) {
    await this.loadPromise
    await targetTable.loadPromise
    const crupdates = []
    const array = await this.toArray()
    array.map((entry) => crupdates.push(targetTable.crupdate(entry)))
    if (verbose) {
      const entries = this.numEntries()
      console.log(
        ` Tablet: Cloning ${entries} entries from ${this.name} into ${targetTable.name}`
      )
    }
    return Promise.all(crupdates)
  }
  /**
   *
   * @param entry an entry on a table
   * @returns true if the entry is valid
   */
  validate(entry) {
    return entry._id !== undefined
  }
  generateSummary() {
    return this.summary
  }
  /**
   *
   * @param verbose if true, shows everything, otherwise only shows impactful items
   * @returns a string, the summary of what Table has done so far
   */
  static getSummary(verbose) {
    const info = ['Table Summary:']
    info.push(`${Table.all.size} tables`)
    Table.all.forEach((table) => {
      const tableSummary = table.generateSummary()
      info.push(
        ` ${table.name} [${Object.getPrototypeOf(table).constructor.name}]`
      )
      Object.keys(tableSummary).forEach((key) => {
        const entry = tableSummary[key]
        if ((entry.verboseOnly === false || verbose) && entry.value != 0)
          info.push(`   ${key}: ${entry.value}`)
      })
    })
    return info.join('\n ')
  }
}
exports.Table = Table
Table.all = new Map()
