## ADDED Requirements

### Requirement: Store types define area vocabulary for lists
The system SHALL maintain a set of store types in the database. Each store type defines a name, an ordered list of store areas, and a classification dictionary mapping item names to areas.

#### Scenario: Store type areas are distinct per type
- **WHEN** a list is associated with a store of type "home-depot"
- **THEN** the areas available for that list SHALL be the Home Depot area set, not the grocery area set

#### Scenario: Area order reflects store traversal
- **WHEN** items on a list are displayed grouped by area
- **THEN** area groups SHALL appear in the order defined by the store type's `area_order`

### Requirement: Store instances are associated with a store type
The system SHALL maintain store instances (e.g., "Grocery Store", "Home Depot", "Costco"), each referencing a store type. Lists reference a store instance.

#### Scenario: Store instance inherits type vocabulary
- **WHEN** a list is assigned to a store instance
- **THEN** the list SHALL use the area set and dictionary of that store's type

### Requirement: Per-store-type classification dictionary is served by the API
The system SHALL expose an endpoint to retrieve the classification dictionary for a store type. The dictionary maps normalized item names to areas within that store type's area set.

#### Scenario: Dictionary endpoint returns correct entries
- **WHEN** a client requests `GET /api/store-types/:id/dictionary`
- **THEN** the response SHALL contain all dictionary entries for that store type as a map of item name to area string

#### Scenario: Unknown store type returns 404
- **WHEN** a client requests the dictionary for a store type ID that does not exist
- **THEN** the server SHALL respond with HTTP 404

### Requirement: All store types are seeded on first startup
The system SHALL seed grocery, home-depot, and costco store types (with their area sets and dictionaries) and corresponding store instances on first startup via schema migration.

#### Scenario: Grocery dictionary migrated from existing data
- **WHEN** the migration runs on a fresh or existing database at schema version 0
- **THEN** all entries from the previous bundled `dictionary.json` SHALL be present in the grocery store type's dictionary

#### Scenario: All existing lists assigned to Grocery Store
- **WHEN** the migration runs on a database that contains existing lists with no store_id
- **THEN** all such lists SHALL be assigned the Grocery Store instance id

#### Scenario: Migration is idempotent via user_version
- **WHEN** the server starts and the database is already at schema version 1
- **THEN** the migration block SHALL NOT run again
