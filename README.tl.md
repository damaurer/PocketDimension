# PocketDimension

[English](README.md) · [Deutsch](README.de.md) · [Español](README.es.md) · **Tagalog**

Self-hosted na web app para magsimula at mag-manage ng mga game server bilang Docker container.

Pumili ng laro sa catalog, bigyan ng pangalan ang server, at ida-download ng PocketDimension ang
image, sisimulan ang server sa sarili nitong container, at ipapakita kung sino ang naglalaro pati
ang gamit na CPU at memory. Ginawa ito para sa isang grupo ng magkakaibigan: gumagawa ng mga
account ang isang administrator, puwedeng magpatakbo ang bawat player ng limitadong bilang ng
server, at protektado ang app para sa public internet pero gumagana rin ito nang maayos sa home
network.

Available ang interface at ang mga manwal sa English, German, Spanish at Tagalog.

| Manwal                                                                                                                                                        | Para kanino                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Manwal ng user: [TL](docs/tl/user-manual.md) · [EN](docs/en/user-manual.md) · [DE](docs/de/user-manual.md) · [ES](docs/es/user-manual.md)                     | Mga player at administrator na gumagamit ng web interface                         |
| Manwal ng operator: [TL](docs/tl/operator-manual.md) · [EN](docs/en/operator-manual.md) · [DE](docs/de/operator-manual.md) · [ES](docs/es/operator-manual.md) | Kung sino ang nag-i-install at nagpapatakbo: reverse proxy, HTTPS, backup, update |

## Mga kailangan

- Isang Linux na computer na may [Docker Engine](https://docs.docker.com/engine/install/) 24 o mas
  bago (puwede ang Docker Desktop sa Windows o macOS para sa pagsubok).
- Sapat na memory para sa mga larong gusto mong patakbuhin: nakasaad sa bawat laro ang limit nito,
  halimbawa 3 GB para sa Minecraft o 16 GB para sa Palworld. Mga 200 MB ang kailangan ng app mismo.
- Sapat na disk space; may mga larong maraming dina-download sa unang start (mga 60 GB ang
  Counter-Strike 2).
- Internet access para sa computer, para ma-download ng Docker ang mga game image.
- Para lang sa pagpapatakbo nang walang Docker: Node.js 22.17 o mas bago.

## Mabilis na simula gamit ang Docker

**1. I-build ang image.** Si Docker na mismo ang kukuha ng source code; hindi mo kailangan ng Git o
Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

(O `docker build -t pocketdimension .` sa loob ng isang clone.)

**2. Gumawa ng secret key** at itago ito. Kapag nagbago ito, kailangang mag-log in ulit ang lahat:

```bash
openssl rand -base64 48
```

**3. Simulan ang app:**

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY='<ang key mula sa hakbang 2>' \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='isang-mahabang-password' \
  pocketdimension
```

| Linya                                 | Bakit                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | Nakikinig ang web interface sa port 3000.                                                                     |
| `-v /var/run/docker.sock:…`           | Para makapagsimula at makapagpahinto ang app ng mga game server container.                                    |
| `-v pocketdimension-data:/app/shared` | Ang SQLite database (mga user, laro, server). I-back up ang volume na ito.                                    |
| `--add-host …` at `QUERY_HOST`        | Para maabot ng app ang mga naka-publish na game port at maipakita ang mga player, mapa at version.            |
| `SECRET_JWT_KEY`                      | Pumipirma sa mga login session. Kailangan, hindi bababa sa 32 character; kung wala ito, bigo ang bawat login. |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | Ang unang administrator, ginagawa sa unang start kung wala pa ang email.                                      |

**4. Mag-log in** sa `http://<host>:3000` gamit ang admin email (o ang pangalang `admin`) at ang
password. Palitan ang password sa **Account** at idagdag doon ang mga player mo gamit ang
**Magdagdag ng user**. Ang admin password mula sa environment ay ginagamit lang sa pinakaunang
start; puwede mo itong tanggalin pagkatapos.

**5. Buksan ang mga game port.** Direktang kumokonekta ang mga player sa mga game port, hindi sa
web app. Ipinapakita ng bawat server card ang address at mga port nito sa **Address para sa mga
player**; buksan ang mga iyon sa firewall at, para sa mga player na nasa labas ng network mo,
i-forward sa router. Tingnan ang protocol (`tcp` o `udp`). Ang pangalawang server ng parehong laro
ay gumagamit ng mga port na inusog ng 10 (halimbawa 25575 sa halip na 25565).

### Docker Compose

Ilagay ang mga setting sa isang `.env` file katabi ng `docker-compose.yml`:

```bash
SECRET_JWT_KEY=<output ng openssl rand -base64 48>
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=isang-mahabang-password
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

### Pag-update

```bash
docker compose build --pull --no-cache pocketdimension && docker compose up -d
```

Sa simpleng `docker run`: i-build ulit ang image (hakbang 1), patakbuhin ang
`docker rm -f pocketdimension` at simulan ulit gamit ang parehong command at volume. Tuloy-tuloy
na tumatakbo ang mga game server habang nag-a-update.

## Public internet o home network

- **Home network / LAN party:** sapat na ang mabilis na simula. Ayos lang ang simpleng `http` sa
  loob ng sarili mong network. Itakda ang `PUBLIC_HOST` sa address na dapat makita ng mga player
  (halimbawa `192.168.0.10`), at ang `PORT_BIND_IP` sa LAN address ng computer kung ayaw mong
  ma-publish ang mga game port sa ibang interface.
- **Internet:** ilagay ang web interface sa likod ng reverse proxy na may HTTPS (huwag direktang
  buksan ang port 3000) at itakda ang

  ```bash
  ORIGIN=https://games.example.com
  ADDRESS_HEADER=X-Forwarded-For
  XFF_DEPTH=1
  PUBLIC_HOST=games.example.com
  ```

  Dapat eksaktong tumugma ang `ORIGIN` sa address sa browser, kung hindi ay babagsak ang mga form
  na may "Cross-site POST form submissions are forbidden". Dahil sa `ADDRESS_HEADER`, nakikita ng
  login rate limit ang totoong address ng client sa halip na ang sa proxy. Sa HTTPS, minamarkahan
  ng app ang mga cookie nito bilang `Secure` at nagpapadala ng HSTS. Ang mga handang halimbawa
  para sa Caddy at nginx, isang setup na may docker-socket-proxy, at ang listahan ng mga panganib
  na nananatili sa iyo ay nasa
  [manwal ng operator, seksyon 4](docs/tl/operator-manual.md#4-pagpapatakbo-sa-internet).

## Configuration

Lahat ng setting ay environment variable; nasa [`.env.example`](.env.example) ang mga ito kasama
ang mga paliwanag.

| Variable                  | Default                          | Kahulugan                                                                                                         |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_KEY`          | –                                | **Kailangan sa production.** Random na string, hindi bababa sa 32 character.                                      |
| `DB_ADMIN_EMAIL`          | –                                | Email ng unang administrator, ginagawa sa start kung wala pa.                                                     |
| `DB_ADMIN_PASSWORD`       | –                                | Password ng administrator na iyon. Binabasa lang kapag ginagawa ang account.                                      |
| `DB_ADMIN_USER`           | `admin`                          | Login name ng administrator na iyon.                                                                              |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | SQLite database file (`shared/pocketdimension.db` sa labas ng Docker).                                            |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | Gaano katagal valid ang isang login.                                                                              |
| `PORT`, `HOST`            | `3000`, `0.0.0.0`                | Kung saan nakikinig ang web interface.                                                                            |
| `ORIGIN`                  | –                                | Public URL sa likod ng reverse proxy, halimbawa `https://games.example.com`.                                      |
| `ADDRESS_HEADER`          | –                                | Header na may IP ng client sa likod ng proxy, kadalasan `X-Forwarded-For`.                                        |
| `XFF_DEPTH`               | –                                | Bilang ng mga proxy sa harap ng app, kadalasan `1`.                                                               |
| `DOCKER_HOST`             | lokal na socket                  | Docker API, halimbawa `tcp://docker-proxy:2375` para sa docker-socket-proxy.                                      |
| `MAX_SERVERS_PER_USER`    | `2`                              | Bilang ng server na puwedeng pag-aari ng player na walang admin role. Walang limit ang mga administrator.         |
| `PUBLIC_HOST`             | host name ng URL ng app          | Address na ipinapakita sa mga player para kumonekta.                                                              |
| `PORT_BIND_IP`            | lahat ng interface               | Interface ng host kung saan naka-publish ang mga game port.                                                       |
| `QUERY_HOST`              | `127.0.0.1`                      | Kung saan naaabot ng app ang mga naka-publish na game port para sa live status; `host.docker.internal` sa Docker. |
| `PORT_OFFSET_STEP`        | `10`                             | Pag-usog ng port para sa bawat karagdagang server ng parehong laro.                                               |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | Sa `false`, tumatakbo ang mga game container nang walang memory limit.                                            |
| `CATALOG_URL`             | `catalog/catalog.json` sa GitHub | Shared na catalog ng mga laro. Walang laman = mga kasamang laro lang, walang network access.                      |
| `CATALOG_SYNC_HOURS`      | `24`                             | Mga oras sa pagitan ng mga update ng catalog; `0` = sa button lang.                                               |
| `OIDC_ISSUER`             | –                                | Single sign-on: issuer address ng OpenID Connect provider (tingnan ang 9).                                        |
| `OIDC_CLIENT_ID`          | –                                | Client ID na nakarehistro sa provider.                                                                            |
| `OIDC_CLIENT_SECRET`      | –                                | Client secret; walang laman para sa public client.                                                                |
| `OIDC_NAME`               | `SSO`                            | Pangalan sa login button ("Mag-login gamit ang …").                                                               |
| `OIDC_SCOPES`             | `openid email profile`           | Mga scope na hinihingi sa provider.                                                                               |
| `OIDC_AUTO_CREATE`        | `true`                           | `false` = mga dati nang account lang ang makakapag-login.                                                         |
| `OIDC_ROLES_CLAIM`        | `roles`                          | Claim na may mga role o group, hal. `realm_access.roles`.                                                         |
| `OIDC_ADMIN_ROLE`         | –                                | Role o group na gumagawang administrator sa isang tao. Walang laman = sa app pinamamahalaan ang mga role.         |
| `LOCAL_LOGIN`             | `true`                           | `false` = single sign-on lang (kapag naka-set up ang OIDC).                                                       |

Ang app mismo ang gumagawa ng Docker network na `POCKET_DIMENSION_NETWORK` sa unang start; wala
kang kailangang i-configure dito.

### Single sign-on (OpenID Connect)

Opsyonal na pag-login sa pamamagitan ng Keycloak o ibang OpenID Connect provider, bukod sa
karaniwang login gamit ang password. Magrehistro ng client na may redirect URI na
`https://<iyong-app>/auth/oidc/callback` at i-set ang:

```bash
OIDC_ISSUER=https://sso.example.com/realms/games
OIDC_CLIENT_ID=pocketdimension
OIDC_CLIENT_SECRET=...
OIDC_NAME=Keycloak
```

Magkakaroon ng account ang mga bagong user sa una nilang pag-login; ili-link ang dati nang account
kapag na-verify ng provider ang email nito. Sa `OIDC_ADMIN_ROLE`, sumusunod sa provider ang role ng
administrator. Nasa [manwal ng operator, seksyon 9](docs/tl/operator-manual.md#9-single-sign-on) ang
hakbang-hakbang na pag-set up ng Keycloak.

## Nang walang Docker

Puwede ring direktang patakbuhin ang app gamit ang Node.js 22.17 o mas bago. Kailangan pa rin ang
Docker sa parehong computer para sa mga game server, at kailangan ng user na nagpapatakbo ng app
ang access sa Docker socket (halimbawa, miyembro ng grupong `docker`).

```bash
git clone https://github.com/damaurer/PocketDimension.git
cd PocketDimension
cp .env.example .env      # itakda ang SECRET_JWT_KEY, DB_ADMIN_EMAIL at DB_ADMIN_PASSWORD
npm ci
npm run build
NODE_ENV=production node --env-file=.env server.js
```

Napupunta ang database sa `shared/pocketdimension.db`. Puwedeng manatili sa default ang
`QUERY_HOST` dito. Para tuloy-tuloy itong tumakbo, gumamit ng systemd service o ng process manager
na gusto mo.

## Backup at log

- I-back up ang volume na `pocketdimension-data` at ang mga volume ng game server
  `pocketdimension-server-<id>-<index>` (mga mundo at save); ihinto muna ang server bago i-back up.
- Ipinapakita ng `docker logs pocketdimension` ang log ng app, at ng `docker logs <container>` ang
  log ng isang game server. Makikita ng mga administrator ang mga pangalan ng container sa
  **Mga container** sa app.

Mga detalye at command: [manwal ng operator, seksyon 6](docs/tl/operator-manual.md#6-update-backup-at-log).

## Pag-aayos ng problema

| Sintomas                                                             | Solusyon                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bigo ang login, sinasabi ng log na "SECRET_JWT_KEY must be set"      | Itakda ang `SECRET_JWT_KEY` na hindi bababa sa 32 character.                                                                                                                                      |
| "Hindi maabot ang Docker"                                            | I-mount ang `/var/run/docker.sock` o ayusin ang `DOCKER_HOST`.                                                                                                                                    |
| "Cross-site POST form submissions are forbidden"                     | Hindi tugma ang `ORIGIN` sa URL sa browser; ayusin ito o huwag itakda kung walang proxy.                                                                                                          |
| Laging "Hindi pa sumasagot ang server" ang card                      | Hintaying matapos mag-start ang malalaking laro; sa Docker, tingnan ang `QUERY_HOST` at `--add-host`.                                                                                             |
| Hindi makakonekta ang mga kaibigan                                   | Buksan/i-forward ang mga game port gamit ang tamang protocol; itakda ang `PUBLIC_HOST` kung mali ang address.                                                                                     |
| Naka-lock out ang lahat pagkatapos ng maling login sa likod ng proxy | Itakda ang `ADDRESS_HEADER` at `XFF_DEPTH`; nawawala ang lock kapag ni-restart ang app.                                                                                                           |
| Nakalimutan ang admin password                                       | Ire-reset ito ng ibang admin sa **Account**; kung wala, mag-start nang isang beses gamit ang bagong `DB_ADMIN_EMAIL`, `DB_ADMIN_USER` at `DB_ADMIN_PASSWORD` para magkaroon ng karagdagang admin. |

Higit pa sa [manwal ng operator, seksyon 8](docs/tl/operator-manual.md#8-pag-aayos-ng-problema).

## Mga laro

Kasama sa catalog ang Minecraft (Java at Bedrock), Valheim, Terraria, Factorio, Counter-Strike 2,
Team Fortress 2, Palworld, Satisfactory, Rust, Core Keeper, Project Zomboid, 7 Days to Die,
Enshrouded, V Rising, ARK: Survival Evolved, Sons of the Forest, Necesse, OpenTTD at OpenRA. Puwedeng
i-disable ng mga administrator ang mga ito at magdagdag ng kahit anong larong tumatakbo sa Docker
sa **Mga laro → Bagong game template** (image, mga port, mga data directory at ang mga variable na
puwedeng itakda ng mga player). May sariling Docker volume ang bawat server; ang pangalawang server
ng parehong laro ay may inusog na mga port (halimbawa 25575 sa halip na 25565).

### Shared na catalog ng mga laro

Galing ang mga laro sa [`catalog/`](catalog/), isang catalog na pinagsasaluhan ng lahat ng
installation ng PocketDimension. Kasama sa bawat instance ang catalog kung ano ito noong na-build,
at kinukuha nito ang `catalog/catalog.json` mula sa repository na ito isang beses sa isang araw,
read-only at walang account o key. Naka-disable ang mga bagong laro hanggang i-enable ng isang
administrator; hindi kailanman ginagalaw ang sariling mga template. Itakda ang `CATALOG_URL` para
tumuro sa isang fork, o gawing walang laman para manatiling offline. Para magdagdag ng laro para sa
lahat, i-export ito mula sa edit page nito at magbukas ng pull request; tingnan ang
[`catalog/README.md`](catalog/README.md).

### Live status

Ipinapakita ng listahan ng server ang CPU at memory ng bawat tumatakbong server. Para sa mga larong
may query protocol (id ng [GameDig](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md)
sa template), ipinapakita rin nito ang mga nakakonektang player, mapa at version. Direktang
tinatanong ng app ang bawat laro sa network na `POCKET_DIMENSION_NETWORK` at, kasabay nito, sa
naka-publish na port nito sa `QUERY_HOST` (default `127.0.0.1`). Kapag tumatakbo ang app mismo sa
Docker, ang mga linyang `--add-host` at `QUERY_HOST` sa itaas ang nagpapaabot dito sa mga
naka-publish na port. Ang mga larong walang query protocol ay CPU, memory at kung tumatakbo lang
ang ipinapakita.

### Access sa Docker

Nakikita lang ng PocketDimension ang mga container na ginawa nito (label
`pocketdimension.managed=true`) at ang mga container na nakakabit sa network na
`POCKET_DIMENSION_NETWORK`. Katumbas ng root sa host ang access sa Docker socket: para sa mga
installation na nakaharap sa internet, patakbuhin ito sa likod ng HTTPS reverse proxy at isaalang-alang
ang [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) gamit ang `DOCKER_HOST`.

Pinapatakbo ng image ang app bilang user na `node` na walang espesyal na pribilehiyo; nagsisimula
lang ito bilang root para kunin ang data volume at sumali sa grupo ng naka-mount na Docker socket.
Walang dagdag na pribilehiyo ang mga game container (`no-new-privileges`, walang raw socket, walang
host path) at hindi sila nagkakaabutan sa `POCKET_DIMENSION_NETWORK`. Kung ano ang sakop at hindi
ay nasa
[seksyon 4.5 ng manwal ng operator](docs/tl/operator-manual.md#45-ano-ang-pinoprotektahan-ng-app-at-ano-ang-hindi).

## Development

```bash
cp .env.example .env   # punan ang DB_ADMIN_* (opsyonal ang SECRET_JWT_KEY sa development)
npm install
npm run dev
```

| Command                    | Ano ang ginagawa                                         |
| -------------------------- | -------------------------------------------------------- |
| `npm run lint`             | Prettier at ESLint                                       |
| `npm run check`            | Type check (svelte-check)                                |
| `npm run test:unit`        | Mga unit test (Vitest)                                   |
| `npm run test:integration` | Mga browser test laban sa isang build (Playwright)       |
| `npm run build`            | Production build, simulan gamit ang `node server.js`     |
| `npm run catalog:check`    | I-validate ang shared na catalog ng mga laro             |
| `npm run catalog:build`    | I-build ulit ang `catalog/catalog.json` mula sa mga laro |

**Mga pagsasalin:** nasa `src/lib/i18n/translations/` (`en`, `de`, `es`, `tl`) ang mga text ng
interface, nasa `src/lib/i18n/messages.ts` ang mga mensahe ng server at nasa
`src/lib/i18n/catalog.ts` ang mga text ng laro. Babagsak ang mga unit test kapag may kulang na text
sa isa sa mga wika. Nasa `docs/<wika>/` ang mga manwal; English ang pangunahing bersyon.
