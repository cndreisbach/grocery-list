## MODIFIED Requirements

### Requirement: Automatically classify items into store areas
The system SHALL assign a store area to each item when it is added, using a client-side classification heuristic against the active store type's dictionary (fetched from the API and cached) and the list's item history.

Store areas are defined by the list's store type and are not a fixed global set.

#### Scenario: Known item classified correctly
- **WHEN** a user adds an item whose name (after normalization) exactly matches an entry in the store type's dictionary
- **THEN** the item is assigned the store area from that dictionary entry

#### Scenario: Matching is case-insensitive after normalization
- **WHEN** a user adds an item whose capitalization differs from matching history or dictionary entries
- **THEN** classification uses the same result as it would for the equivalent lowercase normalized name

#### Scenario: Item classified from contained known phrase
- **WHEN** a user adds an item whose normalized name does not exactly match history or the dictionary, but contains a known history or dictionary phrase as whole words
- **THEN** the item is assigned the store area of the best contained match before typo-style fuzzy matching is attempted

#### Scenario: More specific contained phrase wins
- **WHEN** a user adds an item whose normalized name contains multiple known phrases that map to different store areas
- **THEN** the item is assigned the store area of the most specific contained phrase

#### Scenario: Near-match item classified by fuzzy matching
- **WHEN** a user adds an item whose normalized name has no exact or contained phrase match but is within edit distance 2 of a known entry
- **THEN** the item is assigned the store area of the closest fuzzy match

#### Scenario: Unknown item defaults to Other
- **WHEN** a user adds an item that matches nothing in history or the dictionary
- **THEN** the item is assigned the store area "Other"

#### Scenario: Classification accuracy target
- **WHEN** measured against a representative set of 100 common grocery items on a grocery list
- **THEN** the automatic classification SHALL be correct for at least 90 items

#### Scenario: Dictionary loaded from API before classification
- **WHEN** a user opens a list and adds an item
- **THEN** classification SHALL use the dictionary fetched from `GET /api/store-types/:id/dictionary` for the list's store type, not a bundled static file
