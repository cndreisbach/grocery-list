import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db from '../db'
import { sendListCreatedEmail } from '../email'
import { broadcast } from '../broadcast'

const app = new Hono()

function rowToItem(row: Record<string, unknown>) {
  return {
    ...row,
    area_overridden: Boolean(row.area_overridden),
    checked: Boolean(row.checked),
  }
}

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email: string = body?.email ?? ''
  const name: string = body?.name ?? 'Grocery List'

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  const id = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email) VALUES (?, ?, ?)').run(id, name, email)

  sendListCreatedEmail(email, { id, name }).catch(err =>
    console.error('Failed to send list created email:', err)
  )

  return c.json({ id, name }, 201)
})

app.get('/:id', (c) => {
  const { id } = c.req.param()
  const list = db.prepare('SELECT id, name FROM lists WHERE id = ?').get(id) as
    | { id: string; name: string }
    | null

  if (!list) return c.json({ error: 'List not found' }, 404)

  const items = (
    db.prepare(
      'SELECT id, list_id, name, store_area, area_overridden, checked, created_at, updated_at FROM items WHERE list_id = ? ORDER BY created_at ASC'
    ).all(id) as Record<string, unknown>[]
  ).map(rowToItem)

  const history = db.prepare(
    'SELECT name, store_area, last_used FROM item_history WHERE list_id = ? ORDER BY last_used DESC'
  ).all(id)

  return c.json({ ...list, items, history })
})

app.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json().catch(() => ({}))
  const name: string = body?.name ?? ''

  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Name required' }, 400)
  }

  const result = db.prepare(
    'UPDATE lists SET name = ? WHERE id = ? RETURNING id, name'
  ).get(name, id) as { id: string; name: string } | null

  if (!result) return c.json({ error: 'List not found' }, 404)
  broadcast(id, 'list_updated', result)
  return c.json(result)
})

export default app
