## ADDED Requirements

### Requirement: Automatically classify items into store areas
The system SHALL assign a store area to each item when it is added, using a client-side classification heuristic against the bundled common-items dictionary.

Store areas: Produce, Dairy, Bakery, Meat & Seafood, Frozen, Pantry, Beverages, Snacks, Household, Personal Care, Other.

#### Scenario: Known item classified correctly
- **WHEN** a user adds an item whose name (after normalization) matches an entry in the common-items dictionary
- **THEN** the item is assigned the store area from the dictionary entry

#### Scenario: Near-match item classified by fuzzy matching
- **WHEN** a user adds an item whose normalized name does not exactly match any dictionary entry but is within edit distance 2 of one
- **THEN** the item is assigned the store area of the closest dictionary match

#### Scenario: Unknown item defaults to Other
- **WHEN** a user adds an item that matches nothing in the dictionary
- **THEN** the item is assigned the store area "Other"

#### Scenario: Classification accuracy target
- **WHEN** measured against a representative set of 100 common grocery items
- **THEN** the automatic classification SHALL be correct for at least 90 items

### Requirement: Items are grouped and sorted by store area
The system SHALL display list items grouped under their store area, with groups sorted in a logical store-traversal order.

#### Scenario: Items grouped by area
- **WHEN** a list contains items from multiple store areas
- **THEN** items are displayed under their respective store area headings

#### Scenario: Consistent group ordering
- **WHEN** a list is displayed
- **THEN** store area groups appear in a fixed order approximating a typical store layout (e.g., Produce → Dairy → Bakery → Meat & Seafood → Frozen → Pantry → Beverages → Snacks → Household → Personal Care → Other)

### Requirement: Manual store area override
The system SHALL allow a user to change the store area of any item.

#### Scenario: User overrides store area
- **WHEN** a user selects a different store area from the item's area picker
- **THEN** the item is moved to the selected store area group and the override is persisted

#### Scenario: Override survives rename
- **WHEN** a user renames an item that has a manually overridden store area
- **THEN** the store area is NOT re-classified; the manual override is preserved

#### Scenario: Override flag visible
- **WHEN** an item has a manually overridden store area
- **THEN** the UI indicates that the area was manually set (e.g., a small edit icon or label)

### Requirement: History-informed classification for returning items
The system SHALL use the store area from an item's purchase history (if available) as the classification result, taking precedence over the dictionary lookup.

#### Scenario: History match used for classification
- **WHEN** a user adds an item whose name matches an entry in the list's purchase history
- **THEN** the item is assigned the store area stored in the history entry, not the dictionary default
