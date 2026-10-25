# PocketDimension

**English** · [Deutsch](README.de.md) · [Español](README.es.md) · [Tagalog](README.tl.md)

Self-hosted web app to start and manage game servers as Docker containers.

Pick a game from the catalog, give the server a name, and PocketDimension pulls the image, starts
the server in its own container and shows who is playing, plus CPU and memory use. It is built for
a group of friends: an administrator creates the accounts, every player may run a limited number of
servers, and the app is hardened for the public internet but runs just as well in a home network.

The interface and the manuals are available in English, German, Spanish and Tagalog.

| Manual                                                                                                                                                     | For                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| User manual: [EN](docs/en/user-manual.md) · [DE](docs/de/user-manual.md) · [ES](docs/es/user-manual.md) · [TL](docs/tl/user-manual.md)                     | Players and administrators using the web interface                   |
| Operator manual: [EN](docs/en/operator-manual.md) · [DE](docs/de/operator-manual.md) · [ES](docs/es/operator-manual.md) · [TL](docs/tl/operator-manual.md) | Whoever installs and runs it: reverse proxy, HTTPS, backups, updates |

## Requirements

- A Linux machine with [Docker Engine](https://docs.docker.com/engine/install/) 24 or newer
  (Docker Desktop on Windows or macOS works for trying it out).
- Enough memory for the games you want to run: every game lists its limit, e.g. 3 GB for
  Minecraft or 16 GB for Palworld. The app itself needs about 200 MB.
- Enough disk space; some games download a lot on first start (Counter-Strike 2 about 60 GB).
- Internet access for the machine, so Docker can pull the game images.
- Only for running without Docker: Node.js 22.17 or newer.

## Quick start with Docker

**1. Build the image.** Docker fetches the source itself; you need neither Git nor Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

(Or `docker build -t pocketdimension .` inside a clone.)

**2. Create a secret key** and keep it. If it changes, everybody has to log in again:

```bash
openssl rand -base64 48
```

**3. Start the app:**

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY='<the key from step 2>' \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='a-long-password' \
  pocketdimension
```

| Line                                  | Why                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | The web interface listens on port 3000.                                                   |
| `-v /var/run/docker.sock:…`           | Lets the app start and stop game server containers.                                       |
| `-v pocketdimension-data:/app/shared` | The SQLite database (users, games, servers). Back this volume up.                         |
| `--add-host …` and `QUERY_HOST`       | Lets the app reach the published game ports to show players, map and version.             |
| `SECRET_JWT_KEY`                      | Signs the login sessions. Required, at least 32 characters; without it every login fails. |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | The first administrator, created on first start if the email does not exist yet.          |

**4. Log in** at `http://<host>:3000` with the admin email (or the name `admin`) and the password.
Change the password under **Account** and add your players there under **Add user**. The admin
password from the environment is only used on the very first start; you can remove it afterwards.

**5. Open the game ports.** Players connect straight to the game ports, not through the web app.
Every server card shows its address and ports under **Address for players**; open those in your
firewall and, for players outside your network, forward them in your router.
Mind the protocol (`tcp` or `udp`). A second server of the same game uses ports shifted by 10
(e.g. 25575 instead of 25565).

### Docker Compose

Put the settings in a `.env` file next to the `docker-compose.yml`:

```bash
SECRET_JWT_KEY=<output of openssl rand -base64 48>
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=a-long-password
```

```yaml
services:
  pocketdimension:
    image: pocketdimension
    build: https://github.com/damaurer/PocketDimension.git#main
    restart: unless-stopped
    env_file: .env
    environment:
      QUERY_HOST: host.docker.internal
    extra_hosts:
      - host.docker.internal:host-gateway
    ports:
      - '3000:3000'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - pocketdimension-data:/app/shared

volumes:
  pocketdimension-data:
```

```bash
docker compose up -d --build
```

### Updating

```bash
docker compose build --pull --no-cache pocketdimension && docker compose up -d
```

With plain `docker run`, rebuild the image (step 1), `docker rm -f pocketdimension` and start it
again with the same command and volume. Running game servers keep running during an update.

## Public internet or home network

- **Home network / LAN party:** the quick start is enough. Plain `http` is fine inside your own
  network. Set `PUBLIC_HOST` to the address players should see (e.g. `192.168.0.10`), and
  `PORT_BIND_IP` to the machine's LAN address if the game ports must not be published on other
  interfaces.
- **Internet:** put the web interface behind a reverse proxy with HTTPS (do not expose port 3000
  itself) and set

  ```bash
  ORIGIN=https://games.example.com
  ADDRESS_HEADER=X-Forwarded-For
  XFF_DEPTH=1
  PUBLIC_HOST=games.example.com
  ```

  `ORIGIN` must match the address in the browser exactly, otherwise forms fail with "Cross-site
  POST form submissions are forbidden". `ADDRESS_HEADER` lets the login rate limit see the real
  client address instead of the proxy's. Over HTTPS the app marks its cookies `Secure` and sends
  HSTS. Ready-to-use Caddy and nginx examples, a docker-socket-proxy setup and the list of risks
  you still own are in the [operator manual, section 4](docs/en/operator-manual.md#4-running-on-the-internet).

## Configuration

All settings are environment variables; [`.env.example`](.env.example) has them with comments.

| Variable                  | Default                          | Meaning                                                                                           |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_KEY`          | –                                | **Required in production.** Random string, at least 32 characters.                                |
| `DB_ADMIN_EMAIL`          | –                                | Email of the first administrator, created on start if it does not exist yet.                      |
| `DB_ADMIN_PASSWORD`       | –                                | Password of that administrator. Only read when the account is created.                            |
| `DB_ADMIN_USER`           | `admin`                          | Login name of that administrator.                                                                 |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | SQLite database file (`shared/pocketdimension.db` outside Docker).                                |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | How long a login stays valid.                                                                     |
| `PORT`, `HOST`            | `3000`, `0.0.0.0`                | Where the web interface listens.                                                                  |
| `ORIGIN`                  | –                                | Public URL behind a reverse proxy, e.g. `https://games.example.com`.                              |
| `ADDRESS_HEADER`          | –                                | Header with the client IP behind a proxy, usually `X-Forwarded-For`.                              |
| `XFF_DEPTH`               | –                                | Number of proxies in front of the app, usually `1`.                                               |
| `DOCKER_HOST`             | local socket                     | Docker API, e.g. `tcp://docker-proxy:2375` for a docker-socket-proxy.                             |
| `MAX_SERVERS_PER_USER`    | `2`                              | Servers a player without admin role may own. Administrators have no limit.                        |
| `PUBLIC_HOST`             | host name of the app URL         | Address shown to players for connecting.                                                          |
| `PORT_BIND_IP`            | all interfaces                   | Host interface the game ports are published on.                                                   |
| `QUERY_HOST`              | `127.0.0.1`                      | Where the app reaches published game ports for the live status; `host.docker.internal` in Docker. |
| `PORT_OFFSET_STEP`        | `10`                             | Port shift for each further server of the same game.                                              |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | `false` runs game containers without their memory limit.                                          |
| `CATALOG_URL`             | `catalog/catalog.json` on GitHub | Shared game catalog. Empty = only the games shipped with the app, no network access.              |
| `CATALOG_SYNC_HOURS`      | `24`                             | Hours between catalog updates; `0` = only via the button.                                         |

The Docker network `POCKET_DIMENSION_NETWORK` is created by the app on first start; there is
nothing to configure.

## Without Docker

The app can also run directly with Node.js 22.17 or newer. Docker is still needed on the same
machine for the game servers, and the user running the app needs access to the Docker socket
(e.g. membership in the `docker` group).

```bash
git clone https://github.com/damaurer/PocketDimension.git
cd PocketDimension
cp .env.example .env      # set SECRET_JWT_KEY, DB_ADMIN_EMAIL and DB_ADMIN_PASSWORD
npm ci
npm run build
NODE_ENV=production node --env-file=.env server.js
```

The database ends up in `shared/pocketdimension.db`. `QUERY_HOST` can stay at its default here.
To keep it running, use a systemd service or a process manager of your choice.

## Backup and logs

- Back up the volume `pocketdimension-data` and the game server volumes
  `pocketdimension-server-<id>-<index>` (worlds and saves); stop a server before backing it up.
- `docker logs pocketdimension` shows the app log, `docker logs <container>` the log of a game
  server. Administrators find container names under **Containers** in the app.

Details and commands: [operator manual, section 6](docs/en/operator-manual.md#6-updates-backups-and-logs).

## Troubleshooting

| Symptom                                                 | Fix                                                                                                                                                              |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login fails, log says "SECRET_JWT_KEY must be set"      | Set `SECRET_JWT_KEY` to at least 32 characters.                                                                                                                  |
| "Docker is not reachable"                               | Mount `/var/run/docker.sock` or fix `DOCKER_HOST`.                                                                                                               |
| "Cross-site POST form submissions are forbidden"        | `ORIGIN` does not match the URL in the browser; fix it or leave it unset without a proxy.                                                                        |
| Card keeps saying "The server is not answering yet"     | Wait for big games to finish starting; in Docker check `QUERY_HOST` and `--add-host`.                                                                            |
| Friends cannot connect                                  | Open/forward the game ports with the right protocol; set `PUBLIC_HOST` if the address is wrong.                                                                  |
| Everybody locked out after failed logins behind a proxy | Set `ADDRESS_HEADER` and `XFF_DEPTH`; restarting the app clears the lock.                                                                                        |
| Forgot the admin password                               | Another admin resets it under **Account**; otherwise start once with a new `DB_ADMIN_EMAIL`, `DB_ADMIN_USER` and `DB_ADMIN_PASSWORD` to get an additional admin. |

More in the [operator manual, section 8](docs/en/operator-manual.md#8-troubleshooting).

## Games

The catalog ships with Minecraft (Java and Bedrock), Valheim, Terraria, Factorio, Counter-Strike 2,
Team Fortress 2, Palworld, Satisfactory, Rust, Core Keeper, Project Zomboid, 7 Days to Die,
Enshrouded, V Rising, ARK: Survival Evolved, Sons of the Forest, Necesse, OpenTTD and OpenRA. Administrators can disable these and add any
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

The image runs the app as the unprivileged `node` user; it starts as root only to take over the
data volume and join the group of the mounted Docker socket. Game containers get no extra
privileges (`no-new-privileges`, no raw sockets, no host paths) and cannot reach each other in
`POCKET_DIMENSION_NETWORK`. See [section 4.5 of the operator manual](docs/en/operator-manual.md#45-what-the-app-protects-and-what-it-does-not) for what is and is not covered.

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

**Translations:** interface texts live in `src/lib/i18n/translations/` (`en`, `de`, `es`, `tl`),
server messages in `src/lib/i18n/messages.ts` and game texts in `src/lib/i18n/catalog.ts`. The
unit tests fail when a text is missing in one of the languages. The manuals live in
`docs/<language>/`; English is the main version.
