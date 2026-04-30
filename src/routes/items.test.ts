import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { randomBytes } from 'crypto'
import itemsRouter from './items'
import { requireAuth } from '../middleware/auth'
import db from '../db'

const app = new Hono()
app.use('/api/lists/*', requireAuth)
app.route('/api/lists', itemsRouter)

beforeEach(() => {
  db.exec('DELETE FROM item_history')
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

function createList(userId: string, email: string) {
  const listId = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email, store_id) VALUES (?, ?, ?, ?)').run(
    listId, 'Test List', email, 'store-grocery'
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

describe('POST /api/lists/:id/items', () => {
  test('adds an item and returns 201 with item data', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)

    const res = await post(`/api/lists/${listId}/items`, { name: 'Apples', store_area: 'Produce' }, user.cookie)
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string; store_area: string; checked: boolean }
    expect(body.name).toBe('Apples')
    expect(body.store_area).toBe('Produce')
    expect(body.checked).toBe(false)
    expect(body.id).toBeTruthy()
  })

  test('defaults store_area to "Other" when not provided', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)

    const res = await post(`/api/lists/${listId}/items`, { name: 'Mystery Item' }, user.cookie)
    const body = await res.json() as { store_area: string }
    expect(body.store_area).toBe('Other')
  })

  test('adds item to purchase history', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)

    await post(`/api/lists/${listId}/items`, { name: 'Apples', store_area: 'Produce' }, user.cookie)

    const history = db.prepare(
      'SELECT name, store_area FROM item_history WHERE list_id = ?'
    ).get(listId) as { name: string; store_area: string } | null
    expect(history?.name).toBe('apples')
    expect(history?.store_area).toBe('Produce')
  })

  test('re-adding same item updates history timestamp instead of duplicating', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)

    await post(`/api/lists/${listId}/items`, { name: 'Apples', store_area: 'Produce' }, user.cookie)
    await post(`/api/lists/${listId}/items`, { name: 'Apples', store_area: 'Produce' }, user.cookie)

    const { count } = db.prepare(
      'SELECT COUNT(*) as count FROM item_history WHERE list_id = ? AND name = ?'
    ).get(listId, 'apples') as { count: number }
    expect(count).toBe(1)
  })

  test('empty name returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await post(`/api/lists/${listId}/items`, { name: '' }, user.cookie)
    expect(res.status).toBe(400)
  })

  test('non-member gets 404', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)

    const res = await post(`/api/lists/${listId}/items`, { name: 'Apples' }, other.cookie)
    expect(res.status).toBe(404)
  })

  test('unauthenticated gets 401', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await post(`/api/lists/${listId}/items`, { name: 'Apples' })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('PATCH /api/lists/:id/items/:itemId', () => {
  test('updates item name and returns 200', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples', 'Produce')

    const res = await patch(`/api/lists/${listId}/items/${itemId}`, { name: 'Granny Smith Apples' }, user.cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as { name: string }
    expect(body.name).toBe('Granny Smith Apples')
  })

  test('updates checked state', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples')

    const res = await patch(`/api/lists/${listId}/items/${itemId}`, { checked: true }, user.cookie)
    const body = await res.json() as { checked: boolean }
    expect(body.checked).toBe(true)
  })

  test('updates store_area and area_overridden', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples', 'Produce')

    const res = await patch(
      `/api/lists/${listId}/items/${itemId}`,
      { store_area: 'Snacks', area_overridden: true },
      user.cookie
    )
    const body = await res.json() as { store_area: string; area_overridden: boolean }
    expect(body.store_area).toBe('Snacks')
    expect(body.area_overridden).toBe(true)
  })

  test('renaming updates history', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples', 'Produce')

    await patch(`/api/lists/${listId}/items/${itemId}`, { name: 'Oranges', store_area: 'Produce' }, user.cookie)

    const history = db.prepare(
      'SELECT name FROM item_history WHERE list_id = ? AND name = ?'
    ).get(listId, 'oranges')
    expect(history).toBeTruthy()
  })

  test('checking an item does not add to history', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples', 'Produce')

    await patch(`/api/lists/${listId}/items/${itemId}`, { checked: true }, user.cookie)

    const { count } = db.prepare(
      'SELECT COUNT(*) as count FROM item_history WHERE list_id = ?'
    ).get(listId) as { count: number }
    expect(count).toBe(0)
  })

  test('unknown item returns 404', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await patch(`/api/lists/${listId}/items/${randomUUID()}`, { name: 'X' }, user.cookie)
    expect(res.status).toBe(404)
  })

  test('non-member gets 404', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)
    const itemId = addItem(listId, 'Apples')

    const res = await patch(`/api/lists/${listId}/items/${itemId}`, { checked: true }, other.cookie)
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id/items/:itemId', () => {
  test('deletes the item and returns 204', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples')

    const res = await del(`/api/lists/${listId}/items/${itemId}`, user.cookie)
    expect(res.status).toBe(204)

    const item = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId)
    expect(item).toBeNull()
  })

  test('unknown item returns 404', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await del(`/api/lists/${listId}/items/${randomUUID()}`, user.cookie)
    expect(res.status).toBe(404)
  })

  test('non-member gets 404', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)
    const itemId = addItem(listId, 'Apples')

    const res = await del(`/api/lists/${listId}/items/${itemId}`, other.cookie)
    expect(res.status).toBe(404)
  })

  test('unauthenticated gets 401', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const itemId = addItem(listId, 'Apples')
    const res = await del(`/api/lists/${listId}/items/${itemId}`)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------

describe('DELETE /api/lists/:id/items?checked=true', () => {
  test('deletes all checked items and returns 204', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const checkedId = addItem(listId, 'Apples')
    const uncheckedId = addItem(listId, 'Milk')
    db.prepare('UPDATE items SET checked = 1 WHERE id = ?').run(checkedId)

    const res = await del(`/api/lists/${listId}/items?checked=true`, user.cookie)
    expect(res.status).toBe(204)

    expect(db.prepare('SELECT id FROM items WHERE id = ?').get(checkedId)).toBeNull()
    expect(db.prepare('SELECT id FROM items WHERE id = ?').get(uncheckedId)).toBeTruthy()
  })

  test('without ?checked=true returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await del(`/api/lists/${listId}/items`, user.cookie)
    expect(res.status).toBe(400)
  })

  test('non-member gets 404', async () => {
    const owner = createUser('owner@example.com')
    const other = createUser('other@example.com')
    const listId = createList(owner.userId, owner.email)
    const res = await del(`/api/lists/${listId}/items?checked=true`, other.cookie)
    expect(res.status).toBe(404)
  })

  test('unauthenticated gets 401', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const res = await del(`/api/lists/${listId}/items?checked=true`)
    expect(res.status).toBe(401)
  })
})
