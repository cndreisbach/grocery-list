### Requirement: Bearer token authenticates programmatic item requests
The system SHALL accept an `Authorization: Bearer <token>` header on `/api/token/` routes. A valid token SHALL resolve to its associated list. An invalid or missing token SHALL return 401 Unauthorized. The token's `last_used_at` SHALL be updated on each authenticated request.

#### Scenario: Valid token authenticates request
- **WHEN** a request to `/api/token/items` includes `Authorization: Bearer glk_<valid>`
- **THEN** the system resolves the associated list and processes the request

#### Scenario: Invalid token is rejected
- **WHEN** a request to `/api/token/items` includes an unrecognized token value
- **THEN** the system returns 401 Unauthorized

#### Scenario: Missing Authorization header is rejected
- **WHEN** a request to `/api/token/items` arrives with no Authorization header
- **THEN** the system returns 401 Unauthorized

### Requirement: Programmatic API can list items on a list
The system SHALL provide `GET /api/token/items` that returns all items for the token's associated list.

#### Scenario: List items via token
- **WHEN** a valid Bearer token is used to GET `/api/token/items`
- **THEN** the system returns all items for the token's list in the same format as the human API

### Requirement: Programmatic API can add an item to a list
The system SHALL provide `POST /api/token/items` that adds a new item to the token's associated list. The `name` field SHALL be required. The `store_area` field SHALL be optional and default to `Other` if omitted.

#### Scenario: Add an item with name only
- **WHEN** a valid Bearer token is used to POST `/api/token/items` with `{ "name": "milk" }`
- **THEN** the system creates the item on the token's list with `store_area` defaulting to `Other` and returns 201 with the item

#### Scenario: Add an item with name and store_area
- **WHEN** a valid Bearer token is used to POST `/api/token/items` with `{ "name": "milk", "store_area": "Dairy" }`
- **THEN** the system creates the item with the given store_area and returns 201 with the item

#### Scenario: Add item without a name is rejected
- **WHEN** a valid Bearer token is used to POST `/api/token/items` with a missing or empty `name`
- **THEN** the system returns 400 Bad Request

#### Scenario: Added items trigger real-time broadcast
- **WHEN** an item is added via the token API
- **THEN** the server broadcasts an `item_added` SSE event to connected clients on that list
