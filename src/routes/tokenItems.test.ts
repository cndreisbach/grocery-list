import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { randomUUID, randomBytes } from 'crypto'
import tokenItemsRouter from './tokenItems'
import { requireTokenAuth } from '../middleware/tokenAuth'
import db from '../db'

const app = new Hono()
app.use('/api/token/*', requireTokenAuth)
app.route('/api/token', tokenItemsRouter)

beforeEach(() => {
  db.exec('DELETE FROM item_history')
  db.exec('DELETE FROM list_tokens')
  db.exec('DELETE FROM lists')
  db.exec('DELETE FROM users')
})

// ---------------------------------------------------------------------------
// Helpers

function createUser(email: string) {
  const userId = randomUUID()
  db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(userId, email)
  return { userId, email }
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

function createToken(listId: string) {
  const id = randomUUID()
  const raw = randomBytes(16).toString('hex')
  const token = `glk_${raw}`
  const last4 = token.slice(-4)
  db.prepare('INSERT INTO list_tokens (id, token, list_id, name, last4) VALUES (?, ?, ?, ?, ?)').run(
    id, token, listId, 'test bot', last4
  )
  return { id, token }
}

function addItem(listId: string, name: string, storeArea = 'Produce') {
  const itemId = randomUUID()
  db.prepare('INSERT INTO items (id, list_id, name, store_area) VALUES (?, ?, ?, ?)').run(
    itemId, listId, name, storeArea
  )
  return itemId
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

const get = (path: string, headers?: Record<string, string>) =>
  app.fetch(new Request(`http://localhost${path}`, { headers }))

const post = (path: string, body: unknown, headers?: Record<string, string>) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }))

// ---------------------------------------------------------------------------

describe('GET /api/token/items', () => {
  test('valid token returns items for its list', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    addItem(listId, 'Apples')
    addItem(listId, 'Milk', 'Dairy')
    const { token } = createToken(listId)

    const res = await get('/api/token/items', bearer(token))
    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ name: string }>
    expect(body).toHaveLength(2)
    expect(body.map(i => i.name)).toContain('Apples')
    expect(body.map(i => i.name)).toContain('Milk')
  })

  test('invalid token returns 401', async () => {
    const res = await get('/api/token/items', { Authorization: 'Bearer glk_invalid' })
    expect(res.status).toBe(401)
  })

  test('missing Authorization header returns 401', async () => {
    const res = await get('/api/token/items')
    expect(res.status).toBe(401)
  })

  test('updates last_used_at on the token', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { id, token } = createToken(listId)

    const before = db.prepare('SELECT last_used_at FROM list_tokens WHERE id = ?').get(id) as { last_used_at: string | null }
    expect(before.last_used_at).toBeNull()

    await get('/api/token/items', bearer(token))

    const after = db.prepare('SELECT last_used_at FROM list_tokens WHERE id = ?').get(id) as { last_used_at: string | null }
    expect(after.last_used_at).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------

describe('POST /api/token/items', () => {
  test('adds an item with name only, defaulting store_area to Other', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    const res = await post('/api/token/items', { name: 'Milk' }, bearer(token))
    expect(res.status).toBe(201)
    const body = await res.json() as { name: string; store_area: string; checked: boolean }
    expect(body.name).toBe('Milk')
    expect(body.store_area).toBe('Other')
    expect(body.checked).toBe(false)
  })

  test('adds an item with explicit store_area', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    const res = await post('/api/token/items', { name: 'Milk', store_area: 'Dairy' }, bearer(token))
    expect(res.status).toBe(201)
    const body = await res.json() as { store_area: string }
    expect(body.store_area).toBe('Dairy')
  })

  test('missing name returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    const res = await post('/api/token/items', {}, bearer(token))
    expect(res.status).toBe(400)
  })

  test('empty name returns 400', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    const res = await post('/api/token/items', { name: '' }, bearer(token))
    expect(res.status).toBe(400)
  })

  test('item is persisted in the database', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    await post('/api/token/items', { name: 'Eggs' }, bearer(token))

    const item = db.prepare('SELECT name, list_id FROM items WHERE list_id = ? AND name = ?').get(listId, 'Eggs')
    expect(item).toBeTruthy()
  })

  test('item is added to autocomplete history', async () => {
    const user = createUser('a@example.com')
    const listId = createList(user.userId, user.email)
    const { token } = createToken(listId)

    await post('/api/token/items', { name: 'Eggs', store_area: 'Dairy' }, bearer(token))

    const history = db.prepare('SELECT name FROM item_history WHERE list_id = ? AND name = ?').get(listId, 'eggs')
    expect(history).toBeTruthy()
  })

  test('invalid token returns 401', async () => {
    const res = await post('/api/token/items', { name: 'Milk' }, { Authorization: 'Bearer glk_invalid' })
    expect(res.status).toBe(401)
  })
})
