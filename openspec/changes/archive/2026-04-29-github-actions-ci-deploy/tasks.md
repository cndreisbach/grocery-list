## 1. GitHub Repository Setup

- [x] 1.1 Add `CAPROVER_URL` repository secret (your CapRover server URL)
- [x] 1.2 Add `CAPROVER_APP` repository secret (your CapRover app name)
- [x] 1.3 Add `CAPROVER_PASSWORD` repository secret (password or cached token from `~/.caprover`)
- [x] 1.4 Verify GitHub notification settings are on: Settings → Notifications → Actions

## 2. Workflow File

- [x] 2.1 Create `.github/workflows/ci.yml` with a `test` job that installs Bun and runs `bun test --preload ./src/test/preload.ts src/routes`
- [x] 2.2 Add a `deploy` job to the same workflow that declares `needs: test`, installs caprover via mise, and runs `caprover deploy` with `--caproverUrl`, `--appName`, `--caproverPassword`, and `--branch main` sourced from secrets

## 3. Verification

- [x] 3.1 Push the workflow file to `main` and confirm the `test` job passes in GitHub Actions
- [x] 3.2 Confirm the `deploy` job runs after tests pass and the app updates on CapRover
- [x] 3.3 Introduce a deliberate test failure on a test branch, confirm the deploy job is skipped
