## ADDED Requirements

### Requirement: Invite a user to a list
The system SHALL allow a list owner to invite another user by email address. If no account exists for that email, one SHALL be created. The invited user SHALL be added as a member of the list.

#### Scenario: Owner invites a new email
- **WHEN** a list owner submits an email address that has no existing account
- **THEN** the system creates a user record for that email, adds them as a member of the list, and sends them an invitation email

#### Scenario: Owner invites an existing user
- **WHEN** a list owner submits an email address that already has an account
- **THEN** the system adds that user as a member of the list and sends them an invitation email

#### Scenario: Owner invites an already-member email
- **WHEN** a list owner submits an email that is already a member of the list
- **THEN** the system returns an error and does not create a duplicate membership

#### Scenario: Non-owner cannot invite
- **WHEN** a list member who is not the owner attempts to invite another user
- **THEN** the system returns a 403 Forbidden response

### Requirement: Access control by membership
The system SHALL restrict list read and write access to authenticated users who are members (owner or member role) of that list.

#### Scenario: Member accesses their list
- **WHEN** an authenticated user who is a member of a list requests it
- **THEN** the system returns the list data

#### Scenario: Non-member attempts to access a list
- **WHEN** an authenticated user who is not a member of a list attempts to access it
- **THEN** the system returns 403 Forbidden

#### Scenario: Unauthenticated access denied
- **WHEN** a request to any list endpoint arrives without a valid session
- **THEN** the system returns 401 Unauthorized

### Requirement: View list members
The system SHALL allow any list member to see the list of current members and their roles.

#### Scenario: Member views the member list
- **WHEN** an authenticated list member opens the members view
- **THEN** the system displays each member's email address and role (owner or member)

### Requirement: Remove a member
The system SHALL allow a list owner to remove any member (except themselves) from the list.

#### Scenario: Owner removes a member
- **WHEN** a list owner removes a member
- **THEN** that user is removed from list_members and loses access to the list

#### Scenario: Owner cannot remove themselves
- **WHEN** a list owner attempts to remove themselves
- **THEN** the system returns an error
