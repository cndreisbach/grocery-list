## 1. Backend

- [x] 1.1 Add `DELETE /api/lists/:id` route to `src/routes/lists.ts` — return 403 if `getMemberRole` is not `owner`, delete the list, broadcast `list_deleted`

## 2. API Client

- [x] 2.1 Add `deleteList(id: string)` to `client/src/lib/api.ts`

## 3. Dashboard UI

- [x] 3.1 Add a delete button to owner list rows in `DashboardPage.tsx` (hidden for member rows)
- [x] 3.2 Implement inline confirmation state: clicking delete replaces the row with "Delete [name]? [Yes] [No]"
- [x] 3.3 On confirm: call `api.deleteList`, invalidate `my-lists` query

## 4. Real-time Notification

- [x] 4.1 Add `list_deleted` SSE handler in `ListPage.tsx` that invalidates `['list', id]` query, causing the page to show the existing "List not found" error state

## 5. Tests

- [x] 5.1 Add `DELETE /api/lists/:id` tests to `src/routes/lists.test.ts`: owner deletes successfully (200, list + items gone), non-owner gets 403, unauthenticated gets 401
