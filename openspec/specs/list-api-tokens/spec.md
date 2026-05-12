### Requirement: Owner can create a named API token for a list
The system SHALL allow a list owner to create an API token scoped to a specific list. The token name SHALL be required. The generated token SHALL use the format `glk_<random>` and SHALL be returned in full exactly once, at creation time. It SHALL NOT be returned in any subsequent response. The last 4 characters of the token SHALL be stored and returned for identification purposes.

#### Scenario: Owner creates a token with a valid name
- **WHEN** a list owner submits a POST to `/api/lists/:id/tokens` with a non-empty `name`
- **THEN** the system creates a token record, returns the full token value and its metadata (id, name, last 4 chars, created_at), and responds with 201

#### Scenario: Owner attempts to create a token without a name
- **WHEN** a list owner submits a POST to `/api/lists/:id/tokens` with a missing or empty `name`
- **THEN** the system returns 400 Bad Request

#### Scenario: Non-owner cannot create a token
- **WHEN** a list member who is not the owner attempts to create a token
- **THEN** the system returns 403 Forbidden

#### Scenario: Unauthenticated request cannot create a token
- **WHEN** a POST to `/api/lists/:id/tokens` arrives without a valid session cookie
- **THEN** the system returns 401 Unauthorized

### Requirement: Owner can list tokens for a list
The system SHALL allow a list owner to retrieve all tokens for a list. The response SHALL include each token's id, name, last 4 characters, created_at, and last_used_at. The full token value SHALL NOT be included.

#### Scenario: Owner lists tokens
- **WHEN** a list owner sends a GET to `/api/lists/:id/tokens`
- **THEN** the system returns an array of token metadata records, without the full token value

#### Scenario: Non-owner cannot list tokens
- **WHEN** a list member who is not the owner requests the token list
- **THEN** the system returns 403 Forbidden

### Requirement: Owner can revoke a token
The system SHALL allow a list owner to delete (revoke) any token for their list.

#### Scenario: Owner revokes a token
- **WHEN** a list owner sends a DELETE to `/api/lists/:id/tokens/:tokenId`
- **THEN** the system deletes the token record and returns 204 No Content

#### Scenario: Revoking a non-existent token
- **WHEN** a list owner sends a DELETE for a token ID that does not exist on their list
- **THEN** the system returns 404 Not Found

#### Scenario: Non-owner cannot revoke a token
- **WHEN** a list member who is not the owner attempts to revoke a token
- **THEN** the system returns 403 Forbidden

### Requirement: last_used_at is tracked per token
The system SHALL record the timestamp of the most recent authenticated request made with each token. The initial value SHALL be NULL (never used).

#### Scenario: Token used for the first time
- **WHEN** a token authenticates a request for the first time
- **THEN** `last_used_at` is set to the current timestamp

#### Scenario: Token used again
- **WHEN** a token that has been used before authenticates another request
- **THEN** `last_used_at` is updated to the current timestamp

### Requirement: Token management UI in MembersPanel
The system SHALL display an "API Tokens" section in the MembersPanel for list owners. The section SHALL list existing tokens (name, last 4 chars, last_used_at) with a revoke button each. It SHALL provide an inline form to create a new token by name. Upon creation, the full token SHALL be shown once with a copy button and a "save this — it won't be shown again" message.

#### Scenario: Owner views token list
- **WHEN** a list owner opens the MembersPanel
- **THEN** an "API Tokens" section is visible showing all tokens with name, last 4 chars, and last used info

#### Scenario: Owner creates a token via UI
- **WHEN** a list owner enters a name and submits the create token form
- **THEN** the system displays the full token with a copy button and a one-time warning

#### Scenario: Owner dismisses token reveal
- **WHEN** the owner clicks Done after copying the token
- **THEN** the panel returns to the token list and the full token is no longer displayed

#### Scenario: Token management hidden from non-owners
- **WHEN** a list member who is not the owner opens the MembersPanel
- **THEN** the API Tokens section is not displayed
