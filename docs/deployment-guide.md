# Deployment Guide – Smart CRM Mekong Mobile (flow L2: warranty request intake)

Version: v1.0 · Student: Hà Đăng Khoa · ID: 2374802010228 · Track: SE

This guide lets you build and run the whole system from an empty folder with two commands, without asking the author anything.

## 1. Requirements

| Item | Needed for | Notes |
|---|---|---|
| Docker Desktop with Docker Compose v2 | Running the system (recommended) | Docker Desktop must be running. Check with `docker compose version`. |
| Git | Getting the source code | |
| Free ports `3000`, `5173`, `5433` | API, web UI, PostgreSQL | Change them in `.env` if they are taken (see section 3). |
| Internet access | First build only | Pulls the `postgres:16-alpine` image and npm packages. The first build takes a few minutes. |
| Node.js 22 LTS and npm 10+ | Only for running the automated tests from the host | Not needed to run the system itself. See `.nvmrc`. |

Tested on: Windows with Docker Desktop (PowerShell). The commands below also work in macOS/Linux/Git Bash; use `cp` instead of `Copy-Item`.

## 2. Setup steps

```powershell
# 1. Get the code (the graded version is the tag v1.0)
git clone --branch v1.0 https://github.com/dangkhoa35/smartcrm-2374802010228-ticket-reception.git
cd smartcrm-2374802010228-ticket-reception

# 2. The TWO commands that run the system
Copy-Item .env.example .env
docker compose up -d --build
```

What happens (in order): `db` (PostgreSQL 16) starts and becomes healthy → `init` creates the tables and loads the sample data, then exits → `api` (Express, port 3000) starts and becomes healthy → `web` (React behind nginx) starts.

Open the web UI at http://localhost:5173 (this is the only address that works for the UI, because CORS allows only this origin by default).

Useful commands (run each one separately in older PowerShell, do not chain with `&&`):

```powershell
docker compose ps -a                 # status of every service
docker compose logs api --tail 20    # JSON logs of the API, each line has a requestId
docker compose logs init             # result of table creation and data loading
docker compose down                  # stop, keep the data
docker compose down -v               # stop and DELETE the data (start from scratch next time)
```

### Enabling HTTPS in a real deployment

The prototype runs on `localhost` over plain HTTP; no TLS certificate is installed here. For a real deployment:

1. Put the web UI and the API behind a reverse proxy (nginx, Caddy, or the hosting platform) that terminates TLS with a real certificate and redirects HTTP to HTTPS.
2. Set `CORS_ORIGIN` to the https address of the UI, and `PUBLIC_API_URL` to the https address of the API. `PUBLIC_API_URL` is baked into the UI at build time, so rebuild the `web` image after changing it (`docker compose up -d --build`).
3. Set `NODE_ENV=production` for the API.
4. The system does not use cookies: the login token is sent in the `Authorization: Bearer` header, so no cookie flags (`Secure`, `HttpOnly`, `SameSite`) are involved today. If the token is moved into a cookie later, set `HttpOnly`, `SameSite` and `Secure`, and call `app.set('trust proxy', 1)` so Express reads `X-Forwarded-Proto` behind the proxy.
5. Never send a token, password or key in a URL query string.

## 3. Environment variables

All variables live in `.env` (copied from `.env.example`). `.env` is in `.gitignore` and must never be committed.

| Variable | Required | Default in `.env.example` | Meaning |
|---|---|---|---|
| `DB_NAME` | yes | `smartcrm` | PostgreSQL database name |
| `DB_USER` | yes | `smartcrm` | PostgreSQL user |
| `DB_PASSWORD` | yes | `doi_mat_khau_nay` (sample) | PostgreSQL password. Do not use `@ : / # ?` in it. If you change it after the first run, run `docker compose down -v` first (the volume keeps the old password). |
| `DB_HOST_PORT` | no | `5433` | Host port of PostgreSQL (5433 avoids a local PostgreSQL on 5432) |
| `API_PORT` | no | `3000` | Host port of the API |
| `WEB_PORT` | no | `5173` | Host port of the web UI. If you change it, change `CORS_ORIGIN` to match. |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Browser origins allowed to call the API. A comma-separated list is accepted. `*` is never used. |
| `PUBLIC_API_URL` | no | `http://localhost:3000` | API address that the browser calls (baked into the UI at build time) |
| `LOG_LEVEL` | no | `info` | `info`, `warn` or `error` |
| `JWT_SECRET` | yes | sample value, 52 characters | Key that signs login tokens. At least 32 characters. Missing or too short: `docker compose up` stops with an error and the API refuses to sign tokens. Use your own random string for any real use. |
| `REGISTER_CODE_KY_THUAT_VIEN` | no | `KTV-2026` (sample) | Code required to self-register as technician. Empty = nobody can register that role. |
| `REGISTER_CODE_QUAN_LY` | no | `QL-2026` (sample) | Same, for the centre manager role |
| `SHOW_DEMO_ACCOUNTS` | no | `true` | Shows the "demo accounts" box on the login page (set `false` outside demos) |
| `DATASET_HOST_DIR` | no | `./data/sample` | Folder of source CSV files loaded by `init` (see section 4) |

Only for running the backend directly on the host without Docker: `PORT`, `DATABASE_URL`, `DATASET_DIR` (see `README.md`, section 5, option B).

> The values marked "sample" are placeholders for local testing, not real secrets.

## 4. Sample data

- The repository contains a small sample set in `data/sample/` (7 CSV files): 300 tickets, 298 customers, 300 devices, 1,448 status-history rows, plus the service centres, issue categories and technicians lists.
- `init` loads it automatically on `docker compose up`. `init` is idempotent: running it again does not duplicate data. Re-run it with:

```powershell
docker compose run --rm init
```

- Demo accounts, created by the seed (for testing and grading only):

| Role | Username | Password |
|---|---|---|
| Intake staff | `tiepnhan` | `Tiepnhan@123` |
| Technician | `kythuatvien` | `Kythuat@123` |
| Centre manager | `quanly` | `Quanly@123` |

- To load the full dataset instead (not committed to the repo, kept in `data/raw/`): set `DATASET_HOST_DIR=./data/raw` in `.env`, then `docker compose down -v` and `docker compose up -d --build`.

## 5. Verify it works

Run these checks in order. Every one must give the expected result.

#### 1. All services are healthy

```powershell
docker compose ps -a
```

Expected: `db`, `api`, `web` are `healthy`; `init` is `Exited (0)` (it runs once and stops, which is normal).

#### 2. The API answers

```powershell
curl.exe -s http://localhost:3000/health
```

Expected: `{"status":"ok"}`

#### 3. Authentication works and protects the API

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:3000/api/tickets
```

Expected: `401` (no token).

```powershell
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType "application/json" -Body '{"username":"quanly","password":"Quanly@123"}'
Invoke-RestMethod "http://localhost:3000/api/tickets?size=2" -Headers @{ Authorization = "Bearer $($r.data.token)" }
```

Expected: a JSON object with `data` (2 tickets) and `paging`; phone numbers are shown in full for the manager role and masked (for example `078918`) for other roles.

#### 4. The web UI works

Open http://localhost:5173, log in as `tiepnhan` / `Tiepnhan@123`, search a customer, and create a ticket. A device that already has an open ticket must be refused with a clear message (HTTP 409).

#### 5. Running twice does not break or duplicate data

```powershell
docker compose run --rm init
docker compose logs init --tail 20
```

Expected: exit code 0, and the same row counts as the first run.

#### 6. Automated tests (needs Node.js 22 on the host)

The backend tests use a real PostgreSQL, so start the database first. The tests create and use a separate database `smartcrm_test`; they never touch the application database.

```powershell
docker compose up -d db
npm ci
npm test                          # backend: 96 tests, expected: pass 96, fail 0
npm ci --prefix src/frontend
npm test --prefix src/frontend    # web UI: 48 tests, expected: 48 passed
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Thiếu JWT_SECRET trong .env` when running `docker compose up` | `.env` has no `JWT_SECRET`; copy the line from `.env.example` (at least 32 characters). |
| `port is already allocated` | Another program uses 3000, 5173 or 5433. Stop it (for example `npm run dev`) or change `API_PORT`, `WEB_PORT`, `DB_HOST_PORT` in `.env`. |
| The UI says it cannot reach the system | Open exactly `http://localhost:5173`. A page on another port is blocked by CORS. |
| `password authentication failed` after changing `DB_PASSWORD` | Run `docker compose down -v`, then `docker compose up -d --build`. |
| Backend tests fail with `ECONNREFUSED ...:5433` | The database is not running: `docker compose up -d db` and wait until it is healthy. |
| "Sai tên đăng nhập hoặc mật khẩu" with the correct password | Demo accounts exist only after the seed ran; check `docker compose logs init`. |
| Login returns 429 | 5 wrong attempts lock the account for 15 minutes; restart the API container to clear it while testing. |

## Known limitations

- The login token is stored in the browser's `localStorage` (readable if the page had an XSS flaw); an `HttpOnly` cookie is the planned improvement.
- The login lockout counter lives in the API's memory, so it resets when the API restarts.
- No password reset and no account administration page.
