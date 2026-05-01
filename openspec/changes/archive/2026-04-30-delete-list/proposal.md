## Why

Users have no way to remove lists they no longer need. The dashboard accumulates stale lists with no cleanup path.

## What Changes

- Owners can delete a list from the dashboard via an inline confirmation flow
- Non-owners (members) do not see the delete affordance
- `DELETE /api/lists/:id` endpoint enforces owner-only authorization
- Active viewers of a deleted list see the existing "List not found" error page via SSE-triggered query invalidation

## Capabilities

### New Capabilities

- `list-deletion`: Owner-only delete action on the dashboard with inline confirmation, backend enforcement, and real-time notification to active viewers via SSE

### Modified Capabilities

- `list-management`: Adding delete as a new list lifecycle operation

## Impact

- `src/routes/lists.ts`: new `DELETE /:id` route
- `src/broadcast.ts`: new `list_deleted` event type
- `client/src/pages/DashboardPage.tsx`: inline confirm UI, delete API call
- `client/src/pages/ListPage.tsx`: SSE handler for `list_deleted` event
- `client/src/lib/api.ts`: new `deleteList` function
