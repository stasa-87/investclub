# Investclub

## Development stack

### Frontend UI Stack Policy

All new frontend UI development must use Tremor UI and Tailwind CSS. These are the standard libraries for all user-facing components. Do not introduce Mantine or other UI libraries for new work. Existing Mantine code should be migrated over time, but no new Mantine usage is allowed.

Start the local development stack:

```powershell
docker compose up --build -d
```

Endpoints:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8081`

Development env files:

- `env/frontend.env`
- `env/backend.env`

## Production-style stack

Start the production-style stack:

```powershell
Copy-Item "env/backend.prod.example.env" "env/backend.prod.env"
docker compose -f docker-compose.prod.yml up --build -d
```

Public endpoint:

- App + API entrypoint: `http://localhost`

### Production behavior

- The frontend is built as static assets and served by Nginx.
- Nginx is the only public entrypoint in production.
- Backend traffic is routed internally through the reverse proxy via `/api`.
- Because production uses same-origin proxying, `VITE_API_BASE_URL` is intentionally empty in `env/frontend.prod.example.env`.
- The frontend falls back to same-origin requests such as `/api/health` and `/api/demo`.

### Production env files

- `env/backend.prod.example.env` contains the minimum variables required by the current backend scaffold.
- If the backend later adds a database, auth provider, SMTP, storage, or other dependencies, extend `backend.prod.env` with the required production variables.
- `env/frontend.prod.example.env` is intentionally minimal because the reverse proxy removes the need for a separate public API base URL in the default production topology.

### Stop production stack

```powershell
docker compose -f docker-compose.prod.yml down
Remove-Item "env/backend.prod.env"
```
