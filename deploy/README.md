# Production deployment

This deployment runs the website, Express API, and MySQL as one Docker Compose
stack. MySQL and generated uploads are stored in named Docker volumes, so they
survive container restarts and updates.

## Before starting

1. Use a Linux server with Docker Compose installed and a domain name pointing
   at the server.
2. Copy `.env.example` to `.env` in this `deploy` directory. Replace every
   placeholder secret, and set `CORS_ORIGIN` to the final HTTPS website URL.
3. Put an HTTPS reverse proxy such as Caddy, Nginx, or your hosting provider in
   front of port `8080`. It must forward the public HTTPS site to
   `http://127.0.0.1:8080`.

## Start and verify

From the repository root on the server:

```sh
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
curl -fsS http://127.0.0.1:8080/api/health
```

The health endpoint must return `"database":"connected"` before users log
in. The published website uses its own `/api` endpoint, so no IP address is
embedded in the browser build.

## Mobile releases

Build Android and iOS with the final public API address:

```sh
cd frontend
VITE_API_URL=https://billing.example.com/api npm run build
npx cap sync android
```

Use the same URL in the app's **Server Settings** on an already installed
build. Android release packages must be signed. An iOS archive must be made on
macOS with Xcode and an Apple Developer account, then distributed through
TestFlight or the App Store.
