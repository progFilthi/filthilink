# FilthiLink

URL shortener with click analytics, API keys, Google sign-in and Dodo Payments subscriptions.

This repository contains both deployables:

| Path | What | Language | Deploys to |
|------|------|----------|------------|
| `apps/web` | Dashboard, landing page and auth UI | Next.js 16 / React 19 | Vercel |
| `apps/api` | REST API, redirects, payments webhooks | Spring Boot 4 / Java 21 | Coolify (Contabo) |

## Repository layout

```
apps/
  web/                 Next.js app (bun)
  api/                 Spring Boot app (Maven wrapper)
    src/main/resources/db/migration/   Flyway migrations
    compose.yaml       local Postgres 17
docs/
  DEPLOYMENT.md        Vercel + Coolify settings, env vars, release checklist
```

## Local development

Prerequisites: `bun`, Java 21+, Docker.

```bash
# 1. Database
bun run db:up

# 2. API (needs the env vars listed in docs/DEPLOYMENT.md)
cd apps/api && ./mvnw spring-boot:run

# 3. Web
cd apps/web && cp ../api/.env.example .env.local  # first time
bun install && bun dev
```

The web app talks to `http://localhost:8080` by default. Override with
`NEXT_PUBLIC_API_URL` in `apps/web/.env.local`.

## Deployment

Both projects deploy from this monorepo with a path set, not a separate repo:

- **Vercel** → Root Directory `apps/web`
- **Coolify** → Base Directory `/apps/api`, Dockerfile `apps/api/Dockerfile`

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full settings, environment
variables and the rollback procedure.
