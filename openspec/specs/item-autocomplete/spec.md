## Requirements

### Requirement: Suggest items while typing
The system SHALL display autocomplete suggestions as the user types in the item entry field, drawn from personal purchase history and a bundled common-items dictionary. The presentation SHALL adapt to the primary input device: touch devices SHALL show horizontal suggestion chips; pointer devices SHALL show a vertical dropdown.

#### Scenario: Suggestions appear after first character
- **WHEN** a user types at least one character into the item entry field
- **THEN** the system displays up to 8 suggestions matching the typed prefix (case-insensitive)

#### Scenario: No suggestions for unrecognized input
- **WHEN** a user types text that matches no history entries and no dictionary entries
- **THEN** no suggestions are shown

#### Scenario: User selects a suggestion on a touch device
- **WHEN** a user taps a suggestion chip on a touch device (`pointer: coarse`)
- **THEN** the item is immediately added to the list and the input is cleared

#### Scenario: User selects a suggestion on a pointer device
- **WHEN** a user clicks a suggestion in the dropdown on a pointer device (`pointer: fine`)
- **THEN** the item is immediately added to the list and the input is cleared

#### Scenario: Touch device shows chips, not a dropdown
- **WHEN** the primary input device is touch (`pointer: coarse`) and suggestions are available
- **THEN** suggestions are displayed as horizontal chips below the input field, not as a vertical dropdown

#### Scenario: Pointer device shows dropdown, not chips
- **WHEN** the primary input device is a pointer (`pointer: fine`) and suggestions are available
- **THEN** suggestions are displayed as a vertical dropdown below the input field

#### Scenario: Chips show item name only
- **WHEN** suggestions are displayed as chips on a touch device
- **THEN** each chip displays the item name only, without a store area label

### Requirement: Keyboard navigation of suggestions (pointer devices)
On pointer devices, the system SHALL support full keyboard navigation of the autocomplete dropdown.

#### Scenario: Arrow key navigation
- **WHEN** the dropdown is visible and the user presses ArrowDown or ArrowUp
- **THEN** the active suggestion advances or retreats by one, and the active item is visually highlighted

#### Scenario: Tab cycles forward through suggestions
- **WHEN** the dropdown is visible and the user presses Tab
- **THEN** the active suggestion advances by one

#### Scenario: Tab on last suggestion dismisses dropdown
- **WHEN** the last suggestion is active and the user presses Tab
- **THEN** the dropdown is dismissed and native Tab focus behavior proceeds

#### Scenario: Shift+Tab cycles backward
- **WHEN** the dropdown is visible and the user presses Shift+Tab
- **THEN** the active suggestion retreats by one

#### Scenario: Enter selects active suggestion
- **WHEN** a suggestion is active and the user presses Enter
- **THEN** the active suggestion is added to the list and the input is cleared

#### Scenario: Escape dismisses dropdown
- **WHEN** the dropdown is visible and the user presses Escape
- **THEN** the dropdown is dismissed and no item is added

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
