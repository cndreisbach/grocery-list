import type { Item, StoreArea } from '../types'
import ItemRow from './ItemRow'

interface Props {
  area: StoreArea
  items: Item[]
  listId: string
}

export default function StoreAreaGroup({ area, items, listId }: Props) {
  return (
    <div className="store-group">
      <div className="store-group__header">
        <span className="store-group__badge">{area}</span>
      </div>
      <div className="store-group__items">
        {items.map(item => (
          <ItemRow key={item.id} item={item} listId={listId} />
        ))}
      </div>
    </div>
  )
}
