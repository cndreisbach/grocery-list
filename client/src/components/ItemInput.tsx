import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { queueMutation } from '../lib/offlineQueue'
import { classifyItem, getSuggestions } from '../lib/classify'
import { useIsTouch } from '../lib/useIsTouch'
import type { HistoryEntry } from '../types'

interface Props {
  listId: string
  history: HistoryEntry[]
  dictionary: Record<string, string>
}

export default function ItemInput({ listId, history, dictionary }: Props) {
  const queryClient = useQueryClient()
  const isTouch = useIsTouch()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ name: string; store_area: string }>>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const keepOpenRef = useRef(false)

  function handleChange(text: string) {
    setValue(text)
    setActiveIdx(-1)
    setSuggestions(text ? getSuggestions(text, dictionary, history) : [])
  }

  async function submit(name: string) {
    const trimmed = name.trim()
    if (!trimmed) { inputRef.current?.focus(); return }

    const cached = queryClient.getQueryData<{ items: Array<{ name: string }> }>(['list', listId])
    if (cached?.items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      if (!window.confirm(`"${trimmed}" is already on the list. Add anyway?`)) {
        setValue('')
        setSuggestions([])
        inputRef.current?.focus()
        return
      }
    }

    const store_area = classifyItem(trimmed, dictionary, history)
    setValue('')
    setSuggestions([])
    setActiveIdx(-1)

    const mutation = {
      method: 'POST',
      url: `/api/lists/${listId}/items`,
      body: { name: trimmed, store_area, area_overridden: false },
    }

    if (!navigator.onLine) {
      queueMutation(mutation)
      queryClient.setQueryData<{ items: Array<object>; history: HistoryEntry[] }>(
        ['list', listId],
        old => old ? {
          ...old,
          items: [...old.items, {
            id: `temp-${Date.now()}`,
            list_id: listId,
            name: trimmed,
            store_area,
            area_overridden: false,
            checked: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
        } : old
      )
    } else {
      try {
        await api.addItem(listId, { name: trimmed, store_area, area_overridden: false })
        queryClient.invalidateQueries({ queryKey: ['list', listId] })
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to add item')
      }
    }

    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (activeIdx < suggestions.length - 1) {
        e.preventDefault()
        keepOpenRef.current = true
        setActiveIdx(i => i + 1)
      } else {
        setSuggestions([])
        setActiveIdx(-1)
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (activeIdx > 0) {
        e.preventDefault()
        keepOpenRef.current = true
        setActiveIdx(i => i - 1)
      } else if (activeIdx === 0) {
        e.preventDefault()
        keepOpenRef.current = true
        setActiveIdx(-1)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        submit(suggestions[activeIdx].name)
      } else {
        submit(value)
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setActiveIdx(-1)
    }
  }

  return (
    <div className="item-input">
      <div className="item-input__form">
        <input
          ref={inputRef}
          className="input item-input__field"
          placeholder="Add an item…"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (isTouch) return
            if (keepOpenRef.current) { keepOpenRef.current = false; return }
            setTimeout(() => setSuggestions([]), 150)
          }}
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className="btn btn--primary item-input__btn"
          onClick={() => submit(value)}
          type="button"
        >
          +
        </button>
      </div>

      {suggestions.length > 0 && isTouch && (
        <div className="autocomplete-chips">
          {suggestions.map(s => (
            <button
              key={s.name}
              className="autocomplete-chip"
              onMouseDown={() => submit(s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && !isTouch && (
        <div className="autocomplete">
          {suggestions.map((s, i) => (
            <div
              key={s.name}
              className={`autocomplete__item${i === activeIdx ? ' autocomplete__item--active' : ''}`}
              onMouseDown={() => submit(s.name)}
            >
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
