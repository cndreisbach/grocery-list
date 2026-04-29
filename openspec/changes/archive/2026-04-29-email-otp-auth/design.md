## Context

The app currently has no accounts or authentication. Lists are identified by UUID and accessible by anyone who knows the URL. "Ownership" is an email string on the list record. There is no multi-user access control.

Users want to see all their lists in one place after logging in, share editing access with household members (including children without phones), and have unauthenticated access removed.

Constraints:
- Bun + Hono backend, SQLite via `bun:sqlite`
- React frontend, PWA on iOS and Android
- Resend already integrated for transactional email
- Must work for users without phone numbers

## Goals / Non-Goals

**Goals:**
- Authenticate users via email OTP (6-digit code) — no passwords, no magic links
- Indefinite sessions set within the PWA context (avoids iOS cookie jar isolation)
- Dashboard: list of lists, or direct redirect if user has exactly one
- Owner can invite members by email; invitees auto-created on first login
- Auto-adopt existing lists whose `owner_email` matches the logged-in user

**Non-Goals:**
- OAuth / social login
- Password-based auth
- SMS / phone number support
- Admin or moderation tooling
- Email change / account deletion flows (can be added later)

## Decisions

### OTP code, not magic link

**Decision**: Send a 6-digit code the user enters in the PWA, rather than a clickable link.

**Why**: iOS PWAs run in a sandboxed WKWebView with a separate cookie jar from Safari. Clicking a magic link opens Safari, sets the session cookie there, and the PWA remains unauthenticated. An OTP code is entered directly inside the PWA, so the session cookie is written to the correct context.

**Alternatives considered**:
- Magic link: Broken on iOS PWA (cookie isolation)
- SMS OTP: Better UX but excludes users without phones (e.g., children)

---

### Indefinite sessions

**Decision**: Sessions have no expiry. Users stay logged in until they explicitly log out or clear app data.

**Why**: This is a household utility, not a financial app. The friction of re-authenticating is higher than the security benefit for this threat model. With OTP re-auth being painless anyway, indefinite sessions are the right default.

**Alternatives considered**:
- 30-day rolling sessions: More complex, no real benefit for this use case

---

### Auto-adopt legacy lists on first login

**Decision**: When a user logs in for the first time, any lists where `owner_email` matches their email are automatically inserted into `list_members` as `owner`.

**Why**: The existing DB has real lists with real `owner_email` values. Without adoption, users would lose access to their data on auth rollout.

**Alternatives considered**:
- Manual claim flow: Unnecessary friction; ownership is unambiguous
- Clean break: Would lose real user data

---

### `list_members` as the access model

**Decision**: A `list_members` join table with `role` ('owner' | 'member') controls who can access a list. The `lists.owner_email` column is kept but ignored after migration.

**Why**: Normalizes access control. Supports multiple owners in the future if needed. Simple to query.

---

### Auth middleware on all list routes

**Decision**: A Hono middleware validates the session cookie before any `/api/lists/*` handler runs. Unauthenticated requests receive 401.

**Why**: Single enforcement point. No risk of accidentally leaving a route unprotected.

---

### New DB tables

```sql
users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

otp_codes (
  code       TEXT NOT NULL,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at DATETIME NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
)

list_members (
  list_id    TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (list_id, user_id)
)
```

Session token: 32 random bytes as hex (64 chars). Stored in an `HttpOnly; SameSite=Strict` cookie named `session`.

OTP: 6-digit numeric string, 10-minute TTL, single-use.

## Risks / Trade-offs

- **Email deliverability for OTP** → Resend has good deliverability; OTP emails are transactional and short. Low risk.
- **OTP brute-force** → 6 digits = 1M combinations, 10-min window. Mitigation: rate-limit OTP requests per email (max 3 sends per 10 min, max 5 attempts per code).
- **iOS PWA session cookie** → `SameSite=Strict` with `Secure` flag. The PWA's standalone origin must match the cookie's domain. Ensure the deployed domain is consistent.
- **Legacy list adoption race** → If a user's email is used for adoption on first login, subsequent logins skip adoption (idempotent: only insert missing rows).

## Migration Plan

1. Deploy new schema (additive — new tables only, no column drops)
2. `lists.owner_email` remains in place; no data migration needed at deploy time
3. Auto-adoption runs at first login per user — no batch migration script required
4. After a stabilization period, `owner_email` can be dropped (separate change)

Rollback: The new tables can be dropped and the auth middleware removed. List data is untouched.
