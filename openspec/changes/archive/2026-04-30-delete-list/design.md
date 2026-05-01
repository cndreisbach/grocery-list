## Context

The app has `list_members` with a `role` column (`owner` | `member`). `getMemberRole()` already exists and is used by all list routes. Items and members cascade-delete when a list is deleted (`ON DELETE CASCADE`). The frontend already receives `user_role` on every list fetch and on the dashboard's list summary. SSE broadcasting via `broadcast()` is already used for real-time list updates.

## Goals / Non-Goals

**Goals:**
- Allow list owners to permanently delete their lists
- Enforce owner-only authorization on the backend
- Notify active viewers in real time so they see a coherent "not found" state

**Non-Goals:**
- Soft delete / trash / undo
- Transferring ownership before deletion
- Bulk delete

## Decisions

**Authorization: check `list_members.role`, not `lists.owner_email`**
The app already uses `getMemberRole()` everywhere. Using `owner_email` would introduce a second authorization path. Consistent with existing patterns.

**SSE event triggers query invalidation, not a redirect**
`ListPage` already shows a clean "List not found" error page when its query fails. Invalidating the query causes a refetch that returns 403, which naturally hits the existing error state. No special "deleted" UI needed. This reuses proven code and keeps the SSE handler trivial.

**Inline two-step confirm on the dashboard, not a modal**
Mobile-first PWA. An inline "Delete? [Yes] [No]" replacement for the row avoids browser dialogs and native modal complexity. State is local to the component (`deletingId`).

**No tombstone table**
A user navigating to a stale bookmarked list URL gets the existing "List not found" page. Distinguishing "deleted" from "never existed" has marginal UX value and requires schema changes.

## Risks / Trade-offs

Race condition: two owners simultaneously — not possible; only one user holds the `owner` role per list.

Accidental delete: mitigated by the inline confirmation step. No undo is provided (non-goal).

Members currently on the list page will see the error page after invalidation. This is intentional and consistent with the existing error state. → Acceptable; the SSE event ensures they're not left on a broken page indefinitely.
