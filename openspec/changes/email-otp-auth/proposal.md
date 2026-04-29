## Why

Users need accounts so they can see all their lists in one place and share editing access with household members. Currently, lists are only accessible via a UUID link with no identity or access control.

## What Changes

- Users authenticate via email OTP (6-digit code) — no passwords, no magic links
- A dashboard shows all lists a user owns or is a member of; if only one list exists, redirect straight to it
- List owners can invite other users by email; invitees are auto-created on first login
- **BREAKING**: Unauthenticated access to lists via UUID is removed — all list access requires a valid session
- Existing lists are auto-adopted on first login when `owner_email` matches the authenticated email
- Sessions are indefinite (one-time auth per device install)

## Capabilities

### New Capabilities

- `authentication`: Email OTP login flow — enter email, receive 6-digit code, enter code in PWA, session created
- `user-accounts`: User identity, session management, and the post-login dashboard (list of lists or direct redirect)
- `list-membership`: Multi-user list access — owner/member roles, invite by email, auto-adopt legacy lists

### Modified Capabilities

- `list-management`: Lists now require authentication; list access is gated by membership rather than UUID knowledge

## Impact

- **New dependencies**: none (uses existing Resend for OTP email delivery)
- **New DB tables**: `users`, `sessions`, `otp_codes`, `list_members`
- **Modified DB**: `lists.owner_email` kept for migration, otherwise superseded by `list_members`
- **Backend**: New auth middleware on all list routes; new `/auth` route group; new `/api/users/me/lists` dashboard endpoint
- **Frontend**: New login page (email + OTP entry), new dashboard page, protected route wrapper
- **Existing sessions**: None — this is a greenfield auth system
