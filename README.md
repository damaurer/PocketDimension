# PocketDimension

Self-hosted web app to start and manage game servers as Docker containers.

## Run with Docker

```bash
docker run -d --name pocketdimension \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD=change-me-please \
  mimau/pocket-dimension
```

Then open http://localhost:3000 and log in with the admin email (or the name `admin`) and password.
All settings are listed in [`.env.example`](.env.example).

## Games

The catalog ships with Minecraft (Java), Valheim, Terraria, Factorio, Counter-Strike 2, Palworld,
Satisfactory, Rust, Core Keeper and Project Zomboid. Administrators can disable these and add any
other game that runs in Docker under **Games → New game template** (image, ports, data directories
and the variables players may set). Each server gets its own Docker volumes; a second server of the
same game gets its ports shifted (e.g. 25575 instead of 25565).

PocketDimension only sees containers it created (label `pocketdimension.managed=true`) and
containers attached to the `POCKET_DIMENSION_NETWORK` network. Access to the Docker socket is
equivalent to root on the host: for internet-facing installs, run it behind an HTTPS reverse proxy
and consider a [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) via `DOCKER_HOST`.

## Development

```bash
cp .env.example .env   # fill in DB_ADMIN_* (SECRET_JWT_KEY is optional in dev)
npm install
npm run dev
```

| Command                    | What it does                                  |
| -------------------------- | --------------------------------------------- |
| `npm run lint`             | Prettier and ESLint                           |
| `npm run check`            | Type check (svelte-check)                     |
| `npm run test:unit`        | Unit tests (Vitest)                           |
| `npm run test:integration` | Browser tests against a build (Playwright)    |
| `npm run build`            | Production build, start with `node server.js` |
