## ADDED Requirements

### Requirement: Suggest items while typing
The system SHALL display autocomplete suggestions as the user types in the item entry field, drawn from personal purchase history and a bundled common-items dictionary.

#### Scenario: Suggestions appear after first character
- **WHEN** a user types at least one character into the item entry field
- **THEN** the system displays up to 8 suggestions matching the typed prefix (case-insensitive)

#### Scenario: No suggestions for unrecognized input
- **WHEN** a user types text that matches no history entries and no dictionary entries
- **THEN** no suggestion dropdown is shown

#### Scenario: User selects a suggestion
- **WHEN** a user taps or clicks a suggestion
- **THEN** the suggestion text is placed in the input field and the item is added to the list

### Requirement: Rank suggestions by relevance
The system SHALL rank autocomplete suggestions so that recently and frequently used personal history items appear before generic dictionary entries.

#### Scenario: History items ranked above dictionary
- **WHEN** both a history item and a dictionary item match the typed prefix
- **THEN** the history item appears higher in the suggestion list

#### Scenario: More recently used items ranked higher
- **WHEN** multiple history items match the typed prefix
- **THEN** items used more recently appear higher in the suggestion list

### Requirement: Populate history from added items
The system SHALL record each item added to a list in that list's purchase history, including the resolved store area.

#### Scenario: Item added to history on creation
- **WHEN** a user adds an item to the list
- **THEN** the item name and store area are saved to the list's history with the current timestamp

#### Scenario: History entry updated on re-add
- **WHEN** a user adds an item whose name already exists in the list's history
- **THEN** the history entry's timestamp is updated to now (not duplicated)

### Requirement: Bundled common-items dictionary
The system SHALL ship with a bundled dictionary of at least 300 common grocery item names with associated store areas, used for both autocomplete suggestions and initial store-area classification.

#### Scenario: Dictionary available offline
- **WHEN** the device has no network connectivity
- **THEN** autocomplete suggestions from the dictionary are still available
