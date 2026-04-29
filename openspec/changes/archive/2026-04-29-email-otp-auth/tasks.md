## 1. Database Schema

- [x] 1.1 Add `users`, `sessions`, `otp_codes`, and `list_members` tables to `src/db.ts` as a new migration (user_version bump)
- [x] 1.2 Write the auto-adoption query: on user creation, insert into `list_members` for any existing `lists.owner_email` match

## 2. Auth Backend

- [x] 2.1 Create `src/routes/auth.ts` with `POST /api/auth/request-otp` — validate email, upsert user, generate + store OTP, send email via Resend
- [x] 2.2 Create `POST /api/auth/verify-otp` — validate code (expiry, used, attempt limit), create session token, set HttpOnly cookie, return user
- [x] 2.3 Create `POST /api/auth/logout` — delete session, clear cookie
- [x] 2.4 Create `GET /api/auth/me` — return current user from session (used by frontend to check auth state)
- [x] 2.5 Create `src/middleware/auth.ts` — read `session` cookie, resolve to user, attach to context; return 401 if missing/invalid
- [x] 2.6 Implement OTP rate limiting: max 3 sends per email per 10 min, max 5 verification attempts per OTP
- [x] 2.7 Add OTP email template to `src/email.ts`

## 3. List Access Control

- [x] 3.1 Apply auth middleware to all routes under `/api/lists/*`
- [x] 3.2 Add membership check helper: given `listId` + `userId`, return role or null
- [x] 3.3 Gate `GET /api/lists/:id` behind membership check (return 403 if not member)
- [x] 3.4 Gate all mutating list endpoints (`PATCH`, item routes) behind membership check

## 4. List Membership Backend

- [x] 4.1 Create `POST /api/lists/:id/members` — owner-only; upsert user by email, insert into `list_members`, send invite email
- [x] 4.2 Create `GET /api/lists/:id/members` — return member list (email + role) for list members
- [x] 4.3 Create `DELETE /api/lists/:id/members/:userId` — owner-only; remove member; reject if target is owner

## 5. User Dashboard Backend

- [x] 5.1 Create `GET /api/users/me/lists` — return all lists where the current user is a member (name, id, role)
- [x] 5.2 Update `POST /api/lists` — require auth; create list and insert creator as owner into `list_members`; remove email body param

## 6. Frontend: Auth Flow

- [x] 6.1 Create `LoginPage` component: email input → OTP code input (two-step form), calls `/api/auth/request-otp` then `/api/auth/verify-otp`
- [x] 6.2 Create auth context / hook (`useAuth`) that calls `GET /api/auth/me` and exposes user state + logout
- [x] 6.3 Create `ProtectedRoute` wrapper that redirects to login if unauthenticated
- [x] 6.4 Add logout button to list page header

## 7. Frontend: Dashboard

- [x] 7.1 Create `DashboardPage`: fetch `/api/users/me/lists`; if 1 list redirect immediately; if 0 show create prompt; else show list
- [x] 7.2 Implement create-list form on dashboard (name input, calls `POST /api/lists`)
- [x] 7.3 Update routing in `App.tsx`: `/` → `LoginPage` (unauthed) or `DashboardPage` (authed); wrap `/list/:id` in `ProtectedRoute`

## 8. Frontend: List Members UI

- [x] 8.1 Add members panel to `ListPage`: show current members (email + role)
- [x] 8.2 Add invite-by-email form to members panel (owner only); calls `POST /api/lists/:id/members`
- [x] 8.3 Add remove-member button for each non-owner member (owner only); calls `DELETE /api/lists/:id/members/:userId`

## 9. Cleanup

- [x] 9.1 Remove the old `Home.tsx` create/recover flow and its associated `POST /api/lists` email param and `POST /api/recover` route
- [x] 9.2 Update `src/routes/lists.ts` share button — share URL still works but now requires login to view
