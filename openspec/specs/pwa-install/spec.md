## Requirements

### Requirement: Add to Home Screen opens the page the user was on
When a user installs the app via "Add to Home Screen", the created shortcut SHALL open the URL the user was viewing at install time, not a fixed root URL.

#### Scenario: Installing from a list page opens that list
- **WHEN** a user taps "Add to Home Screen" while viewing a list page (e.g. `/list/abc123`)
- **THEN** the installed shortcut SHALL open `/list/abc123` when launched

#### Scenario: Installing from the home page opens the home page
- **WHEN** a user taps "Add to Home Screen" while on the root page (`/`)
- **THEN** the installed shortcut SHALL open `/`
