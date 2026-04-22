## Why

The app currently supports a single hardcoded set of grocery store areas. As the family uses it for trips to different stores (grocery, Costco, Home Depot), each with distinct sections and inventory, the fixed area model breaks down — a Home Depot list has no use for "Dairy" or "Produce".

## What Changes

- Add `store_types` and `stores` tables to the database; each store type defines its own area set and classification dictionary
- Add `store_id` to `lists`; all existing lists migrate to a default "Grocery Store"
- Classification dictionaries move from a bundled client-side JSON file to per-store-type records in the database, fetched and cached client-side
- `StoreArea` becomes a dynamic string type resolved from the active store type's area set
- Store selector (`<select>`) added to the list header; defaults to Grocery Store on creation
- Changing a list's store reassigns all existing items to "Other"
- Seed data: grocery (migrated from current `dictionary.json`), Home Depot, and Costco store types with generated dictionaries
- Schema migration uses `PRAGMA user_version` versioning in `db.ts`, runs automatically on startup

## Capabilities

### New Capabilities

- `store-management`: Store types and store instances — data model, API endpoints, seed data, and migration strategy

### Modified Capabilities

- `store-area-classification`: Classification now uses a per-store-type dictionary fetched from the API rather than a bundled JSON file; `StoreArea` type becomes a dynamic string
- `list-management`: Lists now reference a store; store selector appears in list header; store change triggers bulk reclassification to "Other"

## Impact

- **Database**: new tables `store_types`, `stores`, `store_type_dictionary`; `lists` gets `store_id`; migration in `db.ts`
- **Server**: new API route to serve store types and their dictionaries
- **Client**: `types.ts` (`StoreArea` → string), `classify.ts` (dynamic dictionary), `ListPage.tsx` (store selector), `dictionary.json` (replaced by DB)
- **No breaking changes to existing list or item APIs**
