import { describe, test, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { randomBytes } from 'crypto'
import usersRouter from './users'
import { requireAuth } from '../middleware/auth'
import db from '../db'

const app = new Hono()
app.use('/api/users/*', requireAuth)
app.route('/api/users', usersRouter)

beforeEach(() => {
  db.exec('DELETE FROM lists')
  db.exec('DELETE FROM users')
})

// ---------------------------------------------------------------------------
// Helpers

function createUser(email: string) {
  const userId = randomUUID()
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(userId, email)
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
  return { userId, email, cookie: `session=${token}` }
}

function createList(userId: string, email: string, name = 'Test List', role = 'owner') {
  const listId = randomUUID()
  db.prepare('INSERT INTO lists (id, name, owner_email, store_id) VALUES (?, ?, ?, ?)').run(
    listId, name, email, 'store-grocery'
  )
  db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
    listId, userId, role
  )
  return listId
}

const get = (path: string, cookie?: string) =>
  app.fetch(new Request(`http://localhost${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  }))

// ---------------------------------------------------------------------------

describe('GET /api/users/me/lists', () => {
  test('returns empty array when user has no lists', async () => {
    const { cookie } = createUser('a@example.com')
    const res = await get('/api/users/me/lists', cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(body).toEqual([])
  })

  test('returns all lists the user is a member of', async () => {
    const user = createUser('a@example.com')
    createList(user.userId, user.email, 'List One')
    createList(user.userId, user.email, 'List Two')

    const res = await get('/api/users/me/lists', user.cookie)
    const body = await res.json() as Array<{ name: string }>
    expect(body).toHaveLength(2)
    expect(body.map(l => l.name)).toContain('List One')
    expect(body.map(l => l.name)).toContain('List Two')
  })

  test('includes the role for each list', async () => {
    const owner = createUser('owner@example.com')
    const member = createUser('member@example.com')
    const listId = createList(owner.userId, owner.email, 'Shared List')
    db.prepare('INSERT INTO list_members (list_id, user_id, role) VALUES (?, ?, ?)').run(
      listId, member.userId, 'member'
    )

    const ownerRes = await get('/api/users/me/lists', owner.cookie)
    const ownerBody = await ownerRes.json() as Array<{ role: string }>
    expect(ownerBody[0].role).toBe('owner')

    const memberRes = await get('/api/users/me/lists', member.cookie)
    const memberBody = await memberRes.json() as Array<{ role: string }>
    expect(memberBody[0].role).toBe('member')
  })

  test('only returns lists the user belongs to, not all lists', async () => {
    const userA = createUser('a@example.com')
    const userB = createUser('b@example.com')
    createList(userA.userId, userA.email, "A's List")
    createList(userB.userId, userB.email, "B's List")

    const res = await get('/api/users/me/lists', userA.cookie)
    const body = await res.json() as Array<{ name: string }>
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("A's List")
  })

  test('unauthenticated gets 401', async () => {
    const res = await get('/api/users/me/lists')
    expect(res.status).toBe(401)
  })
})
