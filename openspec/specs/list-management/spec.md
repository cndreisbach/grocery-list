## ADDED Requirements

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

### Requirement: Lists are associated with a store
The system SHALL associate each list with a store instance. The store determines the area vocabulary and classification dictionary used for that list.

#### Scenario: New list defaults to Grocery Store
- **WHEN** a new list is created
- **THEN** the list SHALL be assigned the Grocery Store instance by default

#### Scenario: Store displayed in list header
- **WHEN** a user views a list
- **THEN** the list header SHALL display a store selector (`<select>`) showing the current store

#### Scenario: User can change the store
- **WHEN** a user selects a different store from the store selector
- **THEN** the list's store is updated and the page reflects the new store's area vocabulary

#### Scenario: Store change reclassifies existing items to Other
- **WHEN** a user changes the store on a list that already has items
- **THEN** all existing items on the list SHALL have their store_area set to "Other"

#### Scenario: Store selector shows all available stores
- **WHEN** a user opens the store selector
- **THEN** all store instances in the database SHALL be listed as options

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
