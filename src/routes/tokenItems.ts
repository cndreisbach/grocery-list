import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db from '../db'
import { broadcast } from '../broadcast'

const app = new Hono()

function rowToItem(row: Record<string, unknown>) {
  return {
    ...row,
    area_overridden: Boolean(row.area_overridden),
    checked: Boolean(row.checked),
  }
}

// GET /api/token/items — list all items for the token's list
app.get('/items', (c) => {
  const listId = c.get('tokenListId')
  const items = (
    db.prepare(
      'SELECT id, list_id, name, store_area, area_overridden, checked, created_at, updated_at FROM items WHERE list_id = ? ORDER BY created_at ASC'
    ).all(listId) as Record<string, unknown>[]
  ).map(rowToItem)
  return c.json(items)
})

// POST /api/token/items — add an item to the token's list
app.post('/items', async (c) => {
  const listId = c.get('tokenListId')
  const body = await c.req.json().catch(() => ({}))
  const name: string = body?.name ?? ''
  const storeArea: string = body?.store_area ?? 'Other'

  if (!name || typeof name !== 'string') return c.json({ error: 'Item name required' }, 400)

  const itemId = randomUUID()
  db.prepare(
    'INSERT INTO items (id, list_id, name, store_area, area_overridden) VALUES (?, ?, ?, ?, 0)'
  ).run(itemId, listId, name, storeArea)

  // Keep autocomplete history in sync
  db.prepare(`
    INSERT INTO item_history (list_id, name, store_area, last_used)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT (list_id, name) DO UPDATE SET store_area = excluded.store_area, last_used = excluded.last_used
  `).run(listId, name.toLowerCase().trim(), storeArea)

  const item = rowToItem(
    db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as Record<string, unknown>
  )
  broadcast(listId, 'item_added', item)
  return c.json(item, 201)
})

export default app
