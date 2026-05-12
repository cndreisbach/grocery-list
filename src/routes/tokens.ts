import { Hono } from 'hono'
import { randomUUID, randomBytes } from 'crypto'
import db, { getMemberRole } from '../db'

const app = new Hono()

// POST /api/lists/:id/tokens — create a named API token (owner only)
// Full token returned in this response only; subsequent GETs never include it.
app.post('/:id/tokens', async (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()

  if (getMemberRole(listId, user.id) !== 'owner') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json().catch(() => ({}))
  const name: string = body?.name ?? ''
  if (!name || typeof name !== 'string') return c.json({ error: 'Name required' }, 400)

  const id = randomUUID()
  const token = `glk_${randomBytes(16).toString('hex')}`
  const last4 = token.slice(-4)

  db.prepare(
    'INSERT INTO list_tokens (id, token, list_id, name, last4) VALUES (?, ?, ?, ?, ?)'
  ).run(id, token, listId, name, last4)

  const row = db.prepare(
    'SELECT id, name, last4, created_at, last_used_at FROM list_tokens WHERE id = ?'
  ).get(id) as Record<string, unknown>

  return c.json({ ...row, token }, 201)
})

// GET /api/lists/:id/tokens — list tokens without full token values (owner only)
app.get('/:id/tokens', (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()

  if (getMemberRole(listId, user.id) !== 'owner') return c.json({ error: 'Forbidden' }, 403)

  const tokens = db.prepare(
    'SELECT id, name, last4, created_at, last_used_at FROM list_tokens WHERE list_id = ? ORDER BY created_at ASC'
  ).all(listId)

  return c.json(tokens)
})

// DELETE /api/lists/:id/tokens/:tokenId — revoke a token (owner only)
app.delete('/:id/tokens/:tokenId', (c) => {
  const user = c.get('user')
  const { id: listId, tokenId } = c.req.param()

  if (getMemberRole(listId, user.id) !== 'owner') return c.json({ error: 'Forbidden' }, 403)

  const result = db.prepare(
    'DELETE FROM list_tokens WHERE id = ? AND list_id = ? RETURNING id'
  ).get(tokenId, listId) as { id: string } | null

  if (!result) return c.json({ error: 'Token not found' }, 404)

  return new Response(null, { status: 204 })
})

export default app
