import { mock, describe, test, expect, beforeEach } from 'bun:test'

const emailsSent: Array<{ to: string; code: string }> = []

mock.module('../email', () => ({
  sendOtpEmail: async (to: string, code: string) => { emailsSent.push({ to, code }) },
  sendListCreatedEmail: async () => {},
  sendInviteEmail: async () => {},
  sendRecoveryEmail: async () => {},
}))

import { Hono } from 'hono'
import authRouter from './auth'
import db from '../db'

const app = new Hono().route('/api/auth', authRouter)

beforeEach(() => {
  db.exec('DELETE FROM users') // cascades to otp_codes, sessions, list_members
  emailsSent.length = 0
})

const post = (path: string, body: unknown, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  }))

const get = (path: string, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  }))

async function requestOtp(email: string) {
  await post('/api/auth/request-otp', { email })
  return emailsSent.at(-1)?.code
}

async function login(email = 'user@example.com') {
  const code = await requestOtp(email)
  const res = await post('/api/auth/verify-otp', { email, code })
  const token = res.headers.get('set-cookie')?.match(/session=([^;]+)/)?.[1]
  return `session=${token}`
}

// ---------------------------------------------------------------------------

describe('POST /api/auth/request-otp', () => {
  test('valid email creates user, OTP row, and sends email', async () => {
    const res = await post('/api/auth/request-otp', { email: 'a@example.com' })
    expect(res.status).toBe(200)

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get('a@example.com')
    expect(user).toBeTruthy()

    const otp = db.prepare(
      'SELECT id FROM otp_codes WHERE user_id = (SELECT id FROM users WHERE email = ?)'
    ).get('a@example.com')
    expect(otp).toBeTruthy()

    expect(emailsSent).toHaveLength(1)
    expect(emailsSent[0].to).toBe('a@example.com')
  })

  test('existing user gets a fresh OTP without creating a duplicate user', async () => {
    await post('/api/auth/request-otp', { email: 'a@example.com' })
    emailsSent.length = 0
    await post('/api/auth/request-otp', { email: 'a@example.com' })

    const { count } = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?')
      .get('a@example.com') as { count: number }
    expect(count).toBe(1)
    expect(emailsSent).toHaveLength(1)
  })

  test('malformed email returns 400 and sends no email', async () => {
    const res = await post('/api/auth/request-otp', { email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(emailsSent).toHaveLength(0)
  })

  test('empty email returns 400', async () => {
    const res = await post('/api/auth/request-otp', { email: '' })
    expect(res.status).toBe(400)
    expect(emailsSent).toHaveLength(0)
  })

  test('4th OTP request within 10 minutes returns 429 and sends no email', async () => {
    await post('/api/auth/request-otp', { email: 'a@example.com' })
    await post('/api/auth/request-otp', { email: 'a@example.com' })
    await post('/api/auth/request-otp', { email: 'a@example.com' })
    emailsSent.length = 0

    const res = await post('/api/auth/request-otp', { email: 'a@example.com' })
    expect(res.status).toBe(429)
    expect(emailsSent).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------

describe('POST /api/auth/verify-otp', () => {
  test('correct code returns user, sets HttpOnly SameSite=Strict session cookie, marks OTP used', async () => {
    const code = await requestOtp('a@example.com')
    const res = await post('/api/auth/verify-otp', { email: 'a@example.com', code })

    expect(res.status).toBe(200)
    const body = await res.json() as { email: string }
    expect(body.email).toBe('a@example.com')

    const setCookie = res.headers.get('set-cookie')!
    expect(setCookie).toContain('session=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')

    const { used } = db.prepare('SELECT used FROM otp_codes ORDER BY created_at DESC LIMIT 1')
      .get() as { used: number }
    expect(used).toBe(1)
  })

  test('incorrect code returns 400 and does not mark OTP as used', async () => {
    await requestOtp('a@example.com')
    const res = await post('/api/auth/verify-otp', { email: 'a@example.com', code: '000000' })

    expect(res.status).toBe(400)
    const { used } = db.prepare('SELECT used FROM otp_codes ORDER BY created_at DESC LIMIT 1')
      .get() as { used: number }
    expect(used).toBe(0)
  })

  test('incorrect code increments attempt counter', async () => {
    await requestOtp('a@example.com')
    await post('/api/auth/verify-otp', { email: 'a@example.com', code: '000000' })

    const { attempts } = db.prepare('SELECT attempts FROM otp_codes ORDER BY created_at DESC LIMIT 1')
      .get() as { attempts: number }
    expect(attempts).toBe(1)
  })

  test('expired code returns 400 with expiry message', async () => {
    const code = await requestOtp('a@example.com')
    db.exec("UPDATE otp_codes SET expires_at = datetime('now', '-1 minute')")

    const res = await post('/api/auth/verify-otp', { email: 'a@example.com', code })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('expired')
  })

  test('already-used code returns 400', async () => {
    const code = await requestOtp('a@example.com')
    await post('/api/auth/verify-otp', { email: 'a@example.com', code })

    const res = await post('/api/auth/verify-otp', { email: 'a@example.com', code })
    expect(res.status).toBe(400)
  })

  test('5 incorrect attempts invalidate the OTP; further attempts return 400 with too-many-attempts message', async () => {
    const code = await requestOtp('a@example.com')

    for (let i = 0; i < 5; i++) {
      await post('/api/auth/verify-otp', { email: 'a@example.com', code: '000000' })
    }

    const res = await post('/api/auth/verify-otp', { email: 'a@example.com', code })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Too many attempts')
  })

  test('unknown email returns 400', async () => {
    const res = await post('/api/auth/verify-otp', { email: 'nobody@example.com', code: '123456' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------

describe('GET /api/auth/me', () => {
  test('valid session cookie returns user data', async () => {
    const cookie = await login('a@example.com')
    const res = await get('/api/auth/me', cookie)

    expect(res.status).toBe(200)
    const body = await res.json() as { email: string }
    expect(body.email).toBe('a@example.com')
  })

  test('missing session cookie returns 401', async () => {
    const res = await get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('invalid session token returns 401', async () => {
    const res = await get('/api/auth/me', 'session=garbage')
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  test('deletes session from database and clears cookie', async () => {
    const cookie = await login('a@example.com')
    const token = cookie.replace('session=', '')

    const res = await post('/api/auth/logout', {}, cookie)
    expect(res.status).toBe(200)

    const session = db.prepare('SELECT token FROM sessions WHERE token = ?').get(token)
    expect(session).toBeNull()

    // subsequent /me with the old cookie is rejected
    const meRes = await get('/api/auth/me', cookie)
    expect(meRes.status).toBe(401)
  })
})
