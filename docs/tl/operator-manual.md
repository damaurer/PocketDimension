# Pocket Dimension – Manwal ng operator

[English](../en/operator-manual.md) · [Deutsch](../de/operator-manual.md) ·
[Español](../es/operator-manual.md) · **Tagalog**

Ang Pocket Dimension ay isang web app kung saan puwede kayong magbukas ng mga kasama mo ng sarili
ninyong game server sa isang click. Bawat server ay tumatakbo bilang sariling Docker container sa
computer o server mo. Ipinapakita ng app kung sino ang naglalaro at gaano karaming CPU at memory
ang kailangan ng bawat server.

Para sa taong nag-i-install at nagpapatakbo ng Pocket Dimension ang manwal ng operator na ito.
Kung paano ginagamit ng mga player at administrator ang interface ay nasa
[manwal ng user](user-manual.md).

## Nilalaman

- [1. Mga kailangan](#1-mga-kailangan)
- [2. Pag-install](#2-pag-install)
- [3. Sa home network lang](#3-sa-home-network-lang)
- [4. Pagpapatakbo sa internet](#4-pagpapatakbo-sa-internet)
  - [4.5 Ano ang pinoprotektahan ng app at ano ang hindi](#45-ano-ang-pinoprotektahan-ng-app-at-ano-ang-hindi)
- [5. Lahat ng setting](#5-lahat-ng-setting)
- [6. Update, backup at log](#6-update-backup-at-log)
- [7. Bilang ng player at catalog ng mga laro](#7-bilang-ng-player-at-catalog-ng-mga-laro)
- [8. Pag-aayos ng problema](#8-pag-aayos-ng-problema)

---

## 1. Mga kailangan

- Isang Linux na computer na may [Docker](https://docs.docker.com/engine/install/) (Docker Engine
  24 o mas bago). Puwede rin para sa pagsubok ang Windows at macOS na may Docker Desktop.
- Sapat na memory para sa mga larong gusto mong patakbuhin. Nakasaad sa bawat game template ang
  memory limit nito, halimbawa 3 GB para sa Minecraft o 16 GB para sa Palworld. Mga 200 MB ang
  kailangan ng app mismo.
- Sapat na disk space. May mga larong maraming dina-download sa unang start (mga 60 GB ang
  Counter-Strike 2).
- Internet access para sa computer, para ma-download ng Docker ang mga game image.

> **Mahalaga:** Kailangan ng Pocket Dimension ng access sa Docker. Kahit anong container ay
> puwedeng simulan ng nag-a-administer ng app. Kaya ibigay lang ang administrator rights sa mga
> taong pagkakatiwalaan mo rin sa computer.

## 2. Pag-install

Tumatakbo ang Pocket Dimension bilang Docker container. Ikaw mismo ang magbi-build ng image, isang
beses, mula sa GitHub repository; si Docker na ang magda-download ng source code, kaya hindi mo
kailangan ng Git o Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

Ilang minuto ang unang build. Kung na-clone mo na ang repository, puwede mo ring patakbuhin ang
`docker build -t pocketdimension .` sa folder nito. Gumagana rin nang walang Docker, direkta gamit
ang Node.js; nasa [README](../../README.tl.md#nang-walang-docker) ito.

### 2.1 Gamit ang `docker run`

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='isang-mahabang-password' \
  pocketdimension
```

Ang ibig sabihin ng mga linya:

| Linya                                 | Layunin                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | Maaabot ang web interface sa port 3000.                                           |
| `-v /var/run/docker.sock:…`           | Puwedeng kontrolin ng app ang Docker para magsimula ng mga game server.           |
| `-v pocketdimension-data:/app/shared` | Database ng mga user, laro at server. Kailangan mong i-back up ang volume na ito. |
| `--add-host …` at `QUERY_HOST`        | Naaabot ng app ang mga game server para kunin ang bilang ng player.               |
| `SECRET_JWT_KEY`                      | Lihim na key para sa mga login. Kailangan, hindi bababa sa 32 character.          |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | Ang unang administrator account. Gagawin ito sa unang start.                      |

> Gumawa ng `SECRET_JWT_KEY` nang isang beses at itago ito. Kapag nagbago ito, kailangang
> mag-login ulit ang lahat. Kaya mas mabuting itago ito sa isang file; tingnan ang Docker Compose
> sa ibaba.

### 2.2 Gamit ang Docker Compose (inirerekomenda)

Gumawa ng folder, halimbawa `/opt/pocketdimension`, na may dalawang file sa loob.

`.env`:

```bash
SECRET_JWT_KEY=dito-ang-resulta-ng-openssl-rand-base64-48
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=isang-mahabang-password
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

I-build at simulan gamit ang:

```bash
docker compose up -d --build
```

### 2.3 Unang login

Buksan ang `http://<address-ng-computer>:3000` at mag-login gamit ang `DB_ADMIN_EMAIL` (o ang
pangalang `admin`) at `DB_ADMIN_PASSWORD`. Pagkatapos, palitan ang password mo sa **Account** at
gawin ang mga account ng mga player mo sa **Account → Magdagdag ng user**.

Sa pinakaunang start lang ginagamit ang admin password mula sa `.env`. Puwede mo itong alisin sa
file pagkatapos.

Kung ano ang susunod (pagdagdag ng user, pag-enable ng laro, paggawa ng server) ay nasa
[manwal ng user](user-manual.md).

## 3. Sa home network lang

Para sa LAN party o home network, sapat na ang installation mula sa seksyon 2. Tatakbo ang app sa
simpleng `http`, na ayos lang sa loob ng sarili mong network.

- Bubuksan ng mga player ang `http://<ip-ng-computer>:3000`, halimbawa `http://192.168.0.10:3000`.
- Ang address na ipinapakita ng app sa mga player para kumonekta ay ang pangalang ginamit para
  buksan ang pahina. Para palaging pareho ang address, itakda ang `PUBLIC_HOST=192.168.0.10`.
- Kung sa home network lang dapat maabot ang mga laro kahit nakakonekta rin sa internet ang
  computer, itakda ang `PORT_BIND_IP` sa home network address ng computer, halimbawa
  `PORT_BIND_IP=192.168.0.10`. Sa ganoon, sa network interface lang na iyon ipa-publish ng Docker
  ang mga game port.

## 4. Pagpapatakbo sa internet

Kung maglalaro rin ang mga kaibigan mula sa labas, dapat nasa likod ng reverse proxy na may HTTPS
ang web interface. Hindi dumadaan sa proxy ang mga game port; direkta itong binubuksan.

### 4.1 Checklist

1. **Domain:** ituro ang isang domain sa public IP mo, halimbawa `games.example.com`.
2. **Reverse proxy na may HTTPS** sa harap ng port 3000 (may mga halimbawa sa ibaba). Huwag
   direktang buksan ang port 3000 sa internet.
3. **Mga setting ng app** sa `.env`:
   ```bash
   ORIGIN=https://games.example.com
   ADDRESS_HEADER=X-Forwarded-For
   XFF_DEPTH=1
   PUBLIC_HOST=games.example.com
   ```
   Ang `ORIGIN` ay ang public address. Tinitiyak ng `ADDRESS_HEADER` at `XFF_DEPTH` na nakikita ng
   pagharang pagkatapos ng sobrang daming login attempt ang totoong IP ng bisita at hindi ang sa
   proxy.
4. **Buksan ang mga game port:** sa router (port forwarding) at sa firewall ng computer, buksan ang
   mga port ng mga larong ginagamit ninyo. Nakalista ang mga port ng bawat server sa listahan ng
   server sa ilalim ng **Address para sa mga player**. Ang pangalawang server ng parehong laro ay
   may mga port na inusog nang 10 (halimbawa 25575 sa halip na 25565).
5. **Malakas na admin password** at mga mapagkakatiwalaang administrator lang.
6. **Opsyonal pero inirerekomenda:** gumamit ng
   [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) para walang buong access
   sa Docker ang app (tingnan ang 4.4).

Kapag binuksan ang pahina gamit ang HTTPS, awtomatikong ginagawang `Secure` ng app ang mga login
cookie nito at nagpapadala ito ng HSTS header.

### 4.2 Halimbawa: Caddy

Si Caddy na ang kukuha ng HTTPS certificate. Dagdagan ang `docker-compose.yml`:

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
    # tulad sa itaas, pero walang "ports:"

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

### 4.3 Halimbawa: nginx

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

Dito tumatakbo ang app gamit ang `-p 127.0.0.1:3000:3000`, kaya lokal lang naaabot ang port 3000.

### 4.4 Paglilimita ng access sa Docker

Sa halip na direktang i-mount ang Docker socket, puwedeng makipag-usap ang app sa Docker sa
pamamagitan ng socket proxy. Ang mga bahaging kailangan lang ng Pocket Dimension ang pinapayagan
ng proxy:

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
    # tulad sa itaas, pero walang Docker socket sa "volumes:"
    environment:
      DOCKER_HOST: tcp://docker-proxy:2375
```

Ang nakikita lang naman ng Pocket Dimension ay ang mga container na ito mismo ang gumawa o
nakakonekta sa network na `POCKET_DIMENSION_NETWORK`. Hindi nakikita ang lahat ng iba pang
container sa computer.

> **Sa totoo lang:** kahit sa pamamagitan ng socket proxy, puwede pa ring gumawa ng container ang
> app. Ang sinumang ganap na makakuha ng kontrol sa app ay puwede pa ring magsimula ng container na
> may buong karapatan. Pinapaliit ng proxy ang attack surface (walang access sa Swarm, secrets,
> plugins, `exec` at iba pa), pero hindi nito pinapalitan ang malakas na admin password at ang mga
> update. Huwag kailanman ikonekta ang socket proxy sa network na `POCKET_DIMENSION_NETWORK`, dahil
> maaabot ito ng mga game server.

### 4.5 Ano ang pinoprotektahan ng app at ano ang hindi

Pinatibay ang Pocket Dimension para tumakbo sa internet:

- **Login:** sine-save ang mga password gamit ang bcrypt. Pagkatapos ng 10 maling subok para sa
  iisang account mula sa iisang IP, at pagkatapos ng 50 maling subok sa kabuuan mula sa isang IP,
  hinaharangan ang login nang 15 minuto. Sa likod ng reverse proxy, gumagana lang ito kapag may
  `ADDRESS_HEADER` (tingnan ang 4.1); kung wala, nakikita ng app ang lahat ng bisita gamit ang IP ng
  proxy.
- **Proteksyon ng browser:** palaging naka-on ang Content Security Policy, ang proteksyon laban sa
  pag-embed sa ibang site at ang proteksyon ng form laban sa cross-site request. Ang mga login
  cookie ay `HttpOnly` at, sa HTTPS, `Secure`.
- **Container ng app:** sinisimulan ng image ang app bilang ordinaryong user na `node`, hindi
  bilang `root`. Sa pagsisimula, kinukuha lang nito ang data directory at sumasali sa grupo ng
  Docker socket; pagkatapos ay binibitawan na ang lahat ng pribilehiyo.
- **Mga game server:** bawat server ay tumatakbo sa sariling container nang walang espesyal na
  karapatan (`no-new-privileges`, walang raw socket, limit ng proseso, memory limit ng template).
  Hindi puwedeng mag-mount ang mga game template ng `privileged`, ng mga folder ng computer o ng
  Docker socket, kundi ng sarili lang nilang Docker volume. Hindi nagkakaabot ang mga game server
  ng magkakaibang user sa network na `POCKET_DIMENSION_NETWORK`, kaya halimbawa nananatiling
  pribado ang mga RCON port.
- **Mga download:** binabasa lang ang catalog ng mga laro at ang mga thumbnail, may limit ang laki,
  at hindi kailanman kinukuha ang mga thumbnail mula sa sarili mong network.

Ang mga dapat mong bantayan:

- Puwedeng maglagay ang mga **administrator** ng kahit anong Docker image bilang laro. Nakakulong
  ang takbo ng image, pero kaya nitong gawin ang lahat ng kayang gawin ng isang program sa internet
  at sa home network mo. Ibigay lang ang admin rights sa mga taong pagkakatiwalaan mo sa computer.
- **Naaabot ng mga game server ang home network mo.** Puwedeng makipag-usap ang mga Docker
  container sa ibang device sa lokal na network (router, NAS). Para maiwasan ito, patakbuhin ang
  Pocket Dimension sa hiwalay na computer o sa hiwalay na network segment (VLAN, guest network).
- **CPU:** limitado ang memory bawat laro, pero hindi ang CPU time. Puwedeng pabagalin ng
  nag-hang na server ang computer; nakakatulong ang **Ihinto**.
- **Shared catalog:** awtomatikong nag-a-update ang mga laro mula sa catalog, kasama ang ibang
  image. Kung ayaw mo nito, itakda ang `CATALOG_SYNC_HOURS=0` at mag-update gamit ang button, o
  `CATALOG_URL=` (walang laman) para hindi na tingnan ang catalog.
- **Mga update:** palaging nagbabago ang mga game image. Kinukuha ng server ang pinakabagong image
  kapag ginawa ito; nananatili sa dating bersyon ang mga umiiral na server hanggang burahin at
  gawin mo ulit ang mga ito.

## 5. Lahat ng setting

Mga environment variable ang lahat ng setting. May template na may mga komento sa
[`.env.example`](../../.env.example).

| Variable                  | Default                          | Kahulugan                                                                                                  |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_KEY`          | –                                | Kailangan sa production. Random na text, hindi bababa sa 32 character.                                     |
| `DB_ADMIN_USER`           | `admin`                          | Pangalan ng unang administrator (para mag-login sa halip na email).                                        |
| `DB_ADMIN_EMAIL`          | –                                | Email ng unang administrator.                                                                              |
| `DB_ADMIN_PASSWORD`       | –                                | Password ng unang administrator, sa unang start lang kailangan.                                            |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | Lokasyon ng database.                                                                                      |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | Gaano katagal valid ang login (segundo).                                                                   |
| `ORIGIN`                  | –                                | Public address sa likod ng reverse proxy, hal. `https://games.example.com`.                                |
| `ADDRESS_HEADER`          | –                                | Header na may totoong IP ng bisita sa likod ng proxy, kadalasan `X-Forwarded-For`.                         |
| `XFF_DEPTH`               | –                                | Bilang ng proxy sa harap ng app, kadalasan `1`.                                                            |
| `DOCKER_HOST`             | lokal na socket                  | Ibang Docker address, hal. socket proxy.                                                                   |
| `MAX_SERVERS_PER_USER`    | `2`                              | Ilang server ang puwedeng magkaroon ang player na walang admin rights. Walang limit ang mga administrator. |
| `PUBLIC_HOST`             | address ng pahina                | Address na ipinapakita sa mga player para kumonekta.                                                       |
| `PORT_BIND_IP`            | lahat ng network interface       | Network interface kung saan ipa-publish ang mga game port.                                                 |
| `QUERY_HOST`              | `127.0.0.1`                      | Address kung saan naaabot ng app ang mga na-publish na game port para sa live status (tingnan ang 7.1).    |
| `PORT_OFFSET_STEP`        | `10`                             | Hakbang ng pag-usog ng mga port ng karagdagang server ng parehong laro.                                    |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | Ang `false` ay nagsisimula ng mga laro nang walang memory limit ng template nila.                          |
| `CATALOG_URL`             | catalog sa GitHub repository     | Address ng shared catalog ng mga laro (tingnan ang 7.2). Walang laman = mga larong kasama ng app lang.     |
| `CATALOG_SYNC_HOURS`      | `24`                             | Mga oras sa pagitan ng awtomatikong pagtingin sa catalog. `0` = gamit ang button lang.                     |

## 6. Update, backup at log

### Update

```bash
docker compose build --pull --no-cache pocketdimension
docker compose up -d
```

Tinitiyak ng `--no-cache` na kukunin ng Docker ang pinakabagong bersyon mula sa GitHub. Kung
`docker run` ang gamit mo, i-build ulit ang image gaya sa seksyon 2, alisin ang lumang container
gamit ang `docker rm -f pocketdimension` at simulan ito gamit ang parehong command tulad dati.
Mananatili ang database at mga game server basta pareho ang volume na `pocketdimension-data` na
ini-mount mo.

Hindi hinihinto nito ang mga tumatakbong game server. Pagkatapos ng ilang update, kailangang
mag-login ulit ang lahat ng user.

**Paalala para sa mga installation bago ang Oktubre 2026:** mula nang security update, hindi na
tumatakbo bilang `root` ang app sa loob ng container nito. Sa unang start, awtomatiko nitong kinukuha
ang data directory; wala kang kailangang gawin. Pinaghihiwalay din nito ang mga game server sa
network. Sa mga umiiral na installation, may epekto lang ito kapag ginawa ulit ang network;
binabanggit ito ng app sa log nito ("lets game servers reach each other"). Ganito ito gawin ulit
habang tuloy ang takbo ng mga game server:

```bash
docker compose stop pocketdimension
servers=$(docker ps -aq --filter network=POCKET_DIMENSION_NETWORK)
for c in $servers; do docker network disconnect POCKET_DIMENSION_NETWORK "$c"; done
docker network rm POCKET_DIMENSION_NETWORK
docker network create -o com.docker.network.bridge.enable_icc=false POCKET_DIMENSION_NETWORK
for c in $servers; do docker network connect POCKET_DIMENSION_NETWORK "$c"; done
docker compose up -d
```

### Backup

Regular na i-back up ang:

- ang volume na `pocketdimension-data` (mga user, game template, listahan ng server),
- ang mga volume ng mga game server. Ang pangalan nila ay `pocketdimension-server-<numero>-<index>`
  at nandoon ang mga mundo at save.

Halimbawa para sa isang volume:

```bash
docker run --rm -v pocketdimension-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/pocketdimension-data.tar.gz -C /data .
```

Ihinto muna ang game server bago i-back up ang volume nito para kumpleto ang save.

### Log

```bash
docker logs pocketdimension                  # ang app
docker logs pocketdimension-minecraft-java-3 # isang game server
```

Nakalista ang pangalan ng container ng isang game server sa **Mga container** (para sa mga
administrator lang).

---

## 7. Bilang ng player at catalog ng mga laro

### 7.1 Bilang ng player (live status)

Para sa bilang ng player, tinatanong ng app ang mga game server gamit ang
[GameDig](https://github.com/gamedig/node-gamedig). Kung aling mga laro ang sumusuporta rito ay
nakalista sa [manwal ng user](user-manual.md#mga-live-na-halaga).

Sabay na sinusubukan ng app ang bawat server sa dalawang paraan:

1. direkta sa Docker network na `POCKET_DIMENSION_NETWORK`, na ang app mismo ang gumagawa sa
   pagsisimula,
2. sa pamamagitan ng na-publish na port sa `QUERY_HOST`.

Kung tumatakbo mismo sa Docker ang app, kailangan ng pangalawang paraan ang
`QUERY_HOST=host.docker.internal` at `--add-host host.docker.internal:host-gateway` (o
`extra_hosts` sa Compose). Pareho na itong nasa mga halimbawa sa seksyon 2. Kung direktang
tumatakbo ang app sa computer nang walang Docker, sapat na ang default na `127.0.0.1`.

### 7.2 Shared catalog ng mga laro

Galing ang mga laro sa catalog na ginagamit ng lahat ng Pocket Dimension installation. Pampubliko
ito sa folder na [`catalog/`](../../catalog/) ng GitHub repository. Dina-download lang ng app ang
`catalog/catalog.json`, read-only: walang account, walang key at walang bayad. Walang ipinapadalang
data tungkol sa installation mo.

- **Kasama na:** isinasama rin sa image ang mga laro ng catalog kapag bini-build ang app. Kahit
  walang internet o walang laman ang `CATALOG_URL`, palaging available ang mga kasamang laro.
- **Pagtingin:** sa pagsisimula at pagkatapos ay bawat `CATALOG_SYNC_HOURS` na oras (default 24).
  Kapag `CATALOG_SYNC_HOURS=0`, kapag pinindot lang ng administrator ang **I-update ang catalog**.
- Dumarating na naka-disable ang mga **bagong laro**; ang administrator ang mag-e-enable ng mga ito.
  Kung ano ang hitsura nito sa interface ay nasa
  [manwal ng user, seksyon 13](user-manual.md#13-ang-shared-catalog-ng-mga-laro).
- **Sariling catalog:** para magkaroon ng sariling pagpipilian, i-fork ang repository at itakda
  ang `CATALOG_URL` sa sarili mong `catalog.json`, hal.
  `https://raw.githubusercontent.com/<pangalan>/PocketDimension/main/catalog/catalog.json`.
- **Pag-ambag ng laro:** tingnan ang [`catalog/README.md`](../../catalog/README.md).

---

## 8. Pag-aayos ng problema

**"Hindi maabot ang Docker"**
Hindi maabot ng app ang Docker. Tingnan kung naka-mount ang Docker socket
(`-v /var/run/docker.sock:/var/run/docker.sock`), o kung tama ang `DOCKER_HOST` at tumatakbo ang
socket proxy.

**Nakasulat sa log ang "the Docker socket … is not group-writable; the app keeps running as root"**
`root` lang ang pinapayagan ng na-mount na Docker socket, kaya hindi mabitawan ng app ang mga
pribilehiyo nito. Gumagana pa rin ito. Mas mabuti: gumamit ng socket proxy (seksyon 4.4).

**"Masyadong maraming pagsubok mag-login" kahit tama ang password**
Pagkatapos ng sobrang daming maling subok mula sa isang IP, hinaharangan ito ng app nang 15 minuto.
Kung tinatamaan nito ang lahat ng user nang sabay, kulang ang `ADDRESS_HEADER` sa likod ng reverse
proxy (seksyon 4.1). Agad na inaalis ang harang kapag ni-restart ang app.

**Naiipit ang server sa "Nagda-download"**
Matagal ang malalaking image. Gamit ang `docker pull <image>` sa computer, makikita mo ang progreso.
Kung pumalya ang download, magpapakita ang card ng error at **Subukan ulit**.

**"Error" ang ipinapakita ng server**
Sinasabi ng mensahe sa card ang dahilan, gaya ng maling image o ginagamit nang port. Ayusin ang
dahilan at i-click ang **Subukan ulit**. Makikita ang log ng laro gamit ang
`docker logs <pangalan-ng-container>`.

**Hindi makakonekta ang mga kaibigan**

- **Tumatakbo** ba ang server?
- Naka-forward ba sa router at bukas sa firewall ang mga port mula sa **Address para sa mga
  player**? Bantayan ang protocol (`tcp` o `udp`).
- Tama ba ang pangalang ipinapakita ng address? Kung hindi, itakda ang `PUBLIC_HOST`.

**Nananatili sa "Hindi pa sumasagot ang server" ang bilang ng player**

- Nagsisimula pa ang laro. Maghintay nang ilang minuto.
- Kung tumatakbo sa Docker ang app, tingnan ang `QUERY_HOST` at `--add-host` (seksyon 7.1).
- Puwedeng harangin ng firewall sa computer ang query.

**Pagkatapos magpadala ng form, lumalabas ang "Cross-site POST form submissions are forbidden"**
Hindi tugma ang address sa browser sa `ORIGIN`. Itakda ang `ORIGIN` sa eksaktong address na
ginagamit para buksan ang pahina, o alisin ang variable kung wala kang reverse proxy.

**Nakalimutan ang password ng administrator**
Puwede itong i-reset ng ibang administrator sa **Account → Mga user**. Kung wala, simulan ang app
nang isang beses gamit ang bagong `DB_ADMIN_EMAIL`, bagong `DB_ADMIN_USER` at `DB_ADMIN_PASSWORD`;
gagawa ito ng karagdagang administrator account.

**May nakitang bug?**
I-ulat ito sa
[github.com/damaurer/PocketDimension/issues](https://github.com/damaurer/PocketDimension/issues) o
gamit ang **Mag-ulat ng problema** sa ibaba ng app.
