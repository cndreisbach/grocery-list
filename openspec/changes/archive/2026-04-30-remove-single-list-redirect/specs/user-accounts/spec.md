## MODIFIED Requirements

### Requirement: User dashboard
The system SHALL show an authenticated user a dashboard listing all lists they own or are a member of.

#### Scenario: User has multiple lists
- **WHEN** an authenticated user navigates to the dashboard
- **THEN** the system displays the name and a link for each list the user owns or is a member of

#### Scenario: User has no lists
- **WHEN** an authenticated user has no lists
- **THEN** the system shows the dashboard with a prompt to create a new list

## REMOVED Requirements

### Requirement: Single-list auto-redirect
**Reason**: Prevented users with one list from reaching the dashboard to create additional lists.
**Migration**: The dashboard is now always shown. Users navigate to their list by clicking it.
