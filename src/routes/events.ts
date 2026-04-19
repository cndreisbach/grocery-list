import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import db from '../db'
import { subscribe } from '../broadcast'

const app = new Hono()

app.get('/:id/events', (c) => {
  const { id: listId } = c.req.param()
  const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(listId)
  if (!list) return c.json({ error: 'List not found' }, 404)

  return streamSSE(c, async (stream) => {
    const unsubscribe = subscribe(listId, async ({ type, payload }) => {
      await stream.writeSSE({
        event: type,
        data: JSON.stringify(payload),
      })
    })

    // Keep-alive ping every 25s (below typical proxy timeout)
    const ping = setInterval(() => {
      stream.writeSSE({ event: 'ping', data: '' }).catch(() => {})
    }, 25_000)

    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        unsubscribe()
        clearInterval(ping)
        resolve()
      })
    })
  })
})

export default app
