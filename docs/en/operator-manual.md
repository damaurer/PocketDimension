# Pocket Dimension – Operator manual

**English** · [Deutsch](../de/operator-manual.md) · [Español](../es/operator-manual.md) ·
[Tagalog](../tl/operator-manual.md)

Pocket Dimension is a web app that lets you and your fellow players start their own game servers
with one click. Each server runs as its own Docker container on your computer or server. The app
shows who is playing and how much CPU and memory each server needs.

This operator manual is for the person who installs and runs Pocket Dimension. How players and
administrators use the interface is described in the [user manual](user-manual.md).

## Contents

- [1. Requirements](#1-requirements)
- [2. Installation](#2-installation)
- [3. Home network only](#3-home-network-only)
- [4. Running on the internet](#4-running-on-the-internet)
  - [4.5 What the app protects and what it does not](#45-what-the-app-protects-and-what-it-does-not)
- [5. All settings](#5-all-settings)
- [6. Updates, backups and logs](#6-updates-backups-and-logs)
- [7. Player count and game catalog](#7-player-count-and-game-catalog)
- [8. Troubleshooting](#8-troubleshooting)
- [9. Single sign-on](#9-single-sign-on)

---

## 1. Requirements

- A Linux machine with [Docker](https://docs.docker.com/engine/install/) (Docker Engine 24 or
  newer). Windows and macOS with Docker Desktop work for testing as well.
- Enough memory for the games you want to run. Every game template states its memory limit, for
  example 3 GB for Minecraft or 16 GB for Palworld. The app itself needs about 200 MB.
- Enough disk space. Some games download a lot on first start (Counter-Strike 2 about 60 GB).
- Internet access for the machine, so Docker can download the game images.

> **Important:** Pocket Dimension needs access to Docker. Whoever administers the app can start
> any container with it. Only give administrator rights to people you would also trust with the
> machine.

## 2. Installation

Pocket Dimension runs as a Docker container. You build the image yourself, once, from the GitHub
repository; Docker downloads the source code by itself, so you need neither Git nor Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

The first build takes a few minutes. If you have already cloned the repository, you can also run
`docker build -t pocketdimension .` in its folder. Running without Docker, directly with Node.js,
works too; see the [README](../../README.md#without-docker).

### 2.1 With `docker run`

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='a-long-password' \
  pocketdimension
```

What the lines mean:

| Line                                  | Purpose                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `-p 3000:3000`                        | The web interface is reachable on port 3000.                          |
| `-v /var/run/docker.sock:…`           | The app may control Docker to start game servers.                     |
| `-v pocketdimension-data:/app/shared` | Database with users, games and servers. You must back up this volume. |
| `--add-host …` and `QUERY_HOST`       | The app reaches the game servers to query player counts.              |
| `SECRET_JWT_KEY`                      | Secret key for logins. Required, at least 32 characters.              |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | The first administrator account. It is created on first start.        |

> Generate `SECRET_JWT_KEY` once and keep it. If it changes, everybody has to log in again. So it
> is better to keep it in a file, see Docker Compose below.

### 2.2 With Docker Compose (recommended)

Create a folder, for example `/opt/pocketdimension`, with two files in it.

`.env`:

```bash
SECRET_JWT_KEY=the-output-of-openssl-rand-base64-48
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=a-long-password
MAX_SERVERS_PER_USER=2
```

`docker-compose.yml`:

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

Build and start with:

```bash
docker compose up -d --build
```

### 2.3 First login

Open `http://<address-of-the-machine>:3000` and log in with `DB_ADMIN_EMAIL` (or the name
`admin`) and `DB_ADMIN_PASSWORD`. Then change your password under **Account** and create your
players' accounts under **Account → Add user**.

The admin password from `.env` is only used on the very first start. You can remove it from the
file afterwards.

What comes next (adding users, enabling games, creating servers) is described in the
[user manual](user-manual.md).

## 3. Home network only

For a LAN party or the home network, the installation from section 2 is all you need. The app then
runs over plain `http`, which is fine inside your own network.

- Players open `http://<ip-of-the-machine>:3000`, for example `http://192.168.0.10:3000`.
- The address the app shows players for connecting is the name the page was opened with. To always
  show the same address, set `PUBLIC_HOST=192.168.0.10`.
- If the games should only be reachable in the home network although the machine is also connected
  to the internet, set `PORT_BIND_IP` to the machine's home network address, for example
  `PORT_BIND_IP=192.168.0.10`. Docker then publishes the game ports only on that network interface.

## 4. Running on the internet

If friends from outside should play along, the web interface belongs behind a reverse proxy with
HTTPS. The game ports themselves do not go through the proxy; they are opened directly.

### 4.1 Checklist

1. **Domain:** point a domain at your public IP, for example `games.example.com`.
2. **Reverse proxy with HTTPS** in front of port 3000 (examples below). Do not open port 3000
   itself to the internet.
3. **App settings** in `.env`:
   ```bash
   ORIGIN=https://games.example.com
   ADDRESS_HEADER=X-Forwarded-For
   XFF_DEPTH=1
   PUBLIC_HOST=games.example.com
   ```
   `ORIGIN` is the public address. `ADDRESS_HEADER` and `XFF_DEPTH` make sure the block after too
   many login attempts sees the visitor's real IP and not the proxy's.
4. **Open the game ports:** in the router (port forwarding) and in the machine's firewall, open the
   ports of the games you use. Each server's ports are listed in the server list under **Address
   for players**. A second server of the same game gets ports shifted by 10 (for example 25575
   instead of 25565).
5. **A strong admin password** and only trustworthy administrators.
6. **Optional but recommended:** use a
   [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) so the app does not have
   full Docker access (see 4.4).

When the page is opened over HTTPS, the app automatically marks its login cookies as `Secure` and
sends an HSTS header.

### 4.2 Example: Caddy

Caddy gets the HTTPS certificate by itself. Extend `docker-compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data

  pocketdimension:
    # as above, but without "ports:"

volumes:
  caddy-data:
  pocketdimension-data:
```

`Caddyfile`:

```
games.example.com {
	reverse_proxy pocketdimension:3000
}
```

### 4.3 Example: nginx

```nginx
server {
    listen 443 ssl;
    server_name games.example.com;

    ssl_certificate     /etc/letsencrypt/live/games.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/games.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

Here the app runs with `-p 127.0.0.1:3000:3000`, so port 3000 is only reachable locally.

### 4.4 Restricting Docker access

Instead of mounting the Docker socket directly, the app can talk to Docker through a socket proxy.
The proxy only allows the areas Pocket Dimension needs:

```yaml
services:
  docker-proxy:
    image: tecnativa/docker-socket-proxy
    restart: unless-stopped
    environment:
      CONTAINERS: 1
      IMAGES: 1
      NETWORKS: 1
      VOLUMES: 1
      POST: 1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  pocketdimension:
    # as above, but without the Docker socket under "volumes:"
    environment:
      DOCKER_HOST: tcp://docker-proxy:2375
```

Pocket Dimension only sees containers it created itself or that are attached to the
`POCKET_DIMENSION_NETWORK` network anyway. All other containers on the machine stay invisible.

> **To be honest:** even through the socket proxy the app may create containers. Whoever fully
> takes over the app can still start containers with full rights. The proxy shrinks the attack
> surface (no access to Swarm, secrets, plugins, `exec` and so on), but it does not replace a
> strong admin password and current updates. Never attach the socket proxy to the
> `POCKET_DIMENSION_NETWORK` network, or game servers could reach it.

### 4.5 What the app protects and what it does not

Pocket Dimension is hardened for running on the internet:

- **Login:** passwords are stored with bcrypt. After 10 failed attempts for the same account from
  the same IP, and after 50 failed attempts in total from one IP, logins are blocked for 15
  minutes. Behind a reverse proxy this only works with `ADDRESS_HEADER` (see 4.1); otherwise the
  app sees every visitor with the proxy's IP.
- **Browser protection:** Content Security Policy, protection against embedding in other sites and
  form protection against cross-site requests are always on. Login cookies are `HttpOnly` and, over
  HTTPS, `Secure`.
- **App container:** the image starts the app as the ordinary user `node`, not as `root`. At
  start-up it only takes over the data directory and joins the group of the Docker socket; after
  that all privileges are dropped.
- **Game servers:** each server runs in its own container without special rights
  (`no-new-privileges`, no raw sockets, process limit, memory limit of the template). Game
  templates can mount neither `privileged`, nor folders of the machine, nor the Docker socket, only
  their own Docker volumes. Game servers of different users cannot reach each other in the
  `POCKET_DIMENSION_NETWORK` network, so RCON ports, for example, stay private.
- **Downloads:** the game catalog and thumbnails are only read, have a size limit, and thumbnails
  are never loaded from your own network.

What you have to keep an eye on yourself:

- **Administrators** can enter any Docker image as a game. The image runs locked in, but it can do
  everything a program on the internet and in your home network can do. Only give admin rights to
  people you would trust with the machine.
- **Game servers reach your home network.** Docker containers can talk to other devices in the
  local network (router, NAS). To rule that out, run Pocket Dimension on a separate machine or in a
  separate network segment (VLAN, guest network).
- **CPU:** memory is limited per game, CPU time is not. A hanging server can slow down the machine;
  **Stop** helps.
- **Shared catalog:** games from the catalog receive updates automatically, including a different
  image. If you do not want that, set `CATALOG_SYNC_HOURS=0` and update with the button, or
  `CATALOG_URL=` (empty) for no catalog requests at all.
- **Updates:** game images change all the time. A server pulls the newest image when it is created;
  existing servers stay as they are until you delete and recreate them.

## 5. All settings

All settings are environment variables. A template with comments is in
[`.env.example`](../../.env.example).

| Variable                  | Default                          | Meaning                                                                                    |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `SECRET_JWT_KEY`          | –                                | Required in production. Random text, at least 32 characters.                               |
| `DB_ADMIN_USER`           | `admin`                          | Name of the first administrator (to log in instead of the email).                          |
| `DB_ADMIN_EMAIL`          | –                                | Email of the first administrator.                                                          |
| `DB_ADMIN_PASSWORD`       | –                                | Password of the first administrator, only needed on first start.                           |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | Location of the database.                                                                  |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | How long a login stays valid (seconds).                                                    |
| `ORIGIN`                  | –                                | Public address behind a reverse proxy, e.g. `https://games.example.com`.                   |
| `ADDRESS_HEADER`          | –                                | Header with the real visitor IP behind a proxy, usually `X-Forwarded-For`.                 |
| `XFF_DEPTH`               | –                                | Number of proxies in front of the app, usually `1`.                                        |
| `DOCKER_HOST`             | local socket                     | Other Docker address, e.g. a socket proxy.                                                 |
| `MAX_SERVERS_PER_USER`    | `2`                              | How many servers a player without admin rights may own. Administrators have no limit.      |
| `PUBLIC_HOST`             | address of the page              | Address shown to players for connecting.                                                   |
| `PORT_BIND_IP`            | all network interfaces           | Network interface the game ports are published on.                                         |
| `QUERY_HOST`              | `127.0.0.1`                      | Address the app reaches published game ports on for the live status (see 7.1).             |
| `PORT_OFFSET_STEP`        | `10`                             | Step by which the ports of a further server of the same game are shifted.                  |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | `false` starts games without the memory limit of their template.                           |
| `CATALOG_URL`             | catalog in the GitHub repository | Address of the shared game catalog (see 7.2). Empty = only the games shipped with the app. |
| `CATALOG_SYNC_HOURS`      | `24`                             | Hours between automatic catalog checks. `0` = only with the button.                        |
| `OIDC_ISSUER`             | –                                | Single sign-on: issuer address of the OpenID Connect provider (see 9).                     |
| `OIDC_CLIENT_ID`          | –                                | Client ID registered at the provider.                                                      |
| `OIDC_CLIENT_SECRET`      | –                                | Client secret; empty for a public client.                                                  |
| `OIDC_NAME`               | `SSO`                            | Name on the login button ("Sign in with …").                                               |
| `OIDC_SCOPES`             | `openid email profile`           | Scopes requested from the provider.                                                        |
| `OIDC_AUTO_CREATE`        | `true`                           | `false` = only existing accounts can sign on.                                              |
| `OIDC_ROLES_CLAIM`        | `roles`                          | Claim with roles or groups, e.g. `realm_access.roles`.                                     |
| `OIDC_ADMIN_ROLE`         | –                                | Role or group that makes someone administrator. Empty = roles are managed in the app.      |
| `LOCAL_LOGIN`             | `true`                           | `false` = only single sign-on (when OIDC is set up).                                       |

## 6. Updates, backups and logs

### Updates

```bash
docker compose build --pull --no-cache pocketdimension
docker compose up -d
```

`--no-cache` makes Docker fetch the latest state from GitHub. With `docker run`, rebuild the image
as in section 2, remove the old container with `docker rm -f pocketdimension` and start it with
the same command as before. Database and game servers are kept as long as you mount the same
`pocketdimension-data` volume.

Running game servers are not stopped by this. After some updates all users have to log in again.

**Note for installations from before October 2026:** since the security update the app no longer
runs as `root` inside its container. On first start it takes over the data directory
automatically; you do not need to do anything. It also separates the game servers from each other
in the network. For existing installations this only applies once the network is recreated; the
app points this out in its log ("lets game servers reach each other"). This is how to recreate it,
with the game servers continuing to run:

```bash
docker compose stop pocketdimension
servers=$(docker ps -aq --filter network=POCKET_DIMENSION_NETWORK)
for c in $servers; do docker network disconnect POCKET_DIMENSION_NETWORK "$c"; done
docker network rm POCKET_DIMENSION_NETWORK
docker network create -o com.docker.network.bridge.enable_icc=false POCKET_DIMENSION_NETWORK
for c in $servers; do docker network connect POCKET_DIMENSION_NETWORK "$c"; done
docker compose up -d
```

### Backups

Back up regularly:

- the `pocketdimension-data` volume (users, game templates, server list),
- the game servers' volumes. They are called `pocketdimension-server-<number>-<index>` and contain
  worlds and saves.

An example for one volume:

```bash
docker run --rm -v pocketdimension-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/pocketdimension-data.tar.gz -C /data .
```

Stop a game server before backing up its volume so the save is complete.

### Logs

```bash
docker logs pocketdimension                  # the app
docker logs pocketdimension-minecraft-java-3 # a game server
```

A game server's container name is listed under **Containers** (administrators only).

---

## 7. Player count and game catalog

### 7.1 Player count (live status)

For the player count the app queries the game servers with
[GameDig](https://github.com/gamedig/node-gamedig). Which games support it is listed in the
[user manual](user-manual.md#live-values).

The app tries each server two ways at the same time:

1. directly in the Docker network `POCKET_DIMENSION_NETWORK`, which the app creates itself at
   start-up,
2. through the published port at `QUERY_HOST`.

If the app itself runs in Docker, the second way needs `QUERY_HOST=host.docker.internal` and
`--add-host host.docker.internal:host-gateway` (or `extra_hosts` in Compose). Both are already in
the examples in section 2. If the app runs directly on the machine without Docker, the default
`127.0.0.1` is enough.

### 7.2 Shared game catalog

The games come from a catalog that all Pocket Dimension installations share. It is public in the
[`catalog/`](../../catalog/) folder of the GitHub repository. The app only downloads
`catalog/catalog.json`, read-only: no account, no key and no cost. No data about your installation
is sent.

- **Shipped:** the catalog's games are also baked into the image when the app is built. Without
  internet or with an empty `CATALOG_URL`, the shipped games are always available.
- **Checks:** at start-up and then every `CATALOG_SYNC_HOURS` hours (default 24). With
  `CATALOG_SYNC_HOURS=0` only when an administrator presses **Update catalog**.
- **New games** arrive disabled; an administrator enables them. How that looks in the interface is
  described in the [user manual, section 13](user-manual.md#13-the-shared-game-catalog).
- **Your own catalog:** to maintain your own selection, fork the repository and set `CATALOG_URL`
  to your own `catalog.json`, e.g.
  `https://raw.githubusercontent.com/<name>/PocketDimension/main/catalog/catalog.json`.
- **Contributing a game:** see [`catalog/README.md`](../../catalog/README.md).

---

## 8. Troubleshooting

**"Docker is not reachable"**
The app cannot reach Docker. Check that the Docker socket is mounted
(`-v /var/run/docker.sock:/var/run/docker.sock`), or that `DOCKER_HOST` is right and the socket
proxy is running.

**The log says "the Docker socket … is not group-writable; the app keeps running as root"**
The mounted Docker socket only allows `root`, so the app cannot drop its privileges. It still
works. Better: use a socket proxy (section 4.4).

**"Too many login attempts" although the password is right**
After too many failed attempts from one IP, the app blocks it for 15 minutes. If it hits all users
at once, `ADDRESS_HEADER` is missing behind the reverse proxy (section 4.1). Restarting the app
lifts the block immediately.

**A server is stuck at "Downloading"**
Big images take time. Run `docker pull <image>` on the machine to see the progress. If the
download fails, the card shows an error and **Try again**.

**A server shows "Error"**
The message on the card gives the reason, such as a wrong image or ports already in use. Fix the
cause and click **Try again**. The game's logs are available with `docker logs <container-name>`.

**Friends cannot connect**

- Is the server **Running**?
- Are the ports from **Address for players** forwarded in the router and open in the firewall? Mind
  the protocol (`tcp` or `udp`).
- Does the address show the right name? Otherwise set `PUBLIC_HOST`.

**The player count stays at "The server is not answering yet"**

- The game is still starting. Wait a few minutes.
- If the app runs in Docker, check `QUERY_HOST` and `--add-host` (section 7.1).
- A firewall on the machine can block the query.

**After submitting a form, "Cross-site POST form submissions are forbidden" appears**
The address in the browser does not match `ORIGIN`. Set `ORIGIN` to exactly the address the page
is opened with, or leave the variable out if you do not use a reverse proxy.

**Forgot the administrator password**
Another administrator can reset it under **Account → Users**. If there is none, start the app once
with a new `DB_ADMIN_EMAIL`, a new `DB_ADMIN_USER` and `DB_ADMIN_PASSWORD`; an additional
administrator account is then created.

**Found a bug?**
Report it at
[github.com/damaurer/PocketDimension/issues](https://github.com/damaurer/PocketDimension/issues) or
with **Report a problem** at the bottom of the app.

## 9. Single sign-on

Besides the normal login with name and password, Pocket Dimension can let people sign in through
an OpenID Connect provider, for example Keycloak, Authentik, Authelia, Zitadel or Microsoft Entra
ID. It stays off until `OIDC_ISSUER` and `OIDC_CLIENT_ID` are set. The login page then shows a
**Sign in with …** button below the normal form.

### 9.1 Setting up Keycloak

1. In your realm, open **Clients → Create client**. Client type _OpenID Connect_, Client ID for
   example `pocketdimension`.
2. Turn on **Client authentication** and keep only **Standard flow** ticked.
3. Under **Login settings** enter (with your own address):
   - **Valid redirect URIs:** `https://games.example.com/auth/oidc/callback`
   - **Valid post logout redirect URIs:** `https://games.example.com/`
   - **Web origins:** `https://games.example.com`
4. Copy the **Client secret** from the **Credentials** tab.
5. Optional, administrator rights from Keycloak (see 9.3): create a realm role, for example
   `pocketdimension-admin`, and assign it to the people who should be administrators. Keycloak puts
   realm roles only into the access token by default, so open **Client scopes → roles → Mappers →
   realm roles** and turn on **Add to ID token** and **Add to userinfo**.

Then start Pocket Dimension with these additional variables:

```bash
OIDC_ISSUER=https://sso.example.com/realms/games
OIDC_CLIENT_ID=pocketdimension
OIDC_CLIENT_SECRET=<client secret>
OIDC_NAME=Keycloak
# optional, see 9.3
OIDC_ROLES_CLAIM=realm_access.roles
OIDC_ADMIN_ROLE=pocketdimension-admin
```

`OIDC_ISSUER` is the address under which `/.well-known/openid-configuration` can be found; for
Keycloak that is `https://<keycloak>/realms/<realm>`. The app itself (inside its container) must be
able to reach it. Other providers work the same way: register a web application with the redirect
URI from step 3 and use the issuer, client ID and secret they give you.

Behind a reverse proxy, set `ORIGIN` (section 4), because the redirect URI is built from it.

### 9.2 Accounts

- **First sign-on:** the app creates an account with the email and user name from the provider.
  It has no password, and its email can only be changed at the provider. With
  `OIDC_AUTO_CREATE=false` no accounts are created; then only people with an existing account can
  sign on.
- **Existing accounts:** if an account with the same email already exists, it is linked on the
  first sign-on, but only if the provider marks the email as verified (`email_verified`; in Keycloak
  the **Email verified** switch on the user). Otherwise the login page says that the email is
  already in use. A linked account can use both ways to log in.
- The account is tied to the user ID at the provider (`sub`), not to the email. A later change of
  the email at the provider does not create a second account.
- An administrator can set a password for a single sign-on account under **Account → Users**. The
  account can then also log in with the normal form.

### 9.3 Administrator role from the provider

Without `OIDC_ADMIN_ROLE`, roles are managed in the app as before: new accounts are players, and an
administrator promotes them.

With `OIDC_ADMIN_ROLE`, the provider decides. On every sign-on the app reads the claim named in
`OIDC_ROLES_CLAIM` from the ID token and userinfo. The default is `roles`; a dot reads a nested
claim, such as Keycloak's `realm_access.roles`; for groups use for example `groups`. If the claim
contains the value of `OIDC_ADMIN_ROLE`, the account becomes administrator; if not, it loses
administrator rights. Changes to the role in the app are overwritten at the next sign-on.

> **Caution:** this also applies to linked accounts, including the first administrator from
> `DB_ADMIN_EMAIL`. Give yourself the role at the provider before you sign on with that account,
> or it is no longer administrator afterwards.

### 9.4 Single sign-on only

`LOCAL_LOGIN=false` hides the password form and rejects password logins. It only takes effect
when OIDC is configured. Make sure first that at least one administrator can sign on through the
provider. If the provider is down, restart the app without `LOCAL_LOGIN=false` to get back in.

### 9.5 Security

- The app uses the authorization code flow with PKCE (S256), `state` and `nonce`, and checks the
  signature, issuer, audience and expiry of the ID token. `state`, `nonce` and the PKCE verifier are
  kept in a signed HttpOnly cookie for ten minutes.
- Plain `http://` for the issuer is accepted only for trying it out locally. Use HTTPS otherwise.
- **Logout** ends the session in the app and, after a single sign-on, also at the provider, and
  then returns to the login page.
- Locking someone out at the provider stops new sign-ons. A session that is already open in the app
  stays valid until it expires (`SESSION_MAX_AGE_SECONDS`, one day by default). To end it at once,
  set a new password for the account under **Account → Users**; that logs it out everywhere.

### 9.6 Troubleshooting

**"Single sign-on failed"**
The app log (`docker logs pocketdimension`) names the reason. Common ones: wrong `OIDC_ISSUER`, the
provider cannot be reached from the container, wrong client secret.

**Keycloak shows "Invalid parameter: redirect_uri"**
The address in **Valid redirect URIs** does not match exactly. It must be the address the app is
opened with plus `/auth/oidc/callback`. Behind a proxy, check `ORIGIN`.

**Administrator role is not applied**
The claim is missing from the ID token and userinfo. In Keycloak, turn on **Add to ID token** for
the realm roles mapper (step 5 in 9.1) and check `OIDC_ROLES_CLAIM`.
