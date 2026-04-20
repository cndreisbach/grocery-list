## MODIFIED Requirements

### Requirement: Automatically classify items into store areas
The system SHALL assign a store area to each item when it is added, using a client-side classification heuristic against the bundled common-items dictionary and the list's item history.

#### Scenario: Known item classified correctly
- **WHEN** a user adds an item whose name (after normalization) exactly matches an entry in the common-items dictionary
- **THEN** the item is assigned the store area from the dictionary entry

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
- **THEN** the item is assigned the store area `Other`

### Requirement: History-informed classification for returning items
The system SHALL use the store area from an item's purchase history (if available) as the classification result, taking precedence over the dictionary lookup and later fallback heuristics.

#### Scenario: Exact history match used for classification
- **WHEN** a user adds an item whose normalized name exactly matches an entry in the list's purchase history
- **THEN** the item is assigned the store area stored in the history entry, not the dictionary default or any contained phrase match
