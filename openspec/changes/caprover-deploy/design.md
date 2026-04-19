## Context

The app is a single Bun process serving both the Hono API and the pre-built React SPA from `./dist`. It uses SQLite via `bun:sqlite` and must persist the database file across container restarts. The CapRover instance is at `captain.karego.at`; the app is already created in the dashboard as "groceries" and will be served at `groceries.karego.at`.

## Goals / Non-Goals

**Goals:**
- Get the app running at groceries.karego.at with HTTPS
- Persist the SQLite database across deploys and restarts
- Fix the Dockerfile so the build succeeds with Bun 1.2's `bun.lock` format
- Keep the deploy workflow simple: `caprover deploy` from the project root

**Non-Goals:**
- CI/CD automation (manual deploy for now)
- Database backups
- Staging environment

## Decisions

**Persistent volume via CapRover label**
CapRover manages a named Docker volume (`grocery-db`) mounted at `/data` inside the container. `DB_PATH` is set to `/data/grocery.db`. This keeps the database outside the container filesystem so it survives redeploys.

**`.caproverignore` to trim the upload bundle**
`caprover deploy` zips the working directory and uploads it. Without an ignore file, `node_modules/` (hundreds of MB) and `dist/` (rebuilt server-side) would be included needlessly. `.caproverignore` follows `.gitignore` syntax.

**Dockerfile lockfile fix**
Bun 1.2 switched from binary `bun.lockb` to text `bun.lock`. The existing `COPY package.json bun.lockb* ./` glob doesn't match `bun.lock`, so the lockfile is silently omitted and `--frozen-lockfile` may fail or produce an inconsistent install. Fix: change to `bun.lock` explicitly in both the server and client build stages.

## Risks / Trade-offs

- **SQLite + single instance**: Fine for this use case (household app, low concurrency). WAL mode already enabled.
- **`onboarding@resend.dev` sender**: Resend's shared domain; may land in spam for some users. Easy to change later by updating `FROM_EMAIL`.
- **Manual deploy**: No rollback automation. If a bad deploy goes out, recovery means fixing code and redeploying. Acceptable given the app's scope.

## Migration Plan

1. Fix Dockerfile and add `.caproverignore`
2. In CapRover dashboard → App Configs for "groceries": set env vars
3. In CapRover dashboard → App Details: add persistent directory
4. Run `caprover deploy` from project root
5. Verify at https://groceries.karego.at
