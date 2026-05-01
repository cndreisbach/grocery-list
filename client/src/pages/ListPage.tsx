import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { flushQueue } from '../lib/offlineQueue'
import type { GroceryList, Item, Store } from '../types'
import ItemInput from '../components/ItemInput'
import StoreAreaGroup from '../components/StoreAreaGroup'
import OfflineBanner from '../components/OfflineBanner'
import MembersPanel from '../components/MembersPanel'

const FALLBACK_AREAS = [
  'Produce', 'Dairy', 'Bakery', 'Meat & Seafood', 'Frozen',
  'Pantry', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Other',
]

export default function ListPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { logout } = useAuth()
  const [listName, setListName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [copied, setCopied] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const { data, isLoading, isError } = useQuery<GroceryList>({
    queryKey: ['list', id],
    queryFn: () => api.getList(id!),
    enabled: !!id,
  })

  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: api.getStores,
  })

  const { data: dictionary = {} } = useQuery<Record<string, string>>({
    queryKey: ['dictionary', data?.store_type_id],
    queryFn: () => api.getStoreDictionary(data!.store_type_id),
    enabled: !!data?.store_type_id,
  })

  const areas = data?.areas ?? FALLBACK_AREAS

  useEffect(() => {
    if (id) localStorage.setItem('lastList', id)
  }, [id])

  useEffect(() => {
    if (data?.name) setListName(data.name)
  }, [data?.name])

  // SSE for real-time updates
  useEffect(() => {
    if (!id) return
    const source = new EventSource(`/api/lists/${id}/events`)
    source.addEventListener('item_added', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    source.addEventListener('item_updated', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    source.addEventListener('item_deleted', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    source.addEventListener('items_cleared', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    source.addEventListener('list_updated', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    source.addEventListener('list_deleted', () => queryClient.invalidateQueries({ queryKey: ['list', id] }))
    return () => source.close()
  }, [id, queryClient])

  // Flush offline queue and refetch on reconnect
  useEffect(() => {
    const handleOnline = async () => {
      await flushQueue()
      queryClient.invalidateQueries({ queryKey: ['list', id] })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [id, queryClient])

  async function saveName() {
    setEditingName(false)
    if (!id || !listName.trim() || listName === data?.name) return
    try {
      await api.updateListName(id, listName.trim())
      queryClient.invalidateQueries({ queryKey: ['list', id] })
    } catch {
      setListName(data?.name ?? '')
    }
  }

  async function changeStore(storeId: string) {
    if (!id || storeId === data?.store_id) return
    await api.updateListStore(id, storeId)
    queryClient.invalidateQueries({ queryKey: ['list', id] })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const checkedCount = data?.items.filter(i => i.checked).length ?? 0

  async function clearChecked() {
    if (!id || !window.confirm('Remove all checked items?')) return
    await api.clearChecked(id)
    queryClient.invalidateQueries({ queryKey: ['list', id] })
  }

  function groupedItems(): Array<{ area: string; items: Item[] }> {
    if (!data) return []
    return areas.map(area => ({
      area,
      items: data.items.filter(i => i.store_area === area),
    })).filter(g => g.items.length > 0)
  }

  if (isLoading) {
    return <div className="spinner">Loading…</div>
  }

  if (isError || !data) {
    return (
      <div className="error-page">
        <div style={{ fontSize: '2rem' }}>🤔</div>
        <h2>List not found</h2>
        <p>This list doesn't exist or the link may be incorrect.</p>
        <Link to="/" className="btn btn--primary" style={{ marginTop: 16, width: 'auto' }}>
          Go home
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <OfflineBanner />

      <header className="header">
        {editingName ? (
          <input
            ref={nameInputRef}
            className="header__title-input"
            value={listName}
            onChange={e => setListName(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName() }}
            autoFocus
          />
        ) : (
          <h1 className="header__title" onClick={() => setEditingName(true)} title="Tap to rename">
            {data.name}
          </h1>
        )}

        {stores && stores.length > 1 && (
          <select
            className="header__store-select"
            value={data.store_id}
            onChange={e => changeStore(e.target.value)}
            title="Store"
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <button className="header__btn" onClick={copyLink} title={copied ? 'Copied!' : 'Copy link'}>
          {copied ? '✓' : '🔗'}
        </button>
        <button
          className="header__btn"
          onClick={() => setShowMembers(v => !v)}
          title="Members"
          aria-pressed={showMembers}
        >
          👥
        </button>
        <Link to="/" className="header__btn" title="My lists">☰</Link>
        <button className="header__btn" onClick={logout} title="Sign out">⎋</button>
      </header>

      {showMembers && (
        <MembersPanel listId={id!} userRole={data.user_role} />
      )}

      <div className="content">
        <ItemInput listId={id!} history={data.history} dictionary={dictionary} />

        {data.items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🥦</div>
            <p>Your list is empty. Add something above!</p>
          </div>
        ) : (
          groupedItems().map(({ area, items }) => (
            <StoreAreaGroup
              key={area}
              area={area}
              items={items}
              listId={id!}
              dictionary={dictionary}
              areas={areas}
            />
          ))
        )}
      </div>

      {checkedCount > 0 && (
        <div className="clear-checked-bar" style={{ padding: '10px 16px' }}>
          <button className="btn btn--danger btn--sm" style={{ width: '100%' }} onClick={clearChecked}>
            Remove {checkedCount} checked item{checkedCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
