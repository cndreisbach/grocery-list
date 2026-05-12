# Grocery List — Claude Notes

## Shell / Tooling

mise manages all tool versions (bun, node, etc.). The `.bashrc` sources `eval "$(mise activate bash)"`, so use `bash -i -c '...'` for any shell command that needs mise-managed tools — a plain `bash -c '...'` won't load the environment.

## Project Structure

- `src/` — Hono + Bun server (TypeScript)
- `client/` — React SPA (Vite + TypeScript)
- `dist/` — built client, served by the Bun server in production
- `openspec/` — OpenSpec change artifacts and main specs

## Dev Workflow

- Run server: `bun run dev` (from project root)
- Run client dev server: `cd client && bun run dev`
- Run both: `bun run dev:all`
- Build client: `bun run build:client` (or `cd client && bun run build`)
- Run tests: `bun test --preload ./src/test/preload.ts src/routes`

## Key Conventions

- DB migrations live in `src/db.ts`, versioned with `PRAGMA user_version`
- Tests use in-memory SQLite (`DB_PATH=':memory:'` set in `src/test/preload.ts`)
- Client must be rebuilt (`bun run build:client`) for server to serve latest changes
