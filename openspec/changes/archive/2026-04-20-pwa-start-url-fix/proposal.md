## Why

When a user taps "Add to Home Screen" on a list page, the installed PWA always opens at `/` (the home screen) instead of the list they were viewing, because `start_url: "/"` in the web manifest overrides the current page URL. Changing `start_url` to `"./"` lets the browser use the current page URL as the launch URL.

## What Changes

- Change `start_url` in the Vite PWA manifest config from `"/"` to `"./"`

## Capabilities

### New Capabilities

### Modified Capabilities
- `pwa-install`: The behavior of "Add to Home Screen" changes — the installed shortcut now opens the URL the user was on when they installed, not the root

## Impact

- `client/vite.config.ts`: one-line change to the manifest config
- No API, backend, or schema changes
