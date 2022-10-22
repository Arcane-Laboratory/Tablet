import { protoBagComponent } from '../itemComponents/Bags'
import { protoWeaponComponent } from '../itemComponents/Weapons'
import { protoItemComponent } from '../items/itemComponent'
import { protoItem, protoItems } from '../items/protoItem'
import { GihaTable, PARSABLE_TYPE } from '../tables/table'
import { loadComponentizedTable } from './componentizedSheetLoader'

const dbName = '🎆giha_DB'

const protoBagComponentTable = new GihaTable<protoBagComponent>(
  'BagComponents',
  new Map<string, PARSABLE_TYPE>()
    .set('minCapacity', PARSABLE_TYPE.NUMBER)
    .set('maxCapacity', PARSABLE_TYPE.NUMBER)
    .set('type', PARSABLE_TYPE.STRING),
  true
)

const protoWeaponComponentTable = new GihaTable<protoWeaponComponent>(
  'WeaponComponents',
  new Map<string, PARSABLE_TYPE>()
    .set('minDmg', PARSABLE_TYPE.STRING)
    .set('maxDmg', PARSABLE_TYPE.STRING)
    .set('type', PARSABLE_TYPE.STRING),
  true
)
const protoItemComponentTables = [
  protoWeaponComponentTable,
  protoBagComponentTable,
]

const loadProtoItems = async () =>
  loadComponentizedTable<protoItem, protoItemComponent>(
    protoItems,
    'ProtoItem_Component_Link',
    protoItemComponentTables,
    dbName
  )

export { loadProtoItems }
