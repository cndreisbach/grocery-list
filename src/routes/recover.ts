import { Hono } from 'hono'
import db from '../db'
import { sendRecoveryEmail } from '../email'

const app = new Hono()

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email: string = body?.email ?? ''

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  const lists = db.prepare(
    'SELECT id, name FROM lists WHERE owner_email = ? ORDER BY created_at DESC'
  ).all(email) as Array<{ id: string; name: string }>

  sendRecoveryEmail(email, lists).catch(err =>
    console.error('Failed to send recovery email:', err)
  )

  // Always return 200 to avoid email enumeration
  return c.json({ message: 'If any lists are associated with that email, they have been sent.' })
})

export default app
