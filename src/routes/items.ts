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

function upsertHistory(listId: string, name: string, storeArea: string) {
  db.prepare(`
    INSERT INTO item_history (list_id, name, store_area, last_used)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT (list_id, name) DO UPDATE SET store_area = excluded.store_area, last_used = excluded.last_used
  `).run(listId, name.toLowerCase().trim(), storeArea)
}

// POST /api/lists/:id/items
app.post('/:id/items', async (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()
  if (!getMemberRole(listId, user.id)) return c.json({ error: 'List not found' }, 404)

  const body = await c.req.json().catch(() => ({}))
  const name: string = body?.name ?? ''
  const storeArea: string = body?.store_area ?? 'Other'
  const areaOverridden: boolean = Boolean(body?.area_overridden)

  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Item name required' }, 400)
  }

  const itemId = randomUUID()
  db.prepare(
    'INSERT INTO items (id, list_id, name, store_area, area_overridden) VALUES (?, ?, ?, ?, ?)'
  ).run(itemId, listId, name, storeArea, areaOverridden ? 1 : 0)

  upsertHistory(listId, name, storeArea)

  const item = rowToItem(
    db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as Record<string, unknown>
  )
  broadcast(listId, 'item_added', item)
  return c.json(item, 201)
})

// PATCH /api/lists/:id/items/:itemId
app.patch('/:id/items/:itemId', async (c) => {
  const user = c.get('user')
  const { id: listId, itemId } = c.req.param()
  if (!getMemberRole(listId, user.id)) return c.json({ error: 'List not found' }, 404)
  const existing = db.prepare(
    'SELECT * FROM items WHERE id = ? AND list_id = ?'
  ).get(itemId, listId) as Record<string, unknown> | null
  if (!existing) return c.json({ error: 'Item not found' }, 404)

  const body = await c.req.json().catch(() => ({}))
  const name: string = 'name' in body ? body.name : (existing.name as string)
  const storeArea: string = 'store_area' in body ? body.store_area : (existing.store_area as string)
  const areaOverridden: boolean =
    'area_overridden' in body ? Boolean(body.area_overridden) : Boolean(existing.area_overridden)
  const checked: boolean =
    'checked' in body ? Boolean(body.checked) : Boolean(existing.checked)

  const updated = db.prepare(`
    UPDATE items SET
      name = ?,
      store_area = ?,
      area_overridden = ?,
      checked = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND list_id = ?
    RETURNING *
  `).get(name, storeArea, areaOverridden ? 1 : 0, checked ? 1 : 0, itemId, listId) as
    Record<string, unknown> | null

  if (!updated) return c.json({ error: 'Item not found' }, 404)

  if (name !== existing.name) {
    upsertHistory(listId, name, storeArea)
  }

  const item = rowToItem(updated)
  broadcast(listId, 'item_updated', item)
  return c.json(item)
})

// DELETE /api/lists/:id/items/:itemId
app.delete('/:id/items/:itemId', (c) => {
  const user = c.get('user')
  const { id: listId, itemId } = c.req.param()
  if (!getMemberRole(listId, user.id)) return c.json({ error: 'List not found' }, 404)
  const result = db.prepare(
    'DELETE FROM items WHERE id = ? AND list_id = ? RETURNING id'
  ).get(itemId, listId) as { id: string } | null

  if (!result) return c.json({ error: 'Item not found' }, 404)
  broadcast(listId, 'item_deleted', { id: itemId })
  return new Response(null, { status: 204 })
})

// DELETE /api/lists/:id/items?checked=true
app.delete('/:id/items', (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()
  if (!getMemberRole(listId, user.id)) return c.json({ error: 'List not found' }, 404)
  const checked = c.req.query('checked')

  if (checked !== 'true') {
    return c.json({ error: 'Only ?checked=true is supported' }, 400)
  }

  db.prepare('DELETE FROM items WHERE list_id = ? AND checked = 1').run(listId)
  broadcast(listId, 'items_cleared', { listId })
  return new Response(null, { status: 204 })
})

export default app
