import { protoResistanceModifierComponent } from '../statusComponents/ResistanceModifier'
import { statuses } from '../statuses/status'
import { GihaTable, PARSABLE_TYPE } from '../tables/table'
import { loadComponentizedTable } from './componentizedSheetLoader'

const dbName = '🎆giha_DB'

const protoResistanceComponentTable =
  new GihaTable<protoResistanceModifierComponent>(
    'ResistanceModComponents',
    new Map<string, PARSABLE_TYPE>()
      .set('magicType', PARSABLE_TYPE.MAGIC_TYPE)
      .set('damageMultiplier', PARSABLE_TYPE.NUMBER),
    true
  )

const protoStatusComponentTables = [protoResistanceComponentTable]

const loadStatuses = async () =>
  loadComponentizedTable(
    statuses,
    'ProtoStatus_Component_Link',
    protoStatusComponentTables,
    dbName
  )

export { loadStatuses }
