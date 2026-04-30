import { mock, describe, test, expect, beforeEach } from 'bun:test'

const invitesSent: Array<{ to: string; inviter: string }> = []

mock.module('../email', () => ({
  sendInviteEmail: async (to: string, inviterEmail: string) => {
    invitesSent.push({ to, inviter: inviterEmail })
  },
  sendOtpEmail: async () => {},
  sendListCreatedEmail: async () => {},
  sendRecoveryEmail: async () => {},
}))

import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { randomBytes } from 'crypto'
import membersRouter from './members'
import { requireAuth } from '../middleware/auth'
import db from '../db'

const app = new Hono()
app.use('/api/lists/*', requireAuth)
app.route('/api/lists', membersRouter)

beforeEach(() => {
  db.exec('DELETE FROM item_history')
  db.exec('DELETE FROM lists')
  db.exec('DELETE FROM users')
  invitesSent.length = 0
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

function createList(userId: string, email: string, name = 'Test List') {
  const listId = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email, store_id) VALUES (?, ?, ?, ?)').run(
    listId, name, email, 'store-grocery'
  )
  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    listId, userId, 'owner'
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

describe('GET /api/lists/:id/members', () => {
  test('member sees all members with email and role', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await get(`/api/lists/${listId}/members`, owner.cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ email: string; role: string }>
    expect(body).toHaveLength(2)
    expect(body.map(m => m.email)).toContain('owner@example.com')
    expect(body.map(m => m.email)).toContain('member@example.com')
    expect(body.find(m => m.email === 'owner@example.com')?.role).toBe('owner')
  })

  test('non-member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await get(`/api/lists/${listId}/members`, other.cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated gets 401', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)
    const res = await get(`/api/lists/${listId}/members`)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('POST /api/lists/:id/members', () => {
  test('owner invites a new email, creates user and adds as member', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await post(`/api/lists/${listId}/members`, { email: 'new@example.com' }, owner.cookie)
    expect(res.status).toBe(201)
    const body = await res.json() as { email: string; role: string }
    expect(body.email).toBe('new@example.com')
    expect(body.role).toBe('member')

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get('new@example.com')
    expect(user).toBeTruthy()
  })

  test('owner invites an existing user', async () => {
    const owner = createUser('owner@example.com')
    const existing = createUser('existing@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await post(`/api/lists/${listId}/members`, { email: existing.email }, owner.cookie)
    expect(res.status).toBe(201)

    const count = (db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?')
      .get(existing.email) as { count: number }).count
    expect(count).toBe(1)
  })

  test('sends an invite email on success', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)

    await post(`/api/lists/${listId}/members`, { email: 'new@example.com' }, owner.cookie)
    // Give the fire-and-forget promise a tick to resolve
    await new Promise(r => setTimeout(r, 10))

    expect(invitesSent).toHaveLength(1)
    expect(invitesSent[0].to).toBe('new@example.com')
    expect(invitesSent[0].inviter).toBe('owner@example.com')
  })

  test('inviting an already-member email returns 409', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await post(`/api/lists/${listId}/members`, { email: member.email }, owner.cookie)
    expect(res.status).toBe(409)
  })

  test('non-owner member cannot invite', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await post(`/api/lists/${listId}/members`, { email: 'new@example.com' }, member.cookie)
    expect(res.status).toBe(403)
  })

  test('non-member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await post(`/api/lists/${listId}/members`, { email: 'x@example.com' }, other.cookie)
    expect(res.status).toBe(403)
  })

  test('invalid email returns 400', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await post(`/api/lists/${listId}/members`, { email: 'not-an-email' }, owner.cookie)
    expect(res.status).toBe(400)
  })

  test('unauthenticated gets 401', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)
    const res = await post(`/api/lists/${listId}/members`, { email: 'x@example.com' })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id/members/:userId', () => {
  test('owner removes a member, returns 204', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await del(`/api/lists/${listId}/members/${member.userId}`, owner.cookie)
    expect(res.status).toBe(204)

    const row = db.prepare(
      'SELECT 1 FROM list_members WHERE list_id = ? AND user_id = ?'
    ).get(listId, member.userId)
    expect(row).toBeNull()
  })

  test('owner cannot remove themselves', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await del(`/api/lists/${listId}/members/${owner.userId}`, owner.cookie)
    expect(res.status).toBe(400)
  })

  test('non-owner member cannot remove others', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)
    addMember(listId, other.userId)

    const res = await del(`/api/lists/${listId}/members/${other.userId}`, member.cookie)
    expect(res.status).toBe(403)
  })

  test('non-member gets 403', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await del(`/api/lists/${listId}/members/${member.userId}`, other.cookie)
    expect(res.status).toBe(403)
  })

  test('unknown userId returns 404', async () => {
    const owner = createUser('owner@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await del(`/api/lists/${listId}/members/${randomUUID()}`, owner.cookie)
    expect(res.status).toBe(404)
  })

  test('unauthenticated gets 401', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email)
    addMember(listId, member.userId)

    const res = await del(`/api/lists/${listId}/members/${member.userId}`)
    expect(res.status).toBe(401)
  })
})
