import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'
import { storesRouter, storeTypesRouter } from './stores'
import db from '../db'

const app = new Hono()
app.route('/api/stores', storesRouter)
app.route('/api/store-types', storeTypesRouter)

const get = (path: string) => app.fetch(new Request(`http://localhost${path}`))

// ---------------------------------------------------------------------------

describe('GET /api/stores', () => {
  test('returns all 3 seeded store instances', async () => {
    const res = await get('/api/stores')
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(body).toHaveLength(3)
  })

  test('each store has id, name, store_type_id, store_type_name, and areas array', async () => {
    const res = await get('/api/stores')
    const body = await res.json() as Array<{
      id: string; name: string; store_type_id: string; store_type_name: string; areas: string[]
    }>

    for (const store of body) {
      expect(typeof store.id).toBe('string')
      expect(typeof store.name).toBe('string')
      expect(typeof store.store_type_id).toBe('string')
      expect(typeof store.store_type_name).toBe('string')
      expect(Array.isArray(store.areas)).toBe(true)
      expect(store.areas.length).toBeGreaterThan(0)
    }
  })

  test('includes Grocery Store, Home Depot, and Costco instances', async () => {
    const res = await get('/api/stores')
    const body = await res.json() as Array<{ id: string }>
    const ids = body.map(s => s.id)
    expect(ids).toContain('store-grocery')
    expect(ids).toContain('store-home-depot')
    expect(ids).toContain('store-costco')
  })

  test('grocery areas are in store-traversal order starting with Produce', async () => {
    const res = await get('/api/stores')
    const body = await res.json() as Array<{ id: string; areas: string[] }>
    const grocery = body.find(s => s.id === 'store-grocery')!
    expect(grocery.areas[0]).toBe('Produce')
    expect(grocery.areas.at(-1)).toBe('Other')
  })
})

// ---------------------------------------------------------------------------

describe('GET /api/store-types/:id/dictionary', () => {
  test('returns a map of item names to area strings for a known type', async () => {
    const res = await get('/api/store-types/grocery/dictionary')
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, string>
    expect(typeof body).toBe('object')
    expect(Object.keys(body).length).toBeGreaterThan(0)
  })

  test('grocery dictionary maps common items to correct areas', async () => {
    const res = await get('/api/store-types/grocery/dictionary')
    const dict = await res.json() as Record<string, string>
    expect(dict['apple']).toBe('Produce')
    expect(dict['milk']).toBe('Dairy')
    expect(dict['bread']).toBe('Bakery')
    expect(dict['chicken']).toBe('Meat & Seafood')
    expect(dict['toilet paper']).toBe('Household')
  })

  test('home-depot dictionary maps items to its own area set', async () => {
    const res = await get('/api/store-types/home-depot/dictionary')
    const dict = await res.json() as Record<string, string>
    expect(dict['paint']).toBe('Paint & Supplies')
    expect(dict['lumber']).toBe('Lumber & Building')
  })

  test('unknown store type returns 404', async () => {
    const res = await get('/api/store-types/nonexistent/dictionary')
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------

describe('seeding', () => {
  test('all 3 store types are present in the database', () => {
    const rows = db.prepare('SELECT id FROM store_types ORDER BY id').all() as Array<{ id: string }>
    const ids = rows.map(r => r.id)
    expect(ids).toContain('grocery')
    expect(ids).toContain('home-depot')
    expect(ids).toContain('costco')
  })

  test('grocery dictionary has at least 300 entries', () => {
    const { count } = db.prepare(
      "SELECT COUNT(*) as count FROM store_type_dictionary WHERE store_type_id = 'grocery'"
    ).get() as { count: number }
    expect(count).toBeGreaterThanOrEqual(300)
  })

  test('each store type has a non-empty areas list', () => {
    const rows = db.prepare('SELECT id, areas FROM store_types').all() as Array<{ id: string; areas: string }>
    for (const row of rows) {
      const areas = JSON.parse(row.areas) as string[]
      expect(areas.length).toBeGreaterThan(0)
    }
  })
})
