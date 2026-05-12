## ADDED Requirements

### Requirement: Token management section in MembersPanel
The MembersPanel SHALL include an "API Tokens" section visible only to list owners, positioned below the members list and invite form. This section is part of the membership management surface because API tokens are a form of access delegation controlled by the owner.

#### Scenario: Owner sees token section
- **WHEN** a list owner opens the MembersPanel
- **THEN** an "API Tokens" section appears below the members and invite UI

#### Scenario: Non-owner does not see token section
- **WHEN** a list member who is not the owner opens the MembersPanel
- **THEN** no "API Tokens" section is visible
