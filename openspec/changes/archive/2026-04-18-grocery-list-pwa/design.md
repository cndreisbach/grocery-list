## Context

This is a greenfield PWA for household grocery list sharing. The primary users are households or roommates who want a shared list without full account management. The app must work well on mobile (in-store use), support real-time sync between devices, and degrade gracefully offline.

## Goals / Non-Goals

**Goals:**
- Email-based list creation and recovery (no passwords)
- Shareable lists via UUID URL — possession of the link grants access
- Real-time sync: changes on one device appear immediately on all connected devices
- Fast item entry with autocomplete (history + common items dictionary)
- Automatic store-area grouping with ≥90% accuracy on common items
- Offline support: view list, add items, check/delete — mutations queue and replay on reconnect
- Installable PWA, mobile-first UI

**Non-Goals:**
- Multi-store support (one layout/ordering per list)
- Receipt scanning or barcode lookup
- Price tracking
- Full user accounts with passwords

## Decisions

### Single Deployment: Bun + Hono serving React SPA

One Bun process handles everything: API routes, SSE, and serving the built React SPA as static files. This means one CapRover app, one container, one process.

```
  Bun process
  ├── Hono router
  │   ├── /api/lists/*          (REST API)
  │   ├── /api/lists/:id/events (SSE)
  │   └── /*                    (serves built React SPA)
  └── bun:sqlite                (built-in, no driver needed)
```

**Alternatives considered:** Go API + SvelteKit (two deploys, Go preferred language but adds operational complexity); Next.js (Node/Vercel-oriented, heavier); Remix (more than needed for a SPA).

### Frontend: React + Vite + TypeScript

React because the developer knows it. Vite for fast builds and first-class PWA support via `vite-plugin-pwa` (Workbox-based). The app is a SPA — no SSR needed.

**State management:** TanStack Query for server state (list + items). Optimistic updates on all mutations. SSE events update the query cache directly.

### Backend: Bun + Hono + TypeScript

Hono is a lightweight, TypeScript-native HTTP framework that runs natively on Bun. It has built-in `streamSSE` support. The server is intentionally thin — routing, SQLite reads/writes, SSE broadcast, and email dispatch via Resend SDK.

### Storage: SQLite via `bun:sqlite`

Built into Bun — no install, no external process. WAL mode enabled. Sufficient for household-scale traffic.

Schema:
```
lists(
  id TEXT PRIMARY KEY,           -- UUID v4
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

items(
  id TEXT PRIMARY KEY,           -- UUID v4
  list_id TEXT NOT NULL REFERENCES lists(id),
  name TEXT NOT NULL,
  store_area TEXT NOT NULL,
  area_overridden INTEGER DEFAULT 0,
  checked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

item_history(
  list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  store_area TEXT NOT NULL,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, name)
)
```

### Real-Time: Server-Sent Events (SSE)

SSE over WebSockets because: writes are infrequent and already work as HTTP calls; real-time is purely server→client ("your partner added milk"); SSE requires no special CapRover/nginx config (unlike WebSocket upgrades); browser reconnection is built-in.

Each list UUID gets an in-memory broadcast channel on the server. When any mutation completes for list X, the server pushes an event to all SSE subscribers for X. The client handles the event by invalidating the TanStack Query cache, triggering a re-fetch.

```
  Partner POSTs new item
      │
  Hono writes to SQLite
  + broadcasts SSE event to all /api/lists/[uuid]/events subscribers
      │
  Your browser receives event → TanStack Query refetches → UI updates
```

On reconnect after offline, the SSE connection re-establishes and the client does a full re-fetch (Option A — no event log needed at household scale).

### Email: Resend

Resend for transactional email. Two email types:
1. **List created**: sent on `POST /api/lists` — includes list name and URL
2. **List recovery**: sent on `POST /api/recover` — includes all list names and URLs for the email

**Alternatives considered:** Nodemailer + SMTP (viable if user has SMTP credentials, zero external dependency), AWS SES (good deliverability but requires AWS account).

### Email-Based List Creation and Recovery

Email is an organizational tool, not an access gate. The UUID URL is still the only credential needed to access a list. Email is stored as `owner_email` on creation and used only for recovery.

Home page flow:
```
  Enter email
      │
  ┌───┴────────────────────────────┐
  │  "Create new list"             │  "Send me my lists"
  │  POST /api/lists               │  POST /api/recover
  │  → creates list                │  → looks up by email
  │  → sends email with link       │  → sends email with all links
  │  → navigates to /list/[uuid]   │  → shows "Check your email"
  └────────────────────────────────┘
```

### Offline Support

Service worker (Workbox via `vite-plugin-pwa`) caches:
- App shell (HTML/JS/CSS) — serves offline immediately
- Current list data — cached on load, served stale offline

Offline mutations (add item, check/uncheck item, delete item) are queued via the Background Sync API and replayed on reconnect. Fallback for browsers without Background Sync: queue in memory/localStorage, replay on `window.online` event.

### Store-Area Classification: Lookup Table + Fuzzy Match

Client-side, no API calls:
1. Normalize input (lowercase, strip trailing 's', common synonyms)
2. Exact match against bundled JSON dictionary (~500 items)
3. Fuzzy match (Levenshtein ≤ 2) if no exact match
4. History match takes precedence over dictionary for returning items
5. Fallback: "Other"

### Visual Design

**Color palette:**
- Background: `#FFF8F0` (warm cream)
- Text: `#1A1530` (near-black, purple-tinted)
- Primary actions (buttons, CTAs): `#FF8811` (orange)
- Navigation / header: `#392F5A` (deep purple)
- Checked item state: `#9DD9D2` (teal — strikethrough, muted)
- Store area badges / labels: `#F4D06F` (golden yellow)

**Tone:** Warm and friendly, not cartoonish. Clean, readable typography. Large touch targets (≥44px). Information density optimized for scanning in a store — store area groups clearly delineated, unchecked items visually dominant over checked ones.

## Risks / Trade-offs

- **UUID guessability**: Anyone who intercepts the URL has full list access forever. Mitigation: document this; no sensitive data in lists; add list deletion in a later version if needed.
- **Email as weak identity**: No verification that the person entering an email owns it — anyone can enter another person's email and see their list names (not the lists themselves). Mitigation: acceptable for household use; list content still requires the UUID.
- **SSE and CapRover**: Long-lived HTTP connections — ensure CapRover's nginx proxy timeout is set high enough (or disabled for SSE routes). May need `proxy_read_timeout` config.
- **SQLite WAL concurrency**: Household-scale traffic makes this a non-issue; retry on `SQLITE_BUSY` as a safeguard.
- **Background Sync browser support**: Not available in all browsers (notably Safari). Mitigation: `window.online` fallback covers the common case.

## Open Questions

- Should lists be deletable? (Not in v1, worth adding later.)
- Should the email recovery flow warn if no lists are found for that email, or always show "Check your email" (to avoid email enumeration)?
