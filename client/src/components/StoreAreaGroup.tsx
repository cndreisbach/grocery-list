import type { Item } from '../types'
import ItemRow from './ItemRow'

interface Props {
  area: string
  items: Item[]
  listId: string
  dictionary: Record<string, string>
  areas: string[]
}

export default function StoreAreaGroup({ area, items, listId, dictionary, areas }: Props) {
  return (
    <div className="store-group">
      <div className="store-group__header">
        <span className="store-group__badge">{area}</span>
      </div>
      <div className="store-group__items">
        {items.map(item => (
          <ItemRow key={item.id} item={item} listId={listId} dictionary={dictionary} areas={areas} />
        ))}
      </div>
    </div>
  )
}
