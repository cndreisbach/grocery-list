import { Hono } from 'hono'
import db from '../db'

const app = new Hono()

// GET /api/users/me/lists
app.get('/me/lists', (c) => {
  const user = c.get('user')
  const lists = db.prepare(`
    SELECT l.id, l.name, lm.role
    FROM list_members lm
    JOIN lists l ON lm.list_id = l.id
    WHERE lm.user_id = ?
    ORDER BY l.created_at DESC
  `).all(user.id) as Array<{ id: string; name: string; role: string }>

  return c.json(lists)
})

export default app
