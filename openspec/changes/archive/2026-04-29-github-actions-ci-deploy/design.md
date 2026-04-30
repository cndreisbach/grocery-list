## Context

Deployments today require a developer to have the CapRover CLI installed and authenticated locally, then run `mise run deploy` (or `caprover deploy -d`) manually. There are no automated tests run before deploying. This means a broken push to `main` can go to production unchecked.

The repo already has a test suite (`bun test --preload ./src/test/preload.ts src/routes`, 90 tests) and a working Dockerfile and `captain-definition` that CapRover knows how to build.

## Goals / Non-Goals

**Goals:**
- Run the full test suite on every push to `main`
- Block deployment if any test fails
- Automate CapRover deployment when tests pass
- Keep the workflow simple and auditable

**Non-Goals:**
- Pull request CI (only `main` is in scope for now)
- Docker image caching or registry (CapRover builds from source tarball, same as local)
- Slack/email notifications beyond GitHub's built-in failure emails
- Environment-specific deploys (staging, etc.)

## Decisions

### Single workflow file, two jobs

Two jobs — `test` then `deploy` — with `deploy` declaring `needs: test`. This gives clear separation in the GitHub UI and ensures deploy never runs if tests fail.

**Alternative considered**: One job with sequential steps. Rejected because a failed test step still shows the deploy steps as skipped rather than never attempted, which is visually confusing.

### Use `caprover` CLI (not Docker registry push)

The workflow installs the `@caprover/cli` npm package and calls `caprover deploy` with explicit flags, mirroring the local deploy path exactly. CapRover receives the source tarball and builds the Docker image itself.

**Alternative considered**: Build the Docker image in GHA, push to GHCR, then call CapRover's API to deploy from registry. Rejected — adds a Docker registry dependency and registry credentials for no meaningful benefit on a personal project.

### Credentials as repository secrets

`CAPROVER_URL`, `CAPROVER_APP`, and `CAPROVER_PASSWORD` are stored as GitHub repository secrets and injected at runtime. No secrets are hardcoded or committed.

### Failure notifications via GitHub built-ins

GitHub automatically emails the workflow triggerer on failure. No additional notification step is added to the workflow.

## Risks / Trade-offs

- **CapRover downtime blocks deploys** → No mitigation needed; a failed deploy surfaces immediately in GHA and the previous container keeps running.
- **`caprover` CLI version drift** → Pin the CLI version in the workflow (`@caprover/cli@<version>`) to avoid surprises from upstream changes.
- **No deploy on PRs** → Intentional. If PR-based workflows are added later, the `on: push: branches: [main]` trigger can be adjusted.
- **Test suite uses in-memory SQLite** → Already the case; tests are self-contained and require no external services, so GHA runners work without any setup beyond installing Bun.
