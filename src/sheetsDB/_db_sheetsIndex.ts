import { gihaModule } from '../moduleManager'

export const dbSheetsModule: gihaModule = {
  name: 'db_sheets',
  type: 'DATABASE',
  networkRequired: true,
  description: 'database module which supports storage in a google sheet',
  dependentModuleIds: ['UTIL', 'TABLES'],
  commands: [],
}
