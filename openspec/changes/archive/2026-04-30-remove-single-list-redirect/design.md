## Context

A `useEffect` in `DashboardPage.tsx` calls `navigate()` when `lists.length === 1`. This fires after every fetch, making the dashboard unreachable for single-list users. The corresponding spec in `user-accounts/spec.md` encodes this as intended behavior.

## Goals / Non-Goals

**Goals:**
- Always render the dashboard so users can create additional lists

**Non-Goals:**
- Any other changes to dashboard behavior

## Decisions

**Delete the `useEffect` entirely.** There's no configuration or flag needed — the behavior is simply removed. The spec delta documents the removal.

## Risks / Trade-offs

Users who relied on the shortcut will now see the dashboard instead of going directly to their list. Given the feature was a bug (it blocked creating a second list), this regression is acceptable.
