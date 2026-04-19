import { Hono } from 'hono'
import { cors } from 'hono/cors'
import listsRouter from './routes/lists'
import itemsRouter from './routes/items'
import recoverRouter from './routes/recover'
import eventsRouter from './routes/events'

const app = new Hono()

// Allow Vite dev server origin in development
app.use('/api/*', cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }))

app.route('/api/lists', listsRouter)
app.route('/api/lists', itemsRouter)
app.route('/api/lists', eventsRouter)
app.route('/api/recover', recoverRouter)

// Serve built React SPA in production
app.get('*', async (c) => {
  const urlPath = c.req.path
  const file = Bun.file(`./dist${urlPath}`)
  if (await file.exists()) {
    return new Response(file)
  }
  // SPA fallback
  const index = Bun.file('./dist/index.html')
  if (await index.exists()) {
    return new Response(index, { headers: { 'Content-Type': 'text/html' } })
  }
  return c.text('Not found — run `bun run build:client` first', 404)
})

const port = parseInt(process.env.PORT ?? '3000')
console.log(`Server running on http://localhost:${port}`)

export default { port, fetch: app.fetch, idleTimeout: 0 }
