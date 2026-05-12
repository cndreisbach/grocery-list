import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { randomUUID, randomBytes } from 'crypto'
import tokensRouter from './tokens'
import { requireAuth } from '../middleware/auth'
import db from '../db'

const app = new Hono()
app.use('/api/lists/*', requireAuth)
app.route('/api/lists', tokensRouter)

beforeEach(() => {
  db.exec('DELETE FROM list_tokens')
  db.exec('DELETE FROM lists')
  db.exec('DELETE FROM users')
})

// ---------------------------------------------------------------------------
// Helpers

function createUser(email: string) {
  const userId = randomUUID()
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(userId, email)
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return { userId, email, cookie: `session=${token}` }
}

function createList(userId: string, email: string, role: 'owner' | 'member' = 'owner') {
  const listId = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email, store_id) VALUES (?, ?, ?, ?)').run(
    listId, 'Test List', email, 'store-grocery'
  )
  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    listId, userId, role
  )
  return listId
}

function addMember(listId: string, userId: string) {
  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    listId, userId, 'member'
  )
}

const get = (path: string, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  }))

const post = (path: string, body: unknown, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  }))

const del = (path: string, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'DELETE',
    headers: cookie ? { Cookie: cookie } : {},
  }))

// ---------------------------------------------------------------------------

describe('POST /api/lists/:id/tokens', () => {
  test('creates a token and returns 201 with full token value', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)

    const res = await post(`/api/lists/${listId}/tokens`, { name: 'home bot' }, user.cookie)
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string; last4: string; token: string; created_at: string; last_used_at: null }
    expect(body.name).toBe('home bot')
    expect(body.token).toMatch(/^glk_[0-9a-f]{32}$/)
    expect(body.last4).toBe(body.token.slice(-4))
    expect(body.last_used_at).toBeNull()
  })

  test('empty name returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await post(`/api/lists/${listId}/tokens`, { name: '' }, user.cookie)
    expect(res.status).toBe(400)
  })

  test('missing name returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await post(`/api/lists/${listId}/tokens`, {}, user.cookie)
    expect(res.status).toBe(400)
  })

  test('non-owner member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await post(`/api/lists/${listId}/tokens`, { name: 'bot' }, member.cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated gets 401', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await post(`/api/lists/${listId}/tokens`, { name: 'bot' })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('GET /api/lists/:id/tokens', () => {
  test('owner gets token list without full token values', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    await post(`/api/lists/${listId}/tokens`, { name: 'home bot' }, user.cookie)

    const res = await get(`/api/lists/${listId}/tokens`, user.cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as Array<Record<string, unknown>>
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('home bot')
    expect(body[0].last4).toBeTruthy()
    expect(body[0].token).toBeUndefined()
  })

  test('non-owner member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await get(`/api/lists/${listId}/tokens`, member.cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated gets 401', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await get(`/api/lists/${listId}/tokens`)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id/tokens/:tokenId', () => {
  test('owner revokes a token and gets 204', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const createRes = await post(`/api/lists/${listId}/tokens`, { name: 'home bot' }, user.cookie)
    const { id } = await createRes.json() as { id: string }

    const res = await del(`/api/lists/${listId}/tokens/${id}`, user.cookie)
    expect(res.status).toBe(204)
    expect(db.prepare('SELECT id FROM list_tokens WHERE id = ?').get(id)).toBeNull()
  })

  test('non-existent token returns 404', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await del(`/api/lists/${listId}/tokens/${randomUUID()}`, user.cookie)
    expect(res.status).toBe(404)
  })

  test('non-owner member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const createRes = await post(`/api/lists/${listId}/tokens`, { name: 'home bot' }, owner.cookie)
    const { id } = await createRes.json() as { id: string }

    const res = await del(`/api/lists/${listId}/tokens/${id}`, member.cookie)
    expect(res.status).toBe(403)
  })
})
