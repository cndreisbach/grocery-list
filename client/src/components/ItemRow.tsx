import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queueMutation } from '../lib/offlineQueue'
import { classifyItem } from '../lib/classify'
import type { Item, GroceryList } from '../types'
import AreaPicker from './AreaPicker'

interface Props {
  item: Item
  listId: string
  dictionary: Record<string, string>
  areas: string[]
}

export default function ItemRow({ item, listId, dictionary, areas }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.name)
  const [showAreaPicker, setShowAreaPicker] = useState(false)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['list', listId] })
  }

  async function toggle() {
    const update = { checked: !item.checked }
    if (!navigator.onLine) {
      queueMutation({ method: 'PATCH', url: `/api/lists/${listId}/items/${item.id}`, body: update })
      queryClient.setQueryData<GroceryList>(['list', listId], old =>
        old ? { ...old, items: old.items.map(i => i.id === item.id ? { ...i, ...update } : i) } : old
      )
    } else {
      await api.updateItem(listId, item.id, update).catch(console.error)
      invalidate()
    }
  }

  async function deleteItem() {
    if (!navigator.onLine) {
      queueMutation({ method: 'DELETE', url: `/api/lists/${listId}/items/${item.id}` })
      queryClient.setQueryData<GroceryList>(['list', listId], old =>
        old ? { ...old, items: old.items.filter(i => i.id !== item.id) } : old
      )
    } else {
      await api.deleteItem(listId, item.id).catch(console.error)
      invalidate()
    }
  }

  async function saveName() {
    setEditing(false)
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === item.name) { setEditValue(item.name); return }

    const store_area = item.area_overridden ? item.store_area : classifyItem(trimmed, dictionary)
    await api.updateItem(listId, item.id, { name: trimmed, store_area, area_overridden: item.area_overridden }).catch(console.error)
    invalidate()
  }

  return (
    <>
      <div className={`item-row${item.checked ? ' item-row--checked' : ''}`}>
        <button
          className={`item-row__checkbox${item.checked ? ' item-row__checkbox--checked' : ''}`}
          onClick={toggle}
          aria-label={item.checked ? 'Uncheck item' : 'Check item'}
        >
          {item.checked && '✓'}
        </button>

        {editing ? (
          <input
            className="item-row__name-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditing(false); setEditValue(item.name) } }}
            autoFocus
          />
        ) : (
          <span
            className={`item-row__name${item.checked ? ' item-row__name--checked' : ''}`}
            onDoubleClick={() => { setEditing(true); setEditValue(item.name) }}
          >
            {item.name}
          </span>
        )}

        <div className="item-row__actions">
          <button
            className={`item-row__area-btn${item.area_overridden ? ' item-row__area-btn--overridden' : ''}`}
            onClick={() => setShowAreaPicker(true)}
            title={item.area_overridden ? 'Area manually set — tap to change' : 'Tap to change area'}
          >
            {item.area_overridden ? '✎ ' : ''}{item.store_area}
          </button>
          <button
            className="item-row__delete-btn"
            onClick={deleteItem}
            aria-label="Delete item"
          >
            ✕
          </button>
        </div>
      </div>

      {showAreaPicker && (
        <AreaPicker
          current={item.store_area}
          areas={areas}
          onSelect={async area => {
            setShowAreaPicker(false)
            await api.updateItem(listId, item.id, { store_area: area, area_overridden: true }).catch(console.error)
            invalidate()
          }}
          onClose={() => setShowAreaPicker(false)}
        />
      )}
    </>
  )
}
