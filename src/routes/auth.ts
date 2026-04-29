import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomUUID, randomBytes } from 'crypto'
import db from '../db'
import { adoptLegacyLists } from '../db'
import { sendOtpEmail } from '../email'
import { requireAuth } from '../middleware/auth'

const app = new Hono()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateOtp(): string {
  return String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000))
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// POST /api/auth/request-otp
app.post('/request-otp', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email: string = body?.email ?? ''

  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  db.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)').run(randomUUID(), email)
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string }

  const recentCount = (db.prepare(`
    SELECT COUNT(*) as count FROM otp_codes
    WHERE user_id = ? AND created_at > datetime('now', '-10 minutes')
  `).get(user.id) as { count: number }).count

  if (recentCount >= 3) {
    return c.json({ error: 'Too many requests. Please wait before requesting another code.' }, 429)
  }

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO otp_codes (id, code, user_id, expires_at) VALUES (?, ?, ?, ?)').run(
    randomUUID(), code, user.id, expiresAt
  )

  await sendOtpEmail(email, code)
  return c.json({ message: 'Code sent' })
})

// POST /api/auth/verify-otp
app.post('/verify-otp', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email: string = body?.email ?? ''
  const code: string = String(body?.code ?? '').trim()

  if (!email || !code) {
    return c.json({ error: 'Email and code required' }, 400)
  }

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email) as
    | { id: string; email: string }
    | null
  if (!user) return c.json({ error: 'Invalid code' }, 400)

  const otp = db.prepare(`
    SELECT id, code, expires_at, used, attempts
    FROM otp_codes
    WHERE user_id = ? AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(user.id) as {
    id: string; code: string; expires_at: string; used: number; attempts: number
  } | null

  if (!otp) return c.json({ error: 'Invalid or expired code' }, 400)

  if (otp.attempts >= 5) {
    return c.json({ error: 'Too many attempts. Please request a new code.' }, 400)
  }

  if (new Date(otp.expires_at) < new Date()) {
    return c.json({ error: 'Code has expired. Please request a new one.' }, 400)
  }

  if (otp.code !== code) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(otp.id)
    return c.json({ error: 'Invalid code' }, 400)
  }

  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id)
  adoptLegacyLists(user.id, user.email)

  const token = generateToken()
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id)

  setCookie(c, 'session', token, {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return c.json({ id: user.id, email: user.email })
})

// POST /api/auth/logout
app.post('/logout', (c) => {
  const token = getCookie(c, 'session')
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ message: 'Logged out' })
})

// GET /api/auth/me
app.get('/me', requireAuth, (c) => {
  return c.json(c.get('user'))
})

export default app
