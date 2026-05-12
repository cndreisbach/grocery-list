## 1. Database

- [x] 1.1 Add `list_tokens` table migration to `src/db.ts` (columns: id, token, list_id, name, last4, created_at, last_used_at)
- [x] 1.2 Export a `getTokenByValue(token)` helper that returns the token row or null
- [x] 1.3 Export an `updateTokenLastUsed(id)` helper

## 2. Token Management API (human-facing)

- [x] 2.1 Create `src/routes/tokens.ts` with POST `/api/lists/:id/tokens` (owner only; generate `glk_` token, store full + last4, return full token once)
- [x] 2.2 Add GET `/api/lists/:id/tokens` to `tokens.ts` (owner only; return id, name, last4, created_at, last_used_at — no full token)
- [x] 2.3 Add DELETE `/api/lists/:id/tokens/:tokenId` to `tokens.ts` (owner only; 404 if not found)
- [x] 2.4 Register token management routes in `src/index.ts` under `requireAuth`

## 3. Programmatic API (token-facing)

- [x] 3.1 Create `src/middleware/tokenAuth.ts` — reads `Authorization: Bearer <token>`, looks up token, sets `c.set('tokenListId', listId)`, updates `last_used_at`, returns 401 if invalid
- [x] 3.2 Create `src/routes/tokenItems.ts` with GET `/api/token/items` (list all items for token's list)
- [x] 3.3 Add POST `/api/token/items` to `tokenItems.ts` (add item; name required, store_area defaults to Other; broadcast `item_added`)
- [x] 3.4 Register token item routes in `src/index.ts` under `requireTokenAuth` middleware

## 4. Tests

- [x] 4.1 Add tests for token management routes (create, list, revoke; auth enforcement)
- [x] 4.2 Add tests for `GET /api/token/items` (valid token, invalid token, missing header)
- [x] 4.3 Add tests for `POST /api/token/items` (add item, missing name, SSE broadcast)

## 5. Client — TokensPanel

- [x] 5.1 Create `src/components/TokensPanel.tsx` with token list (name, last4, last_used_at, revoke button)
- [x] 5.2 Add inline create-token form to `TokensPanel` (name input, submit)
- [x] 5.3 Add one-time token reveal state in `TokensPanel` (show full token + copy button + Done button after creation)
- [x] 5.4 Add `api.getTokens`, `api.createToken`, `api.revokeToken` methods to `src/lib/api.ts`
- [x] 5.5 Import and render `<TokensPanel>` inside `MembersPanel` for owners only
