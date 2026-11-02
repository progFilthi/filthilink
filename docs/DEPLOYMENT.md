# Deployment

The repo is a monorepo with two independent deployables. Each platform builds only
from its own subdirectory — there is no shared build step and no JS workspace
hoisting to account for.

## Vercel — `apps/web`

| Setting | Value |
|---|---|
| Repository | `progFilthi/filthilink` |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Install Command | `bun install` (default) |
| Build Command | `bun run build` (default) |
| Output Directory | `.next` (default) |
| Node.js Version | 20.x or newer |

Build-time environment variables (must be set in Vercel, they are inlined at build):

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.filthilink.store` |
| `NEXT_PUBLIC_SHORT_URL_DOMAIN` | `https://filthi.link` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `…apps.googleusercontent.com` |

These are public by design. There are no server-side secrets in the web app.

## Coolify — `apps/api`

| Setting | Value |
|---|---|
| Repository | `progFilthi/filthilink` |
| Base Directory | `/apps/api` |
| Build Pack | Dockerfile |
| Dockerfile | `Dockerfile` (relative to base directory) |
| Port | `8080` |
| Health check path | `/api/v1/health` or `/actuator/health` |

Runtime environment variables:

| Variable | Notes |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:5432/<db>` |
| `SPRING_DATASOURCE_USERNAME` | |
| `SPRING_DATASOURCE_PASSWORD` | |
| `JWT_SECRET` | 256-bit+ random string, never rotate casually |
| `CLIENT_ID` / `CLIENT_SECRET` | Google OAuth |
| `ADMIN_EMAILS` | Comma-separated list for the admin role |
| `DODO_API_KEY` | |
| `DODO_WEBHOOK_KEY` | |
| `DODO_ENVIRONMENT` | `sandbox` or `live` |
| `PREMIUM_MONTHLY` / `PREMIUM_YEARLY` | Dodo product IDs |
| `PORT` | Optional, defaults to `8080` |

Database: PostgreSQL 17. Flyway runs on startup with `ddl-auto: validate`, so a
failed migration fails the boot — check logs before declaring a deploy healthy.

## Domains

| Host | Points to | Purpose |
|---|---|---|
| `app.filthilink.store` | Vercel | Dashboard / marketing |
| `api.filthilink.store` | Contabo | REST API |
| `filthi.link` | Contabo | Short-link redirects (`GET /{shortCode}`) |

Redirects are served by the **API**, not the web app. `app.base-url` in
`apps/api/src/main/resources/application.yaml` is what gets prepended to every
short URL returned by the API, so it must match the redirect host.

## Release checklist

1. `bun run web:build` and `bun run api:build` locally.
2. Merge to `main`.
3. Confirm the Vercel deployment built from `apps/web`.
4. Confirm the Coolify deployment built from `apps/api` and boots (check Flyway).
5. Smoke test: register/login, shorten a link, follow the redirect, open analytics.
6. Check `GET /api/v1/health` on the API host.

## Rollback

The old repositories still exist and still build:

- `progFilthi/filthiLink-frontend`
- `progFilthi/FilthiLink-backend`

If a monorepo deploy fails, repoint Vercel or Coolify at the old repo (Root
Directory / Base Directory blank) and redeploy. Nothing in this repo changes the
database schema, so rollback is safe for any commit before the first migration
change.
