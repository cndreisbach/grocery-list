## Why

The grocery list app is human-only today — auth requires a magic link, which can't be used by scripts or voice assistants. A local home voice assistant needs to add and read items programmatically, with an LLM parsing speech and making tool calls.

## What Changes

- List owners can create named API tokens scoped to a single list
- Tokens are prefixed `glk_`, shown once on creation with a copy button, and never returned again; last 4 characters are displayed for identification
- A `last_used_at` timestamp is tracked on each token
- Token management (create, list, revoke) is surfaced in the existing MembersPanel for owners
- A new `/api/token/` route namespace provides a programmatic API authenticated by Bearer token
- The token implicitly identifies the list — callers do not need to supply a list ID

## Capabilities

### New Capabilities

- `list-api-tokens`: Owners create and revoke named API tokens scoped to a specific list; tokens authenticate programmatic access without human session auth
- `token-item-api`: Programmatic read/write access to list items via `GET /api/token/items` and `POST /api/token/items`, authenticated by Bearer token

### Modified Capabilities

- `list-membership`: Token management UI added to MembersPanel (owner-only section); no requirement changes to existing membership behavior

## Impact

- **New DB table**: `list_tokens` (id, token, list_id, name, created_at, last_used_at)
- **New server routes**: `POST/GET/DELETE /api/lists/:id/tokens`, `GET/POST /api/token/items`
- **New middleware**: Bearer token auth that resolves token → list context
- **Client**: New TokensPanel section inside MembersPanel; creation modal with copy-once UX
- **Existing routes**: Untouched — `/api/lists/` routes continue to use session cookie auth only
