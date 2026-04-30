import { Hono } from 'hono'
import { cors } from 'hono/cors'
import listsRouter from './routes/lists'
import itemsRouter from './routes/items'
import eventsRouter from './routes/events'
import membersRouter from './routes/members'
import usersRouter from './routes/users'
import authRouter from './routes/auth'
import { storesRouter, storeTypesRouter } from './routes/stores'
import { requireAuth } from './middleware/auth'

const app = new Hono()

// Allow Vite dev server origin in development
app.use('/api/*', cors({ origin: process.env.NODE_ENV === 'production' ? process.env.APP_URL! : '*' }))

app.route('/api/auth', authRouter)

// All list and user routes require authentication
app.use('/api/lists/*', requireAuth)
app.use('/api/users/*', requireAuth)

app.route('/api/lists', listsRouter)
app.route('/api/lists', itemsRouter)
app.route('/api/lists', eventsRouter)
app.route('/api/lists', membersRouter)
app.route('/api/users', usersRouter)
app.route('/api/stores', storesRouter)
app.route('/api/store-types', storeTypesRouter)

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
