import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { ListSummary } from '../types'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: lists, isLoading } = useQuery<ListSummary[]>({
    queryKey: ['my-lists'],
    queryFn: api.getMyLists,
  })

  async function handleDelete(id: string) {
    await api.deleteList(id)
    setConfirmDeleteId(null)
    queryClient.invalidateQueries({ queryKey: ['my-lists'] })
  }

  async function handleCreate() {
    setCreating(true)
    setCreateError('')
    try {
      const list = await api.createList(newListName.trim() || undefined)
      queryClient.invalidateQueries({ queryKey: ['my-lists'] })
      navigate(`/list/${list.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong')
      setCreating(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="page">
      <header className="header">
        <span className="header__title">My Lists</span>
        <button className="header__btn" onClick={logout}>Sign out</button>
      </header>

      <main style={{ padding: '20px', flex: 1 }}>
        {lists && lists.length > 0 && (
          <ul className="dashboard__lists">
            {lists.map(list => (
              <li key={list.id} className="dashboard__list-item">
                {confirmDeleteId === list.id ? (
                  <div className="dashboard__list-confirm">
                    <span className="dashboard__list-name">Delete "{list.name}"?</span>
                    <button className="btn btn--danger" onClick={() => handleDelete(list.id)}>Delete</button>
                    <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                  </div>
                ) : (
                  <Link to={`/list/${list.id}`} className="dashboard__list-link">
                    <span className="dashboard__list-name">{list.name}</span>
                    <span className="dashboard__list-role">{list.role}</span>
                    {list.role === 'owner' && (
                      <button
                        className="dashboard__list-delete"
                        onClick={e => { e.preventDefault(); setConfirmDeleteId(list.id) }}
                        aria-label={`Delete ${list.name}`}
                      >✕</button>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="home__card" style={{ marginTop: lists && lists.length > 0 ? 24 : 0 }}>
          <p className="home__label" style={{ marginBottom: 8 }}>Create a new list</p>
          <div className="home__input-group">
            <input
              type="text"
              className={`input${createError ? ' input--error' : ''}`}
              placeholder="List name (optional)"
              value={newListName}
              onChange={e => { setNewListName(e.target.value); setCreateError('') }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            {createError && <span className="input-error">{createError}</span>}
          </div>
          <div className="home__actions">
            <button className="btn btn--primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create list'}
            </button>
          </div>
        </div>

        <p className="home__subtitle" style={{ marginTop: 16, fontSize: '0.85rem' }}>
          Signed in as {user?.email}
        </p>
      </main>
    </div>
  )
}
