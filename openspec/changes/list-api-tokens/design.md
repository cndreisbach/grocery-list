## Context

The app uses Hono + Bun with SQLite. Human auth flows through session cookies: magic link → OTP → session token stored in `sessions` table → `requireAuth` middleware reads cookie → sets `c.get('user')` → routes call `getMemberRole(listId, userId)` to authorize.

There is no existing mechanism for non-human callers. All item routes require a valid session cookie and an explicit list ID in the URL.

## Goals / Non-Goals

**Goals:**
- Allow a Bearer token to authenticate programmatic item reads and writes
- Keep the token self-contained: it identifies the list, so callers need only the token
- Expose a minimal, stable programmatic API at `/api/token/`
- Let owners create/revoke tokens via the existing MembersPanel UI
- Track last use of each token

**Non-Goals:**
- Token expiry or rotation (personal tool; revoke-on-compromise is sufficient)
- Multiple scopes per token (read-only vs. read-write) — all tokens are read/write
- Modifying or deleting items via the token API (future consideration)
- Rate limiting

## Decisions

### D1: Token identifies the list (not just authenticates)

The token row stores `list_id`. The programmatic API (`/api/token/items`) uses the token to resolve which list to operate on — no list ID in the URL. The LLM tool only needs to know one thing: the token.

**Alternative considered:** Token authenticates, list ID supplied in URL (reuse existing routes). Rejected because it requires modifying existing middleware and routes, and forces the LLM tool to track two values.

### D2: Separate `/api/token/` route namespace

Token-authenticated routes live at `/api/token/items`, completely separate from `/api/lists/:id/items`. Existing routes are untouched. The two namespaces can evolve independently.

**Alternative considered:** Extend `requireAuth` to accept Bearer tokens and reuse existing item routes. Rejected because it couples the two auth paths and requires touching every existing route.

### D3: Token stored in full in the database

The full `glk_<random>` token is stored in `list_tokens`. On auth, the middleware does a direct lookup. The "never shown again" UX is a product decision, not a security measure — this is a self-hosted personal app and DB access implies full compromise anyway.

**Alternative considered:** Store a hash, verify on lookup. Rejected as unnecessary complexity for this threat model.

### D4: Token format: `glk_` prefix + `crypto.randomUUID()` (stripped of dashes)

Produces tokens like `glk_a3f8c2d1e4b5f6a7b8c9d0e1f2a3b4c5`. Prefixed tokens are self-identifying in config files and logs. UUID source is sufficient randomness (122 bits).

### D5: New `requireTokenAuth` middleware, not modifying `requireAuth`

A dedicated middleware for the token path keeps concerns separated. It reads `Authorization: Bearer <token>`, looks up `list_tokens`, sets `c.set('tokenListId', listId)`, and updates `last_used_at`. Token routes use this middleware; human routes continue using `requireAuth` unchanged.

### D6: Token management UI inside MembersPanel

Owners see a new "API Tokens" section below the members list. Same panel, same toggle. Tokens are created inline with a name input; on creation the full token is shown once with a copy button. Subsequent views show only name, last 4 chars, last used timestamp, and a revoke button.

## Risks / Trade-offs

- **Full token in DB**: If the DB is compromised, all tokens are compromised. → Acceptable for a personal self-hosted app; document that tokens should be treated as sensitive.
- **No token expiry**: A leaked token grants indefinite list access. → Owner can revoke; scope is limited to one list's items.
- **`last_used_at` write on every request**: Minor write overhead on each API call. → Negligible for expected traffic (voice assistant, not high-frequency automation).

## Migration Plan

1. Deploy server changes (new table created by migration in `db.ts`, new routes registered in `index.ts`)
2. Deploy client changes (TokensPanel section in MembersPanel)
3. No data migration needed; no existing behavior changes
4. Rollback: remove new routes and table; client reverts to previous MembersPanel

## Open Questions

- None — all decisions made during design exploration.
