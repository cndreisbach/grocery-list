import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import db from '../db'

export type AuthUser = { id: string; email: string }

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const row = db.prepare(`
    SELECT u.id, u.email
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as AuthUser | null

  if (!row) return c.json({ error: 'Unauthorized' }, 401)

  c.set('user', row)
  await next()
})
