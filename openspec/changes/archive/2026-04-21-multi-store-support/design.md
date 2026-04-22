## Context

The app currently has a single hardcoded set of 11 grocery store areas defined as a TypeScript union in `client/src/types.ts`, with a bundled `dictionary.json` used for client-side item classification. The database has no concept of stores or store types — all lists share the same area vocabulary.

This change introduces store types (with their own area sets and dictionaries), store instances that reference a type, and associates each list with a store. Classification switches from a bundled static dictionary to a per-store-type dictionary fetched from the server and cached client-side.

## Goals / Non-Goals

**Goals:**
- Model store types with configurable area sets and classification dictionaries
- Associate lists with a store; default to Grocery Store
- Serve per-store-type dictionaries from the API; classify client-side as before
- Migrate production data automatically on startup via `PRAGMA user_version`
- Seed grocery (from existing dictionary), Home Depot, and Costco store types

**Non-Goals:**
- UI for managing stores, areas, or dictionaries (use SQLite app externally)
- Per-store item availability / filtering across multiple grocery stores
- Server-side classification

## Decisions

### 1. Dictionary storage: database over bundled JSON

**Decision**: Move dictionaries to `store_type_dictionary` table in SQLite rather than keeping separate JSON files per store type.

**Rationale**: The DB is already the source of truth for all mutable data. Storing dictionaries there enables future UI management without a redeploy, keeps everything in one place for backup, and avoids bundling store-specific data into the client.

**Alternative considered**: One JSON file per store type shipped with the server. Simpler initially but makes UI management harder later and couples dictionary updates to deploys.

### 2. Classification remains client-side; dictionary fetched per store type

**Decision**: Keep classification logic in `classify.ts` client-side. Dictionary for the active store type is fetched from `GET /api/store-types/:id/dictionary` on list load and cached in React Query.

**Rationale**: Client-side classification preserves offline functionality — once the dictionary is cached, items can be classified without network access. Moving classification server-side would break offline item entry.

**Alternative considered**: POST to server for each classification. Breaks offline mode entirely.

### 3. Schema migration via `PRAGMA user_version` in db.ts

**Decision**: Add versioned migration blocks to `db.ts` gated on `PRAGMA user_version`. Migration runs automatically on server startup.

**Rationale**: The existing `db.ts` pattern (CREATE TABLE IF NOT EXISTS) already runs on startup. Extending it with a version integer requires no new tooling, no separate migration runner, and no manual deploy steps. SQLite's built-in `user_version` pragma is purpose-built for this.

**Alternative considered**: A migrations directory with numbered SQL files run by a script. More structured but adds tooling complexity that isn't warranted for a small single-server app.

### 4. Store selector lives in the list header (deferred choice)

**Decision**: List creation is unchanged — user creates a list as today. The store selector (`<select>`) appears in the list header next to the name, defaulting to Grocery Store.

**Rationale**: Zero friction to create a list. Store choice is natural when you're already looking at the list. Matches the existing "tap to rename" pattern for the list name.

**Alternative considered**: Modal or two-step creation flow. Adds friction for the common case (grocery list) to optimize for the rarer case (Home Depot list).

### 5. Store change bulk-reclassifies existing items to "Other"

**Decision**: When the store is changed on a list that already has items, all items are moved to "Other".

**Rationale**: Items classified for one store type are meaningless under another's area vocabulary. "Other" is the honest fallback — the user can correct individual items. Silently preserving a Grocery area string in a Home Depot list would be confusing.

## Risks / Trade-offs

- **Large dictionary seed inserts** → Use a prepared statement batch insert rather than individual rows. SQLite handles this fine; just avoid 1000+ individual transactions.
- **Dictionary cache staleness** → Cached via React Query with the list. If a dictionary is updated externally (via SQLite app), users won't see changes until next page load. Acceptable given dictionaries are rarely updated.
- **`ALTER TABLE lists ADD COLUMN store_id`** → SQLite doesn't support `IF NOT EXISTS` on ALTER TABLE. Wrap in try/catch; ignore "duplicate column" error. Only runs when `user_version = 0`.
- **Existing lists have no store_id** → Migration sets all existing lists to the default Grocery Store id. Safe because all existing items already use grocery area strings.

## Migration Plan

Migration runs automatically on server startup in `db.ts`:

1. Read `PRAGMA user_version`
2. If `0`: run migration block
   - Create `store_types`, `stores`, `store_type_dictionary` tables
   - `ALTER TABLE lists ADD COLUMN store_id TEXT REFERENCES stores(id)`
   - Insert grocery store type + seeded dictionary (migrated from `dictionary.json`)
   - Insert Home Depot store type + dictionary
   - Insert Costco store type + dictionary
   - Insert store instances: "Grocery Store", "Home Depot", "Costco"
   - `UPDATE lists SET store_id = <grocery store id>`
   - `PRAGMA user_version = 1`
3. Server continues startup

**Rollback**: Not applicable — SQLite has no DDL rollback. If migration fails, server logs the error and exits. Fix forward.
