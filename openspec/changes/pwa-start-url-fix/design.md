## Context

The Vite PWA plugin generates a web app manifest from config in `client/vite.config.ts`. The current `start_url: "/"` causes "Add to Home Screen" to always launch the root (`/`). Setting `start_url: "./"` tells browsers to treat the URL the user was on at install time as the launch URL, so a shortcut created from a list page opens that list directly.

## Goals / Non-Goals

**Goals:**
- "Add to Home Screen" from a list page creates a shortcut that opens that list

**Non-Goals:**
- Dynamic manifest generation per page
- Any other manifest changes

## Decisions

**`"./"` over `"/"`**
A relative `"./"` resolves to the current page's URL at install time. An absolute `"/"` always points to the root regardless of what page the user was on. The relative form is the standard recommendation for apps where users install from deep links.

## Risks / Trade-offs

- Users who previously added the app to their home screen from the root will be unaffected (their existing shortcut still works).
- If a user adds from `/` they get a shortcut to `/` — same behavior as before, just not forced.
