## Why

Deployments are currently manual and untested — anyone can push broken code to `main` and deploy it. Automating CI and deployment through GitHub Actions ensures tests always pass before code reaches production and eliminates the need for a local CapRover CLI setup to ship.

## What Changes

- A GitHub Actions workflow is added that runs on every push to `main`
- The test suite (`bun test`) runs as a CI job; failure blocks deployment
- On test success, the workflow deploys to CapRover using the `caprover` CLI with credentials stored as repository secrets
- GitHub's built-in notification system handles failure alerts — no additional tooling needed

## Capabilities

### New Capabilities

- `ci-cd-pipeline`: Automated test-and-deploy workflow via GitHub Actions on push to `main`

### Modified Capabilities

<!-- none -->

## Impact

- New file: `.github/workflows/ci.yml`
- Three repository secrets must be added: `CAPROVER_URL`, `CAPROVER_APP`, `CAPROVER_PASSWORD`
- No changes to application code, Dockerfile, or `captain-definition`
- The existing `mise run deploy` task remains available for manual deploys
