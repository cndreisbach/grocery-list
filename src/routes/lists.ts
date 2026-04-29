import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db, { getMemberRole } from '../db'
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
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const name: string = body?.name ?? 'Grocery List'

  const id = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email, store_id) VALUES (?, ?, ?, ?)').run(
    id, name, user.email, 'store-grocery'
  )
  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    id, user.id, 'owner'
  )

  return c.json({ id, name }, 201)
})

app.get('/:id', (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  const role = getMemberRole(id, user.id)
  if (!role) return c.json({ error: 'Not found or access denied' }, 403)

  const row = db.prepare(`
    SELECT l.id, l.name, l.store_id, s.store_type_id, st.areas
    FROM lists l
    LEFT JOIN stores s ON l.store_id = s.id
    LEFT JOIN store_types st ON s.store_type_id = st.id
    WHERE l.id = ?
  `).get(id) as { id: string; name: string; store_id: string | null; store_type_id: string | null; areas: string | null } | null

  if (!row) return c.json({ error: 'List not found' }, 404)

  const items = (
    db.prepare(
      'SELECT id, list_id, name, store_area, area_overridden, checked, created_at, updated_at FROM items WHERE list_id = ? ORDER BY created_at ASC'
    ).all(id) as Record<string, unknown>[]
  ).map(rowToItem)

  const history = db.prepare(
    'SELECT name, store_area, last_used FROM item_history WHERE list_id = ? ORDER BY last_used DESC'
  ).all(id)

  return c.json({
    id: row.id,
    name: row.name,
    store_id: row.store_id ?? 'store-grocery',
    store_type_id: row.store_type_id ?? 'grocery',
    areas: row.areas ? JSON.parse(row.areas) as string[] : [
      'Produce', 'Dairy', 'Bakery', 'Meat & Seafood', 'Frozen',
      'Pantry', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Other',
    ],
    items,
    history,
    user_role: role,
  })
})

app.patch('/:id', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  if (!getMemberRole(id, user.id)) return c.json({ error: 'Not found or access denied' }, 403)

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

// PATCH /api/lists/:id/store — update the store and bulk-reclassify all items to "Other"
app.patch('/:id/store', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()

  if (!getMemberRole(id, user.id)) return c.json({ error: 'Not found or access denied' }, 403)

  const body = await c.req.json().catch(() => ({}))
  const storeId: string = body?.store_id ?? ''

  if (!storeId || typeof storeId !== 'string') {
    return c.json({ error: 'store_id required' }, 400)
  }

  const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(storeId)
  if (!store) return c.json({ error: 'Store not found' }, 404)

  const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(id)
  if (!list) return c.json({ error: 'List not found' }, 404)

  db.transaction(() => {
    db.prepare('UPDATE lists SET store_id = ? WHERE id = ?').run(storeId, id)
    db.prepare(
      "UPDATE items SET store_area = 'Other', area_overridden = 0, updated_at = CURRENT_TIMESTAMP WHERE list_id = ?"
    ).run(id)
  })()

  broadcast(id, 'list_updated', { id, store_id: storeId })
  return c.json({ id, store_id: storeId })
})

export default app
