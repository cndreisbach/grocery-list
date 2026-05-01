import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { randomBytes } from 'crypto'
import listsRouter from './lists'
import { requireAuth } from '../middleware/auth'
import db from '../db'

const app = new Hono()
app.use('/api/lists/*', requireAuth)
app.route('/api/lists', listsRouter)

beforeEach(() => {
  db.exec('DELETE FROM item_history')
  db.exec('DELETE FROM lists')  // cascades to items, list_members
  db.exec('DELETE FROM users')  // cascades to sessions, otp_codes
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

function addItem(listId: string, name: string, storeArea = 'Produce') {
  const itemId = randomUUID()
  db.prepare('INSERT INTO items (id, list_id, name, store_area) VALUES (?, ?, ?, ?)').run(
    itemId, listId, name, storeArea
  )
  return itemId
}

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

const patch = (path: string, body: unknown, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  }))

const del = (path: string, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'DELETE',
    headers: cookie ? { Cookie: cookie } : {},
  }))

// ---------------------------------------------------------------------------

describe('POST /api/lists', () => {
  test('creates list and returns 201', async () => {
    const { cookie } = createUser('a@example.com')
    const res = await post('/api/lists', { name: 'Weekly Shop' }, cookie)
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string }
    expect(body.name).toBe('Weekly Shop')
    expect(body.id).toBeTruthy()
  })

  test('defaults name to "Grocery List" when not provided', async () => {
    const { cookie } = createUser('a@example.com')
    const res = await post('/api/lists', {}, cookie)
    const body = await res.json() as { name: string }
    expect(body.name).toBe('Grocery List')
  })

  test('defaults to Grocery Store', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const res = await post('/api/lists', { name: 'My List' }, cookie)
    const { id } = await res.json() as { id: string }

    const row = db.prepare('SELECT store_id FROM lists WHERE id = ?').get(id) as { store_id: string }
    expect(row.store_id).toBe('store-grocery')
  })

  test('creator is added as owner in list_members', async () => {
    const { userId, cookie } = createUser('a@example.com')
    const res = await post('/api/lists', { name: 'My List' }, cookie)
    const { id } = await res.json() as { id: string }

    const member = db.prepare(
      'SELECT role FROM list_members WHERE list_id = ? AND user_id = ?'
    ).get(id, userId) as { role: string } | null
    expect(member?.role).toBe('owner')
  })

  test('unauthenticated request returns 401', async () => {
    const res = await post('/api/lists', { name: 'My List' })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('GET /api/lists/:id', () => {
  test('member gets 200 with list data, areas, and user_role', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email, 'My List')

    const res = await get(`/api/lists/${listId}`, cookie)
    expect(res.status).toBe(200)

    const body = await res.json() as {
      id: string; name: string; store_id: string; store_type_id: string;
      areas: string[]; items: unknown[]; user_role: string
    }
    expect(body.id).toBe(listId)
    expect(body.name).toBe('My List')
    expect(body.store_id).toBe('store-grocery')
    expect(body.store_type_id).toBe('grocery')
    expect(Array.isArray(body.areas)).toBe(true)
    expect(body.areas.length).toBeGreaterThan(0)
    expect(body.user_role).toBe('owner')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('response includes items belonging to the list', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)
    addItem(listId, 'Apples', 'Produce')
    addItem(listId, 'Milk', 'Dairy')

    const res = await get(`/api/lists/${listId}`, cookie)
    const body = await res.json() as { items: Array<{ name: string }> }
    expect(body.items.map(i => i.name)).toEqual(['Apples', 'Milk'])
  })

  test('unauthenticated request returns 401', async () => {
    const { userId, email } = createUser('a@example.com')
    const listId = createList(userId, email)
    const res = await get(`/api/lists/${listId}`)
    expect(res.status).toBe(401)
  })

  test('non-member gets 403', async () => {
    const { userId: ownerId, email: ownerEmail } = createUser('owner@example.com')
    const { cookie } = createUser('other@example.com')
    const listId = createList(ownerId, ownerEmail)

    const res = await get(`/api/lists/${listId}`, cookie)
    expect(res.status).toBe(403)
  })

  test('unknown list UUID returns 403', async () => {
    const { cookie } = createUser('a@example.com')
    const res = await get(`/api/lists/${randomUUID()}`, cookie)
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------

describe('PATCH /api/lists/:id', () => {
  test('member can rename the list', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email, 'Old Name')

    const res = await patch(`/api/lists/${listId}`, { name: 'New Name' }, cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as { name: string }
    expect(body.name).toBe('New Name')

    const row = db.prepare('SELECT name FROM lists WHERE id = ?').get(listId) as { name: string }
    expect(row.name).toBe('New Name')
  })

  test('empty name returns 400', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)
    const res = await patch(`/api/lists/${listId}`, { name: '' }, cookie)
    expect(res.status).toBe(400)
  })

  test('non-member gets 403', async () => {
    const { userId: ownerId, email: ownerEmail } = createUser('owner@example.com')
    const { cookie } = createUser('other@example.com')
    const listId = createList(ownerId, ownerEmail)

    const res = await patch(`/api/lists/${listId}`, { name: 'Hacked' }, cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated request returns 401', async () => {
    const { userId, email } = createUser('a@example.com')
    const listId = createList(userId, email)
    const res = await patch(`/api/lists/${listId}`, { name: 'Name' })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id', () => {
  test('owner can delete their list and it cascades items', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)
    addItem(listId, 'Apples')

    const res = await del(`/api/lists/${listId}`, cookie)
    expect(res.status).toBe(204)

    const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(listId)
    expect(list).toBeNull()

    const items = db.prepare('SELECT id FROM items WHERE list_id = ?').all(listId)
    expect(items).toHaveLength(0)
  })

  test('non-owner member gets 403', async () => {
    const { userId: ownerId, email: ownerEmail } = createUser('owner@example.com')
    const { userId: memberId, cookie: memberCookie } = createUser('member@example.com')
    const listId = createList(ownerId, ownerEmail)
    db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(listId, memberId, 'member')

    const res = await del(`/api/lists/${listId}`, memberCookie)
    expect(res.status).toBe(403)
  })

  test('non-member gets 403', async () => {
    const { userId: ownerId, email: ownerEmail } = createUser('owner@example.com')
    const { cookie } = createUser('other@example.com')
    const listId = createList(ownerId, ownerEmail)

    const res = await del(`/api/lists/${listId}`, cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated request returns 401', async () => {
    const { userId, email } = createUser('a@example.com')
    const listId = createList(userId, email)
    const res = await del(`/api/lists/${listId}`)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('PATCH /api/lists/:id/store', () => {
  test('changes the store and returns 200', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)

    const res = await patch(`/api/lists/${listId}/store`, { store_id: 'store-costco' }, cookie)
    expect(res.status).toBe(200)

    const row = db.prepare('SELECT store_id FROM lists WHERE id = ?').get(listId) as { store_id: string }
    expect(row.store_id).toBe('store-costco')
  })

  test('reclassifies all existing items to "Other"', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)
    addItem(listId, 'Apples', 'Produce')
    addItem(listId, 'Milk', 'Dairy')

    await patch(`/api/lists/${listId}/store`, { store_id: 'store-home-depot' }, cookie)

    const items = db.prepare('SELECT store_area FROM items WHERE list_id = ?').all(listId) as Array<{ store_area: string }>
    expect(items.every(i => i.store_area === 'Other')).toBe(true)
  })

  test('unknown store_id returns 404', async () => {
    const { userId, email, cookie } = createUser('a@example.com')
    const listId = createList(userId, email)

    const res = await patch(`/api/lists/${listId}/store`, { store_id: 'store-nonexistent' }, cookie)
    expect(res.status).toBe(404)
  })

  test('non-member gets 403', async () => {
    const { userId: ownerId, email: ownerEmail } = createUser('owner@example.com')
    const { cookie } = createUser('other@example.com')
    const listId = createList(ownerId, ownerEmail)

    const res = await patch(`/api/lists/${listId}/store`, { store_id: 'store-costco' }, cookie)
    expect(res.status).toBe(403)
  })

  test('unauthenticated request returns 401', async () => {
    const { userId, email } = createUser('a@example.com')
    const listId = createList(userId, email)
    const res = await patch(`/api/lists/${listId}/store`, { store_id: 'store-costco' })
    expect(res.status).toBe(401)
  })
})
