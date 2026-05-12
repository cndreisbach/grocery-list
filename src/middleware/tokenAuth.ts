import { createMiddleware } from 'hono/factory'
import { getTokenByValue, updateTokenLastUsed } from '../db'

declare module 'hono' {
  interface ContextVariableMap {
    tokenListId: string
  }
}

export const requireTokenAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)

  const token = authHeader.slice(7)
  const row = getTokenByValue(token)
  if (!row) return c.json({ error: 'Unauthorized' }, 401)

  updateTokenLastUsed(row.id)
  c.set('tokenListId', row.list_id)
  await next()
})
