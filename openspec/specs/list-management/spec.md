## ADDED Requirements

### Requirement: Create a new grocery list via email
The system SHALL allow a user to create a new grocery list by submitting their email address from the home page. The system SHALL email the user a link to the new list and navigate them to it directly.

#### Scenario: User creates a list from the home page
- **WHEN** a user enters a valid email address and activates "Create new list"
- **THEN** the system creates a new list (UUID v4), stores the email as owner, sends an email containing the list URL, and navigates the user to `/list/[uuid]`

#### Scenario: Invalid email rejected
- **WHEN** a user submits a malformed email address
- **THEN** the list is not created and an inline validation error is shown

#### Scenario: UUID is unique
- **WHEN** a new list is created
- **THEN** the generated UUID SHALL NOT collide with any existing list ID

### Requirement: Recover lost list links via email
The system SHALL allow a user to retrieve links to all lists they previously created by submitting their email address.

#### Scenario: User requests their lists
- **WHEN** a user enters their email address and activates "Send me my lists"
- **THEN** the system sends an email to that address containing the name and URL of every list associated with it, and displays a "Check your email" confirmation on the page

#### Scenario: No lists found for email
- **WHEN** a user requests recovery for an email with no associated lists
- **THEN** the system still displays "Check your email" (to avoid email enumeration) and sends no email

### Requirement: Access a list via URL
The system SHALL grant full access to a grocery list to any user who navigates to its UUID URL. No login or verification is required beyond possessing the URL.

#### Scenario: Valid list URL accessed
- **WHEN** a user navigates to `/list/[uuid]` for an existing list
- **THEN** the system displays the list with all its items, grouped by store area

#### Scenario: Unknown list URL accessed
- **WHEN** a user navigates to `/list/[uuid]` for a UUID that does not exist
- **THEN** the system displays a "List not found" message with an option to return to the home page

### Requirement: Share a list
The system SHALL allow a user to share a list by copying its URL.

#### Scenario: User copies the list URL
- **WHEN** a user taps the "Share" or "Copy link" button on a list page
- **THEN** the full URL for the list is copied to the device clipboard

### Requirement: Name a list
The system SHALL allow a user to set or update a human-readable name for a list.

#### Scenario: User sets a list name
- **WHEN** a user edits the list name field and confirms (Enter or blur)
- **THEN** the list name is saved and displayed in the page title

#### Scenario: Default list name
- **WHEN** a new list is created
- **THEN** the list name defaults to "Grocery List"

### Requirement: Real-time sync across devices
The system SHALL propagate changes made on one device to all other devices that have the same list open, in real time, via Server-Sent Events.

#### Scenario: Partner adds an item
- **WHEN** a second device adds an item to a list while another device has the same list open
- **THEN** the new item appears on the first device without a manual refresh, within a few seconds

#### Scenario: SSE reconnects after going offline
- **WHEN** a device loses connectivity and later reconnects
- **THEN** the SSE connection re-establishes and the list is refreshed to reflect any changes made while offline
