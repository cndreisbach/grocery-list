## Why

The grocery list app is fully built but not yet deployed. It needs to be running on CapRover at groceries.karego.at so it can be used in the real world.

## What Changes

- Fix Dockerfile lockfile reference (`bun.lockb*` → `bun.lock`) so Docker builds succeed
- Add `.caproverignore` to exclude `node_modules/`, `dist/`, and `*.db` from the deploy bundle
- Document CapRover app configuration: env vars, persistent directory, and deploy command

## Capabilities

### New Capabilities
- `deployment`: Configuration and instructions for deploying the app to CapRover

### Modified Capabilities

## Impact

- `Dockerfile`: one-line fix to lockfile glob pattern
- New file: `.caproverignore`
- No application code changes
- No API or schema changes
