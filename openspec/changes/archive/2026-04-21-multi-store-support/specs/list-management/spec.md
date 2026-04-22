## MODIFIED Requirements

### Requirement: Access a list via URL
The system SHALL grant full access to a grocery list to any user who navigates to its UUID URL. No login or verification is required beyond possessing the URL.

#### Scenario: Valid list URL accessed
- **WHEN** a user navigates to `/list/[uuid]` for an existing list
- **THEN** the system displays the list with all its items, grouped by the store type's areas in their defined order

#### Scenario: Unknown list URL accessed
- **WHEN** a user navigates to `/list/[uuid]` for a UUID that does not exist
- **THEN** the system displays a "List not found" message with an option to return to the home page

## ADDED Requirements

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
