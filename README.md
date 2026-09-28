# Quote App

## Run Tests

Requires Docker Compose and Node.js 24. Run these commands from the repository root.

Install project dependencies and the Playwright browser:

```sh
npm ci --prefix backend
npm ci --prefix frontend
cd frontend && npx playwright install chromium && cd ..
```

Start PostgreSQL and ensure the test database and quote fixtures exist:

```sh
docker compose up -d postgres
docker compose exec -T postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/00-create-databases.sql
docker compose exec -T postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/seed-testing.sql
```

Run backend lint and unit tests, then frontend lint, unit, and browser E2E tests:

```sh
npm test --prefix backend
POSTGRES_DSN='postgres://postgres:postgres@postgres:5432/test?sslmode=disable' \
CORS_ORIGIN='http://127.0.0.1:5173' docker compose up -d --build api
npm test --prefix frontend
```

The frontend test script starts its own Vite server. After testing, restore the API to its default `dev` database:

```sh
docker compose up -d api
```
