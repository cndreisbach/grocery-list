## ADDED Requirements

### Requirement: Run tests on push to main
The system SHALL automatically run the full test suite on every push to the `main` branch via GitHub Actions.

#### Scenario: Tests pass
- **WHEN** a commit is pushed to `main` and all tests pass
- **THEN** the CI job SHALL complete successfully and the deploy job SHALL proceed

#### Scenario: Tests fail
- **WHEN** a commit is pushed to `main` and one or more tests fail
- **THEN** the CI job SHALL fail, the deploy job SHALL NOT run, and GitHub SHALL notify the author by email

### Requirement: Deploy to CapRover after passing tests
The system SHALL automatically deploy to CapRover when the test job succeeds on `main`.

#### Scenario: Successful deploy
- **WHEN** the test job passes on `main`
- **THEN** the deploy job SHALL invoke the CapRover CLI with the configured app name, server URL, and credentials, and CapRover SHALL build and deploy the new image

#### Scenario: Deploy failure does not affect running app
- **WHEN** the deploy job fails (e.g., CapRover unreachable)
- **THEN** the previously deployed container SHALL continue running and GitHub SHALL notify the author by email

### Requirement: Credentials stored as repository secrets
The system SHALL use GitHub repository secrets for all CapRover credentials and SHALL NOT hardcode any credentials in workflow files or source code.

#### Scenario: Secrets injected at runtime
- **WHEN** the deploy job runs
- **THEN** `CAPROVER_URL`, `CAPROVER_APP`, and `CAPROVER_PASSWORD` SHALL be read from GitHub repository secrets and passed to the CLI via environment or flags
