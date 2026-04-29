import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequestOtp() {
    if (!EMAIL_RE.test(email)) { setError('Enter a valid email address'); return }
    setLoading(true)
    setError('')
    try {
      await api.requestOtp(email)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!code.trim()) { setError('Enter the code from your email'); return }
    setLoading(true)
    setError('')
    try {
      const user = await api.verifyOtp(email, code)
      queryClient.setQueryData(['me'], user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="home">
      <div className="home__logo">🛒</div>
      <h1 className="home__title">Grocery List</h1>
      <p className="home__subtitle">A simple shared list for your household</p>

      <div className="home__card">
        {step === 'email' ? (
          <>
            <div className="home__input-group">
              <label className="home__label" htmlFor="email">Your email address</label>
              <input
                id="email"
                type="email"
                className={`input${error ? ' input--error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
                autoComplete="email"
                inputMode="email"
                autoFocus
              />
              {error && <span className="input-error">{error}</span>}
            </div>
            <div className="home__actions">
              <button className="btn btn--primary" onClick={handleRequestOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Send login code'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="home__subtitle" style={{ marginBottom: 0 }}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <div className="home__input-group">
              <label className="home__label" htmlFor="code">Enter code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`input${error ? ' input--error' : ''}`}
                placeholder="123456"
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
              />
              {error && <span className="input-error">{error}</span>}
            </div>
            <div className="home__actions">
              <button className="btn btn--primary" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying…' : 'Sign in'}
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => { setStep('email'); setCode(''); setError('') }}
                disabled={loading}
              >
                Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
