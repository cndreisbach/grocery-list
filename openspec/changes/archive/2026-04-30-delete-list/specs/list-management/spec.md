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

#### Scenario: Unknown or deleted list URL accessed
- **WHEN** an authenticated user navigates to `/list/[uuid]` for a UUID that does not exist or has been deleted
- **THEN** the system displays a "List not found" message with an option to return to the dashboard
