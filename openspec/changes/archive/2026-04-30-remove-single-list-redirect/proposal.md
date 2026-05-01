## Why

The dashboard auto-redirects users to their list when they have exactly one. This means a user with one list can never reach the dashboard to create a second list — the create-list form is unreachable.

## What Changes

- Remove the auto-redirect from the dashboard when the user has exactly one list
- The dashboard is always shown, regardless of how many lists the user has

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `user-accounts`: The "User dashboard" requirement no longer includes the single-list redirect behavior

## Impact

- `client/src/pages/DashboardPage.tsx`: remove the `useEffect` that navigates when `lists.length === 1`
- `openspec/specs/user-accounts/spec.md`: update the requirement and remove the single-list scenario
