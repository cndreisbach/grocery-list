## MODIFIED Requirements

### Requirement: Access a list via URL
The system SHALL grant access to a grocery list only to authenticated users who are members of that list. Possessing the UUID URL is not sufficient without a valid session and membership.

#### Scenario: Authenticated member accesses list URL
- **WHEN** an authenticated list member navigates to `/list/[uuid]`
- **THEN** the system displays the list with all its items, grouped by the store type's areas in their defined order

#### Scenario: Unauthenticated user accesses list URL
- **WHEN** a visitor without a valid session navigates to `/list/[uuid]`
- **THEN** the system redirects them to the login page

#### Scenario: Authenticated non-member accesses list URL
- **WHEN** an authenticated user who is not a member of the list navigates to `/list/[uuid]`
- **THEN** the system displays a "Not found or access denied" message

#### Scenario: Unknown list URL accessed
- **WHEN** an authenticated user navigates to `/list/[uuid]` for a UUID that does not exist
- **THEN** the system displays a "List not found" message with an option to return to the dashboard

## REMOVED Requirements

### Requirement: Create a new grocery list via email
**Reason**: List creation is now handled by authenticated users from the dashboard. The unauthenticated "create list with email" flow is replaced by account-based list creation.
**Migration**: Users create lists from the dashboard after logging in.

### Requirement: Recover lost list links via email
**Reason**: The dashboard shows all lists for an authenticated user, making email recovery unnecessary.
**Migration**: Users access their lists by logging in and viewing the dashboard.
