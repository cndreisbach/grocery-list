import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db, { getMemberRole } from '../db'
import { sendInviteEmail } from '../email'

const app = new Hono()

// GET /api/lists/:id/members
app.get('/:id/members', (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()

  if (!getMemberRole(listId, user.id)) return c.json({ error: 'Not found or access denied' }, 403)

  const members = db.prepare(`
    SELECT u.id, u.email, lm.role
    FROM list_members lm
    JOIN users u ON lm.user_id = u.id
    WHERE lm.list_id = ?
    ORDER BY lm.role DESC, u.email ASC
  `).all(listId) as Array<{ id: string; email: string; role: string }>

  return c.json(members)
})

// POST /api/lists/:id/members
app.post('/:id/members', async (c) => {
  const user = c.get('user')
  const { id: listId } = c.req.param()

  const role = getMemberRole(listId, user.id)
  if (!role) return c.json({ error: 'Not found or access denied' }, 403)
  if (role !== 'owner') return c.json({ error: 'Only the owner can invite members' }, 403)

  const body = await c.req.json().catch(() => ({}))
  const email: string = body?.email ?? ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  db.prepare('INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)').run(randomUUID(), email)
  const invitee = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string }

  const existing = db.prepare(
    'SELECT 1 FROM list_members WHERE list_id = ? AND user_id = ?'
  ).get(listId, invitee.id)
  if (existing) return c.json({ error: 'User is already a member of this list' }, 409)

  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    listId, invitee.id, 'member'
  )

  const list = db.prepare('SELECT id, name FROM lists WHERE id = ?').get(listId) as
    { id: string; name: string }

  sendInviteEmail(email, user.email, list).catch(err =>
    console.error('Failed to send invite email:', err)
  )

  return c.json({ id: invitee.id, email, role: 'member' }, 201)
})

// DELETE /api/lists/:id/members/:userId
app.delete('/:id/members/:userId', (c) => {
  const user = c.get('user')
  const { id: listId, userId: targetId } = c.req.param()

  const role = getMemberRole(listId, user.id)
  if (!role) return c.json({ error: 'Not found or access denied' }, 403)
  if (role !== 'owner') return c.json({ error: 'Only the owner can remove members' }, 403)
  if (targetId === user.id) return c.json({ error: 'Owner cannot remove themselves' }, 400)

  const result = db.prepare(
    'DELETE FROM list_members WHERE list_id = ? AND user_id = ? RETURNING user_id'
  ).get(listId, targetId)
  if (!result) return c.json({ error: 'Member not found' }, 404)

  return new Response(null, { status: 204 })
})

export default app
