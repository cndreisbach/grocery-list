import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Member } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MembersPanel({ listId, userRole }: { listId: string; userRole: 'owner' | 'member' }) {
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting] = useState(false)

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ['members', listId],
    queryFn: () => api.getMembers(listId),
  })

  async function handleInvite() {
    if (!EMAIL_RE.test(inviteEmail)) { setInviteError('Enter a valid email address'); return }
    setInviting(true)
    setInviteError('')
    try {
      await api.inviteMember(listId, inviteEmail)
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['members', listId] })
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!window.confirm('Remove this member?')) return
    await api.removeMember(listId, userId)
    queryClient.invalidateQueries({ queryKey: ['members', listId] })
  }

  return (
    <div className="members-panel">
      <h2 className="members-panel__title">Members</h2>
      <ul className="members-panel__list">
        {members.map(m => (
          <li key={m.id} className="members-panel__member">
            <span className="members-panel__email">{m.email}</span>
            <span className="members-panel__role">{m.role}</span>
            {userRole === 'owner' && m.role !== 'owner' && (
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => handleRemove(m.id)}
                title="Remove member"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      {userRole === 'owner' && (
        <div className="members-panel__invite">
          <div className="home__input-group">
            <input
              type="email"
              className={`input input--sm${inviteError ? ' input--error' : ''}`}
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setInviteError('') }}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              inputMode="email"
              autoComplete="email"
            />
            {inviteError && <span className="input-error">{inviteError}</span>}
          </div>
          <button className="btn btn--secondary btn--sm members-panel__invite-btn" onClick={handleInvite} disabled={inviting}>
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
        </div>
      )}
    </div>
  )
}
