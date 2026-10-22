# PocketDimension

Self-hosted web app to start and manage game servers as Docker containers.

## Run with Docker

```bash
docker run -d --name pocketdimension \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD=change-me-please \
  mimau/pocket-dimension
```

Then open http://localhost:3000 and log in with the admin email (or the name `admin`) and password.
All settings are listed in [`.env.example`](.env.example).

The full manual (in German) covers installation, running behind a reverse proxy with HTTPS, local
use, backups and everyday use: [`docs/handbuch.md`](docs/handbuch.md).

## Games

The catalog ships with Minecraft (Java), Valheim, Terraria, Factorio, Counter-Strike 2, Palworld,
Satisfactory, Rust, Core Keeper and Project Zomboid. Administrators can disable these and add any
other game that runs in Docker under **Games → New game template** (image, ports, data directories
and the variables players may set). Each server gets its own Docker volumes; a second server of the
same game gets its ports shifted (e.g. 25575 instead of 25565).

### Shared game catalog

The games come from [`catalog/`](catalog/), a catalog shared by every PocketDimension installation.
Each instance ships with the catalog as it was at build time and fetches
`catalog/catalog.json` from this repository once a day, read-only and without any account or key.
New games arrive disabled until an administrator enables them; own templates are never touched.
Set `CATALOG_URL` to point at a fork, or to an empty value to stay offline. To add a game for
everyone, export it from its edit page and open a pull request, see
[`catalog/README.md`](catalog/README.md).

### Live status

The server list shows CPU and memory of every running server. For games with a query protocol
([GameDig](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md) id in the template)
it also shows connected players, map and version. The app asks each game directly in the
`POCKET_DIMENSION_NETWORK` network and, at the same time, on its published port at `QUERY_HOST`
(default `127.0.0.1`). When the app itself runs in Docker, the `--add-host` and `QUERY_HOST` lines
above let it reach the published ports. Games without a query protocol show only CPU, memory and
whether they are running.

### Access to Docker

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
| `npm run catalog:check`    | Validate the shared game catalog              |
| `npm run catalog:build`    | Rebuild `catalog/catalog.json` from the games |
