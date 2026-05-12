import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ApiToken, CreatedApiToken } from '../types'

function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return 'never used'
  const diff = Date.now() - new Date(lastUsedAt).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function TokensPanel({ listId }: { listId: string }) {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  // Holds the newly created token for the one-time reveal, then cleared on Done
  const [revealed, setRevealed] = useState<CreatedApiToken | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: tokens = [] } = useQuery<ApiToken[]>({
    queryKey: ['tokens', listId],
    queryFn: () => api.getTokens(listId),
  })

  async function handleCreate() {
    if (!newName.trim()) { setCreateError('Name required'); return }
    setCreating(true)
    setCreateError('')
    try {
      const created = await api.createToken(listId, newName.trim())
      setRevealed(created)
      setNewName('')
      queryClient.invalidateQueries({ queryKey: ['tokens', listId] })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy() {
    if (!revealed) return
    await navigator.clipboard.writeText(revealed.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDone() {
    setRevealed(null)
    setCopied(false)
  }

  async function handleRevoke(tokenId: string) {
    if (!window.confirm('Revoke this token? Any automation using it will stop working.')) return
    await api.revokeToken(listId, tokenId)
    queryClient.invalidateQueries({ queryKey: ['tokens', listId] })
  }

  return (
    <div className="tokens-panel">
      <p className="tokens-panel__title">API Tokens</p>

      {revealed ? (
        <div className="tokens-panel__reveal">
          <p className="tokens-panel__reveal-warning">
            Save this token — it won't be shown again.
          </p>
          <div className="tokens-panel__reveal-token">
            <code className="tokens-panel__token-value">{revealed.token}</code>
            <button className="btn btn--secondary btn--sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button className="btn btn--ghost btn--sm tokens-panel__done-btn" onClick={handleDone}>
            Done
          </button>
        </div>
      ) : (
        <>
          <ul className="tokens-panel__list">
            {tokens.map(t => (
              <li key={t.id} className="tokens-panel__token">
                <div className="tokens-panel__token-info">
                  <span className="tokens-panel__token-name">{t.name}</span>
                  <span className="tokens-panel__token-last4">…{t.last4}</span>
                </div>
                <span className="tokens-panel__token-used">{formatLastUsed(t.last_used_at)}</span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => handleRevoke(t.id)}
                  title="Revoke token"
                >
                  ✕
                </button>
              </li>
            ))}
            {tokens.length === 0 && (
              <li className="tokens-panel__empty">No tokens yet.</li>
            )}
          </ul>

          <div className="tokens-panel__create">
            <div className="home__input-group">
              <input
                type="text"
                className={`input input--sm${createError ? ' input--error' : ''}`}
                placeholder="Token name (e.g. home bot)"
                value={newName}
                onChange={e => { setNewName(e.target.value); setCreateError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              {createError && <span className="input-error">{createError}</span>}
            </div>
            <button
              className="btn btn--secondary btn--sm tokens-panel__create-btn"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating…' : '+ Create token'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
