## Why

Grocery shopping is a routine task that benefits from a shared, frictionless list — but existing solutions require account creation and logins that create friction for households or roommates sharing a single list. This app minimizes that barrier: you enter your email once to create a list, get a link by email, and share that link with anyone who needs it. Smart store-area sorting makes the in-store experience faster.

## What Changes

- **New**: Progressive Web App (PWA) installable on mobile and desktop
- **New**: Email-based list creation — enter your email, get a link to your new list
- **New**: Email-based list recovery — enter your email, get all your lists sent to you
- **New**: UUID-based list sharing — possession of the link grants full access
- **New**: Real-time sync via SSE — changes from any device appear immediately on all connected devices
- **New**: Grocery item entry with autocomplete from personal purchase history and a curated common-items dictionary
- **New**: Automatic store-area classification (produce, dairy, bakery, frozen, etc.) for each item when added
- **New**: Manual override for store area on any item
- **New**: Items sorted and grouped by store area within the list
- **New**: Offline support — view list and queue add/check/delete mutations while offline

## Capabilities

### New Capabilities

- `list-management`: Create lists via email, access via UUID URL, recover lost links by email
- `item-entry`: Add, edit, check off, and delete grocery items within a list
- `item-autocomplete`: Suggest items while typing from personal history and a common grocery items dictionary
- `store-area-classification`: Automatically assign a store area to each item using a local classification heuristic; allow manual override

### Modified Capabilities

<!-- none -->

## Impact

- **Frontend**: React + Vite PWA (TypeScript); service worker for offline support and mutation queuing
- **Backend**: Single Bun process — Hono handles API routes, SSE, and serves the built React SPA
- **Data**: SQLite via `bun:sqlite`; common grocery dictionary bundled client-side; per-list history stored server-side
- **Email**: Resend for transactional email (list creation link, list recovery)
- **Dependencies**: Resend API key required; no other external services
- **Security**: Email stored as list owner for recovery only; list access is still UUID-based ("security through obscurity")
