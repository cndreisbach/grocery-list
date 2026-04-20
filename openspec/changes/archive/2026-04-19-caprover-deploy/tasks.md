## 1. Fix Dockerfile

- [x] 1.1 Change `bun.lockb*` to `bun.lock` in the server deps COPY line
- [x] 1.2 Change `bun.lockb*` to `bun.lock` in the client deps COPY line

## 2. Add .caproverignore

- [x] 2.1 Create `.caproverignore` excluding `node_modules/`, `dist/`, and `*.db` files

## 3. CapRover Dashboard Configuration

- [x] 3.1 In App Configs for "groceries", set env vars: `DB_PATH=/data/grocery.db`, `RESEND_API_KEY=<key>`, `FROM_EMAIL=onboarding@resend.dev`, `APP_URL=https://groceries.karego.at`
- [x] 3.2 In App Details for "groceries", add persistent directory: label `grocery-db`, container path `/data`

## 4. Deploy and Verify

- [x] 4.1 Run `caprover deploy -h https://captain.karego.at -a groceries` from the project root
- [x] 4.2 Verify the app loads at https://groceries.karego.at
- [x] 4.3 Create a test list and confirm the list-created email is received with correct links
