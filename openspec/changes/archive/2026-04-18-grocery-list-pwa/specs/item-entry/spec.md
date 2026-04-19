## ADDED Requirements

### Requirement: Add an item to the list
The system SHALL allow a user to add a grocery item by typing its name into an input field and submitting.

#### Scenario: User adds a new item
- **WHEN** a user types an item name and presses Enter or taps "Add"
- **THEN** the item is added to the list, automatically assigned a store area, and displayed in the correct store-area group

#### Scenario: Duplicate item name
- **WHEN** a user adds an item with a name that already exists (case-insensitive) in the list
- **THEN** the system SHALL warn the user that the item already exists and ask for confirmation before adding

#### Scenario: Empty item name rejected
- **WHEN** a user attempts to submit an empty or whitespace-only item name
- **THEN** the item is not added and the input field is focused

### Requirement: Check off an item
The system SHALL allow a user to mark an item as purchased (checked). Checked items SHALL remain visible in the list with a strikethrough until explicitly removed.

#### Scenario: User checks an item
- **WHEN** a user taps or clicks the checkbox for an item
- **THEN** the item is marked as checked, rendered with a strikethrough and muted styling, and remains in its store-area group

#### Scenario: Checked item stays in place
- **WHEN** one or more items are checked
- **THEN** they remain visible within their store-area group (not moved or hidden) until the user removes them

#### Scenario: User unchecks an item
- **WHEN** a user taps or clicks the checkbox of a checked item
- **THEN** the item is marked as unchecked and returns to normal appearance

### Requirement: Remove checked items
The system SHALL allow a user to delete all checked items at once via a single action.

#### Scenario: User removes checked items
- **WHEN** a user taps "Remove checked items" and confirms
- **THEN** all currently checked items are permanently deleted from the list

#### Scenario: Remove checked is unavailable when no items are checked
- **WHEN** no items on the list are checked
- **THEN** the "Remove checked items" action is disabled or not shown

### Requirement: Delete an item
The system SHALL allow a user to remove a single item from the list regardless of its checked state.

#### Scenario: User deletes an item
- **WHEN** a user activates the delete action for an item (e.g., swipe or button)
- **THEN** the item is permanently removed from the list

### Requirement: Edit an item's name
The system SHALL allow a user to rename an existing item.

#### Scenario: User renames an item
- **WHEN** a user taps an item name to edit and submits a new name
- **THEN** the item name is updated and the store area is re-classified based on the new name (unless the store area was manually overridden)

### Requirement: Offline mutation queuing
The system SHALL queue item mutations made while offline and replay them when connectivity is restored.

#### Scenario: User adds an item while offline
- **WHEN** a user adds an item while the device has no network connectivity
- **THEN** the item appears optimistically in the list, is stored in the offline queue, and is persisted to the server once connectivity is restored

#### Scenario: User checks an item while offline
- **WHEN** a user checks or unchecks an item while the device has no network connectivity
- **THEN** the change is reflected immediately in the UI, queued, and synced to the server on reconnect

#### Scenario: User deletes an item while offline
- **WHEN** a user deletes an item while the device has no network connectivity
- **THEN** the item is removed from the UI immediately, the deletion is queued, and synced to the server on reconnect
