## ADDED Requirements

### Requirement: User dashboard
The system SHALL show an authenticated user a dashboard listing all lists they own or are a member of. If the user has exactly one list, the system SHALL redirect them directly to that list instead of showing the dashboard.

#### Scenario: User has multiple lists
- **WHEN** an authenticated user navigates to the dashboard
- **THEN** the system displays the name and a link for each list the user owns or is a member of

#### Scenario: User has exactly one list
- **WHEN** an authenticated user has exactly one list
- **THEN** the system redirects them directly to that list page without showing the dashboard

#### Scenario: User has no lists
- **WHEN** an authenticated user has no lists
- **THEN** the system shows the dashboard with a prompt to create a new list

### Requirement: Create a list while authenticated
The system SHALL allow an authenticated user to create a new named list. The user SHALL automatically become the owner of the new list.

#### Scenario: Authenticated user creates a list
- **WHEN** an authenticated user submits a list name
- **THEN** the system creates the list, adds the user as owner in list_members, and navigates to the new list

#### Scenario: Default list name
- **WHEN** a new list is created without a name
- **THEN** the list name defaults to "Grocery List"

### Requirement: Auto-adopt legacy lists
The system SHALL automatically associate any existing lists whose `owner_email` matches the authenticated user's email as owned lists, on that user's first login.

#### Scenario: First login with matching legacy lists
- **WHEN** a user logs in for the first time and existing lists have `owner_email` matching their email
- **THEN** those lists are inserted into `list_members` with role 'owner' for that user

#### Scenario: Subsequent logins do not duplicate adoption
- **WHEN** a user logs in again after adoption has already occurred
- **THEN** no duplicate `list_members` rows are created

#### Scenario: No matching legacy lists
- **WHEN** a user logs in and no lists have a matching `owner_email`
- **THEN** no adoption occurs and the user starts with an empty list of lists

### Requirement: Protected route redirect
The system SHALL redirect unauthenticated users who attempt to access any protected page (dashboard, list page) to the login page.

#### Scenario: Unauthenticated access to protected page
- **WHEN** a visitor without a valid session navigates to a protected route
- **THEN** the system redirects them to the login page
