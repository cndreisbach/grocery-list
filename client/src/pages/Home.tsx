import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Home() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState<'create' | 'recover' | null>(null)
  const [recovered, setRecovered] = useState(false)

  function validate() {
    if (!email) { setEmailError('Email is required'); return false }
    if (!isValidEmail(email)) { setEmailError('Enter a valid email address'); return false }
    setEmailError('')
    return true
  }

  async function handleCreate() {
    if (!validate()) return
    setLoading('create')
    try {
      const list = await api.createList(email)
      navigate(`/list/${list.id}`)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(null)
    }
  }

  async function handleRecover() {
    if (!validate()) return
    setLoading('recover')
    try {
      await api.recoverLists(email)
      setRecovered(true)
    } catch {
      setEmailError('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="home">
      <div className="home__logo">🛒</div>
      <h1 className="home__title">Grocery List</h1>
      <p className="home__subtitle">A simple shared list for your household</p>

      <div className="home__card">
        <div className="home__input-group">
          <label className="home__label" htmlFor="email">Your email address</label>
          <input
            id="email"
            type="email"
            className={`input${emailError ? ' input--error' : ''}`}
            placeholder="you@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError('') }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoComplete="email"
            inputMode="email"
          />
          {emailError && <span className="input-error">{emailError}</span>}
        </div>

        <div className="home__actions">
          <button
            className="btn btn--primary"
            onClick={handleCreate}
            disabled={loading !== null}
          >
            {loading === 'create' ? 'Creating…' : 'Create new list'}
          </button>

          <div className="home__divider">or</div>

          <button
            className="btn btn--secondary"
            onClick={handleRecover}
            disabled={loading !== null}
          >
            {loading === 'recover' ? 'Sending…' : 'Send me my lists'}
          </button>

          {recovered && (
            <p className="home__confirmation">Check your email for your list links.</p>
          )}
        </div>
      </div>
    </main>
  )
}
