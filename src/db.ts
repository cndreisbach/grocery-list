import { Database } from 'bun:sqlite'

const db = new Database(process.env.DB_PATH ?? 'grocery.db', { create: true })

db.exec('PRAGMA journal_mode=WAL')
db.exec('PRAGMA foreign_keys=ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Grocery List',
    owner_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    store_area TEXT NOT NULL,
    area_overridden INTEGER NOT NULL DEFAULT 0,
    checked INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS item_history (
    list_id TEXT NOT NULL,
    name TEXT NOT NULL,
    store_area TEXT NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, name)
  )
`)

export default db
