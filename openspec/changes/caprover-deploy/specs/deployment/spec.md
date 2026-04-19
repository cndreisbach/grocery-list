## ADDED Requirements

### Requirement: App is deployable to CapRover via CLI
The system SHALL be deployable to a CapRover instance using the `caprover deploy` CLI command from the project root.

#### Scenario: Deploy bundle excludes large unnecessary directories
- **WHEN** `caprover deploy` is run
- **THEN** the uploaded bundle SHALL NOT include `node_modules/`, `dist/`, or `*.db` files

#### Scenario: Docker build succeeds with Bun 1.2 lockfile
- **WHEN** CapRover builds the Docker image
- **THEN** the `bun.lock` file SHALL be copied into the build context and `--frozen-lockfile` SHALL succeed

### Requirement: Database persists across container restarts
The system SHALL store the SQLite database on a CapRover persistent volume so that data survives container restarts and redeploys.

#### Scenario: Database path is configurable
- **WHEN** the `DB_PATH` environment variable is set
- **THEN** the application SHALL use that path for the SQLite database file

#### Scenario: Database survives redeploy
- **WHEN** a new version of the app is deployed to CapRover
- **THEN** all existing lists and items SHALL remain accessible

### Requirement: App is reachable at its configured domain
The system SHALL be accessible at the URL specified by the `APP_URL` environment variable, with HTTPS provided by CapRover.

#### Scenario: Email links use the correct domain
- **WHEN** the app sends a list-created or recovery email
- **THEN** all links in the email SHALL use the `APP_URL` value
