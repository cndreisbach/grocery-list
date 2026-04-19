## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Store area shown in dropdown suggestions
**Reason**: The store area label in suggestions added visual noise without meaningful value — the area is displayed automatically once the item is added to the list.
**Migration**: No migration needed; this is a display-only removal. Store area classification behavior is unchanged.
