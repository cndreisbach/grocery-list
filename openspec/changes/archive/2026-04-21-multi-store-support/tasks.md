## 1. Database Migration

- [x] 1.1 Add `PRAGMA user_version` check to `db.ts` and scaffold versioned migration block
- [x] 1.2 Create `store_types` table (id, name, areas JSON, area_order JSON)
- [x] 1.3 Create `stores` table (id, name, store_type_id)
- [x] 1.4 Create `store_type_dictionary` table (store_type_id, item_name, area)
- [x] 1.5 `ALTER TABLE lists ADD COLUMN store_id TEXT REFERENCES stores(id)` (wrapped in try/catch for duplicate column)
- [x] 1.6 Seed grocery store type: insert areas + area_order from current `STORE_AREAS` constant
- [x] 1.7 Seed grocery dictionary: batch-insert all entries from `dictionary.json`
- [x] 1.8 Seed Home Depot store type: areas (Lumber & Building, Paint & Supplies, Plumbing, Electrical, Hardware & Fasteners, Tools, Garden & Outdoor, Flooring, Kitchen & Bath, Other) + dictionary
- [x] 1.9 Seed Costco store type: areas + dictionary
- [x] 1.10 Insert store instances: "Grocery Store", "Home Depot", "Costco"
- [x] 1.11 `UPDATE lists SET store_id = <grocery store id>` for all existing lists
- [x] 1.12 Set `PRAGMA user_version = 1`

## 2. Server API

- [x] 2.1 Add `GET /api/stores` endpoint returning all store instances with their store type name and areas
- [x] 2.2 Add `GET /api/store-types/:id/dictionary` endpoint returning item→area map for a store type
- [x] 2.3 Update `GET /api/lists/:id` response to include `store_id`, `store_type_id`, and store areas
- [x] 2.4 Add `PATCH /api/lists/:id/store` endpoint to update a list's store and bulk-reclassify existing items to "Other"

## 3. Client Types and Classification

- [x] 3.1 Update `types.ts`: change `StoreArea` from union type to `string`; remove `STORE_AREAS` constant; add `Store` and `StoreType` interfaces
- [x] 3.2 Update `classify.ts`: accept dictionary as a parameter (`Record<string, string>`) instead of importing `dictionary.json`
- [x] 3.3 Update `classify.test.ts` to pass a dictionary explicitly; verify existing tests still pass
- [x] 3.4 Remove `client/src/data/dictionary.json` (data now lives in DB; file kept as test fixture only)

## 4. Client Data Fetching

- [x] 4.1 Add API calls to `api.ts`: `getStores()`, `getStoreDictionary(storeTypeId)`, `updateListStore(listId, storeId)`
- [x] 4.2 Update `GroceryList` type to include `store_id`, `store_type_id`, and `areas: string[]`
- [x] 4.3 In `ListPage.tsx`, fetch store dictionary via React Query using `store_type_id` from the list response; pass to `ItemInput`

## 5. UI — Store Selector

- [x] 5.1 Fetch stores list in `ListPage.tsx` via React Query (`getStores`)
- [x] 5.2 Add store `<select>` to list header in `ListPage.tsx`, next to the list name
- [x] 5.3 On store change, call `updateListStore` and invalidate list query (triggers refetch with new areas and dictionary)
- [x] 5.4 Update `groupedItems()` in `ListPage.tsx` to use `data.areas` instead of imported `STORE_AREAS`
- [x] 5.5 Update `AreaPicker` component to accept `areas: string[]` prop instead of using imported `STORE_AREAS`

## 6. Verification

- [x] 6.1 Verify existing grocery list items display correctly after migration on local dev DB
- [x] 6.2 Verify creating a new list defaults to Grocery Store
- [x] 6.3 Verify switching to Home Depot store reassigns all items to "Other"
- [x] 6.4 Verify Home Depot item entry classifies against Home Depot dictionary
- [x] 6.5 Verify all existing classify tests pass with dynamic dictionary
