## 1. Project Setup

- [x] 1.1 Initialize Bun project with TypeScript (`bun init`); set up `src/` structure for server and shared code
- [x] 1.2 Initialize React + Vite project in `client/` (`bun create vite client --template react-ts`)
- [x] 1.3 Add Hono (`hono`) to server dependencies
- [x] 1.4 Add `vite-plugin-pwa` (Workbox) to client; configure service worker for app-shell caching
- [x] 1.5 Configure Vite to build into `dist/` and Hono to serve `dist/` as static files in production
- [x] 1.6 Set up SQLite via `bun:sqlite`; enable WAL mode; create schema migrations (lists, items, item_history)
- [x] 1.7 Configure dev proxy: Vite dev server proxies `/api` to Bun server to avoid CORS during development
- [x] 1.8 Add Resend SDK (`resend`) and wire up with `RESEND_API_KEY` env var
- [x] 1.9 Create a single `Dockerfile` and CapRover `captain-definition` for the combined app

## 2. Common Items Dictionary

- [x] 2.1 Curate JSON dictionary of ≥300 common grocery items with store-area mappings
- [x] 2.2 Cover all 11 store areas: Produce, Dairy, Bakery, Meat & Seafood, Frozen, Pantry, Beverages, Snacks, Household, Personal Care, Other
- [x] 2.3 Bundle dictionary as a static JSON import in the client

## 3. Store-Area Classification

- [x] 3.1 Implement `normalizeItemName(name)` utility (lowercase, strip trailing 's', common synonyms)
- [x] 3.2 Implement `classifyItem(name, history, dictionary)` — history match → exact dictionary match → fuzzy match (Levenshtein ≤ 2) → "Other"
- [x] 3.3 Write unit tests for classification covering at least 100 items; verify ≥90% accuracy

## 4. Backend API

- [x] 4.1 `POST /api/lists` — accept `{ email, name? }`, create list with `owner_email`, send list-created email via Resend, return `{ id, name }`
- [x] 4.2 `POST /api/recover` — accept `{ email }`, look up all lists by email, send recovery email via Resend (always return 200 regardless of whether lists exist)
- [x] 4.3 `GET /api/lists/:id` — return list with items and item_history; 404 if not found
- [x] 4.4 `PATCH /api/lists/:id` — update list name
- [x] 4.5 `POST /api/lists/:id/items` — add item (`name`, `store_area`, `area_overridden`); upsert item_history; broadcast SSE event
- [x] 4.6 `PATCH /api/lists/:id/items/:itemId` — update item (`name`, `store_area`, `area_overridden`, `checked`); upsert item_history on rename; broadcast SSE event
- [x] 4.7 `DELETE /api/lists/:id/items/:itemId` — delete item; broadcast SSE event
- [x] 4.8 `DELETE /api/lists/:id/items?checked=true` — bulk delete checked items; broadcast SSE event

## 5. Real-Time SSE

- [x] 5.1 Implement in-memory broadcast channels: one channel per active list UUID
- [x] 5.2 `GET /api/lists/:id/events` — open SSE stream using Hono's `streamSSE`; subscribe to list's channel; clean up on client disconnect
- [x] 5.3 After each mutation (4.5–4.8), broadcast an event `{ type, payload }` to all subscribers for that list
- [x] 5.4 Client: open SSE connection on list page mount; on any event, invalidate TanStack Query cache to trigger re-fetch
- [x] 5.5 Client: reconnect SSE automatically on disconnect (browser EventSource handles this natively)

## 6. Email Templates

- [x] 6.1 Write list-created email: subject "Your grocery list is ready", body includes list name and link
- [x] 6.2 Write list-recovery email: subject "Your grocery lists", body includes a bullet list of list names + links; handle empty-list case gracefully (send nothing)

## 7. Home Page UI

- [x] 7.1 Build home page with email input field and two actions: "Create new list" and "Send me my lists"
- [x] 7.2 "Create new list": POST /api/lists with email, navigate to `/list/[id]` on success
- [x] 7.3 "Send me my lists": POST /api/recover with email, show "Check your email" confirmation
- [x] 7.4 Inline email validation before submitting either action
- [x] 7.5 Apply color palette: `#392F5A` header, `#FFF8F0` background, `#FF8811` primary buttons

## 8. List Page UI

- [x] 8.1 List page (`/list/[id]`) — fetch via TanStack Query; handle 404 with friendly message
- [x] 8.2 Editable list name in the page header (inline edit, saves on blur/Enter)
- [x] 8.3 "Share / Copy link" button that copies the current URL to clipboard

## 9. Item Entry UI

- [x] 9.1 Item input field pinned to top of list; submit on Enter or "Add" button tap
- [x] 9.2 On submit: classify item client-side, optimistically add to correct store-area group, POST to API
- [x] 9.3 Warn on duplicate item name (case-insensitive); require confirmation to add
- [x] 9.4 Checkbox per item; checked items styled with strikethrough and teal (`#9DD9D2`) tint; remain in place in their store-area group
- [x] 9.5 "Remove checked items" button shown only when ≥1 item is checked; confirm before deleting
- [x] 9.6 Delete action per item (swipe-to-delete on mobile, delete button on desktop)
- [x] 9.7 Inline rename: tap item name to edit, re-classify on save (unless area is overridden)

## 10. Store Area Grouping UI

- [x] 10.1 Render items grouped under store-area headings in fixed traversal order (Produce → Dairy → Bakery → Meat & Seafood → Frozen → Pantry → Beverages → Snacks → Household → Personal Care → Other)
- [x] 10.2 Store area headings styled as `#F4D06F` badges/labels
- [x] 10.3 Area picker per item (bottom sheet on mobile, dropdown on desktop) showing all 11 areas
- [x] 10.4 On area override: move item to new group, persist `area_overridden = true`
- [x] 10.5 Show visual indicator on items with manually overridden area
- [x] 10.6 Preserve manual override through item rename

## 11. Autocomplete UI

- [x] 11.1 Show suggestion dropdown after first character typed (up to 8 suggestions)
- [x] 11.2 Merge and rank suggestions: history (by recency) before dictionary (by prefix match)
- [x] 11.3 Selecting a suggestion fills the input and immediately submits the item
- [x] 11.4 Dismiss suggestions on Escape or focus-out
- [x] 11.5 Keyboard navigation of suggestions (arrow keys + Enter)

## 12. Offline Support

- [x] 12.1 Configure Workbox to cache app shell (HTML, JS, CSS) on service worker install
- [x] 12.2 Cache GET /api/lists/:id response in service worker on list load; serve stale when offline
- [x] 12.3 Queue add/check/delete mutations while offline using Background Sync API
- [x] 12.4 Fall back to `window.online` event replay for browsers without Background Sync (notably Safari)
- [x] 12.5 Show offline indicator banner when device has no network

## 13. PWA & Polish

- [x] 13.1 Add `manifest.json` with app name, icons, `display: standalone`, `start_url`, theme color `#392F5A`
- [x] 13.2 Test "Add to Home Screen" install flow on iOS Safari and Android Chrome
- [x] 13.3 Ensure mobile-first layout: large touch targets (≥44px), readable font sizes, no horizontal scroll
- [x] 13.4 Keyboard accessibility: all actions reachable by keyboard, focus returns to input after adding item
- [x] 13.5 Write end-to-end tests for the golden path: enter email → create list → add items → check off → remove checked
