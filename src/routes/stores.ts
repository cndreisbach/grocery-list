import { Hono } from 'hono'
import db from '../db'

export const storesRouter = new Hono()
export const storeTypesRouter = new Hono()

// GET /api/stores — all store instances with their type name and areas
storesRouter.get('/', (c) => {
  const rows = db.prepare(`
    SELECT s.id, s.name, st.id AS store_type_id, st.name AS store_type_name, st.areas
    FROM stores s
    JOIN store_types st ON s.store_type_id = st.id
    ORDER BY s.name
  `).all() as Array<{
    id: string
    name: string
    store_type_id: string
    store_type_name: string
    areas: string
  }>

  return c.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    store_type_id: r.store_type_id,
    store_type_name: r.store_type_name,
    areas: JSON.parse(r.areas) as string[],
  })))
})

// GET /api/store-types/:id/dictionary — item→area map for a store type
storeTypesRouter.get('/:id/dictionary', (c) => {
  const { id } = c.req.param()

  const storeType = db.prepare('SELECT id FROM store_types WHERE id = ?').get(id)
  if (!storeType) return c.json({ error: 'Store type not found' }, 404)

  const rows = db.prepare(
    'SELECT item_name, area FROM store_type_dictionary WHERE store_type_id = ?'
  ).all(id) as Array<{ item_name: string; area: string }>

  const dict: Record<string, string> = {}
  for (const row of rows) {
    dict[row.item_name] = row.area
  }

  return c.json(dict)
})
