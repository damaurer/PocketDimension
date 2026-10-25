# PocketDimension

[English](README.md) · **Deutsch** · [Español](README.es.md) · [Tagalog](README.tl.md)

Selbst gehostete Web-App, um Gameserver als Docker-Container zu starten und zu verwalten.

Spiel aus dem Katalog wählen, dem Server einen Namen geben, und PocketDimension lädt das Image,
startet den Server in einem eigenen Container und zeigt, wer gerade spielt, dazu CPU- und
Speicherverbrauch. Gedacht ist die App für eine Gruppe von Freunden: Ein Administrator legt die
Konten an, jeder Spieler darf eine begrenzte Zahl von Servern betreiben, und die App ist für das
öffentliche Internet abgesichert, läuft aber genauso gut im Heimnetz.

Oberfläche und Handbücher gibt es auf Englisch, Deutsch, Spanisch und Tagalog.

| Handbuch                                                                                                                                                    | Für                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Benutzerhandbuch: [DE](docs/de/user-manual.md) · [EN](docs/en/user-manual.md) · [ES](docs/es/user-manual.md) · [TL](docs/tl/user-manual.md)                 | Spieler und Administratoren, die die Weboberfläche benutzen                  |
| Bedienerhandbuch: [DE](docs/de/operator-manual.md) · [EN](docs/en/operator-manual.md) · [ES](docs/es/operator-manual.md) · [TL](docs/tl/operator-manual.md) | Wer die App installiert und betreibt: Reverse Proxy, HTTPS, Backups, Updates |

## Voraussetzungen

- Ein Linux-Rechner mit [Docker Engine](https://docs.docker.com/engine/install/) 24 oder neuer
  (Docker Desktop unter Windows oder macOS reicht zum Ausprobieren).
- Genug Arbeitsspeicher für die gewünschten Spiele: Jedes Spiel nennt sein Limit, z. B. 3 GB für
  Minecraft oder 16 GB für Palworld. Die App selbst braucht etwa 200 MB.
- Genug Speicherplatz; manche Spiele laden beim ersten Start viel herunter (Counter-Strike 2 etwa
  60 GB).
- Internetzugang für den Rechner, damit Docker die Spiel-Images laden kann.
- Nur für den Betrieb ohne Docker: Node.js 22.17 oder neuer.

## Schnellstart mit Docker

**1. Image bauen.** Docker holt den Quellcode selbst; weder Git noch Node.js sind nötig:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

(Oder `docker build -t pocketdimension .` in einem Klon.)

**2. Geheimen Schlüssel erzeugen** und aufbewahren. Ändert er sich, müssen sich alle neu anmelden:

```bash
openssl rand -base64 48
```

**3. App starten:**

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY='<der Schlüssel aus Schritt 2>' \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='ein-langes-passwort' \
  pocketdimension
```

| Zeile                                 | Wozu                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | Die Weboberfläche lauscht auf Port 3000.                                                        |
| `-v /var/run/docker.sock:…`           | Damit kann die App Gameserver-Container starten und stoppen.                                    |
| `-v pocketdimension-data:/app/shared` | Die SQLite-Datenbank (Benutzer, Spiele, Server). Dieses Volume sichern.                         |
| `--add-host …` und `QUERY_HOST`       | Damit erreicht die App die veröffentlichten Spiel-Ports und zeigt Spieler, Karte und Version.   |
| `SECRET_JWT_KEY`                      | Signiert die Anmeldungen. Pflicht, mindestens 32 Zeichen; ohne ihn schlägt jede Anmeldung fehl. |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | Der erste Administrator, wird beim ersten Start angelegt, wenn die E-Mail noch nicht existiert. |

**4. Anmelden** unter `http://<host>:3000` mit der Admin-E-Mail (oder dem Namen `admin`) und dem
Passwort. Unter **Konto** das Passwort ändern und dort unter **Benutzer hinzufügen** die Spieler
anlegen. Das Admin-Passwort aus der Umgebung wird nur beim allerersten Start benutzt und kann
danach entfernt werden.

**5. Spiel-Ports öffnen.** Spieler verbinden sich direkt mit den Spiel-Ports, nicht über die
Web-App. Jede Serverkarte zeigt Adresse und Ports unter **Adresse für Spieler**; diese in der
Firewall öffnen und für Spieler außerhalb des eigenen Netzes im Router weiterleiten. Auf das
Protokoll achten (`tcp` oder `udp`). Ein zweiter Server desselben Spiels bekommt um 10 verschobene
Ports (z. B. 25575 statt 25565).

### Docker Compose

Die Einstellungen in eine `.env`-Datei neben der `docker-compose.yml` schreiben:

```bash
SECRET_JWT_KEY=<Ausgabe von openssl rand -base64 48>
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=ein-langes-passwort
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

### Aktualisieren

```bash
docker compose build --pull --no-cache pocketdimension && docker compose up -d
```

Mit einfachem `docker run`: Image neu bauen (Schritt 1), `docker rm -f pocketdimension` und mit
demselben Befehl und Volume wieder starten. Laufende Gameserver laufen während des Updates weiter.

## Öffentliches Internet oder Heimnetz

- **Heimnetz / LAN-Party:** Der Schnellstart genügt. Einfaches `http` ist im eigenen Netz in
  Ordnung. `PUBLIC_HOST` auf die Adresse setzen, die Spieler sehen sollen (z. B. `192.168.0.10`),
  und `PORT_BIND_IP` auf die LAN-Adresse des Rechners, wenn die Spiel-Ports nicht auf anderen
  Schnittstellen veröffentlicht werden sollen.
- **Internet:** Die Weboberfläche hinter einen Reverse Proxy mit HTTPS stellen (Port 3000 selbst
  nicht freigeben) und setzen:

  ```bash
  ORIGIN=https://games.example.com
  ADDRESS_HEADER=X-Forwarded-For
  XFF_DEPTH=1
  PUBLIC_HOST=games.example.com
  ```

  `ORIGIN` muss exakt der Adresse im Browser entsprechen, sonst scheitern Formulare mit
  „Cross-site POST form submissions are forbidden“. Mit `ADDRESS_HEADER` sieht die
  Anmeldebegrenzung die echte Client-Adresse statt der des Proxys. Über HTTPS markiert die App
  ihre Cookies als `Secure` und sendet HSTS. Fertige Beispiele für Caddy und nginx, ein Aufbau mit
  docker-socket-proxy und die Liste der Risiken, die beim Betreiber bleiben, stehen im
  [Bedienerhandbuch, Abschnitt 4](docs/de/operator-manual.md#4-im-internet-betreiben).

## Konfiguration

Alle Einstellungen sind Umgebungsvariablen; [`.env.example`](.env.example) enthält sie mit
Kommentaren.

| Variable                  | Standard                          | Bedeutung                                                                                              |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `SECRET_JWT_KEY`          | –                                 | **Pflicht im Produktivbetrieb.** Zufällige Zeichenkette, mindestens 32 Zeichen.                        |
| `DB_ADMIN_EMAIL`          | –                                 | E-Mail des ersten Administrators, wird beim Start angelegt, falls noch nicht vorhanden.                |
| `DB_ADMIN_PASSWORD`       | –                                 | Passwort dieses Administrators. Wird nur beim Anlegen des Kontos gelesen.                              |
| `DB_ADMIN_USER`           | `admin`                           | Anmeldename dieses Administrators.                                                                     |
| `DB_PATH`                 | `/app/shared/pocketdimension.db`  | SQLite-Datenbankdatei (`shared/pocketdimension.db` außerhalb von Docker).                              |
| `SESSION_MAX_AGE_SECONDS` | `86400`                           | Wie lange eine Anmeldung gültig bleibt.                                                                |
| `PORT`, `HOST`            | `3000`, `0.0.0.0`                 | Wo die Weboberfläche lauscht.                                                                          |
| `ORIGIN`                  | –                                 | Öffentliche URL hinter einem Reverse Proxy, z. B. `https://games.example.com`.                         |
| `ADDRESS_HEADER`          | –                                 | Header mit der Client-IP hinter einem Proxy, meist `X-Forwarded-For`.                                  |
| `XFF_DEPTH`               | –                                 | Anzahl der Proxys vor der App, meist `1`.                                                              |
| `DOCKER_HOST`             | lokaler Socket                    | Docker-API, z. B. `tcp://docker-proxy:2375` für einen docker-socket-proxy.                             |
| `MAX_SERVERS_PER_USER`    | `2`                               | Server, die ein Spieler ohne Admin-Rolle besitzen darf. Administratoren haben kein Limit.              |
| `PUBLIC_HOST`             | Hostname der App-URL              | Adresse, die Spielern zum Verbinden angezeigt wird.                                                    |
| `PORT_BIND_IP`            | alle Schnittstellen               | Schnittstelle des Hosts, auf der die Spiel-Ports veröffentlicht werden.                                |
| `QUERY_HOST`              | `127.0.0.1`                       | Wo die App veröffentlichte Spiel-Ports für den Live-Status erreicht; in Docker `host.docker.internal`. |
| `PORT_OFFSET_STEP`        | `10`                              | Port-Verschiebung für jeden weiteren Server desselben Spiels.                                          |
| `ENFORCE_MEMORY_LIMITS`   | `true`                            | `false` startet Spiel-Container ohne ihr Speicherlimit.                                                |
| `CATALOG_URL`             | `catalog/catalog.json` auf GitHub | Gemeinsamer Spielekatalog. Leer = nur die mitgelieferten Spiele, kein Netzwerkzugriff.                 |
| `CATALOG_SYNC_HOURS`      | `24`                              | Stunden zwischen Katalog-Updates; `0` = nur über den Knopf.                                            |
| `OIDC_ISSUER`             | –                                 | Single Sign-on: Issuer-Adresse des OpenID-Connect-Anbieters (siehe 9).                                 |
| `OIDC_CLIENT_ID`          | –                                 | Beim Anbieter registrierte Client-ID.                                                                  |
| `OIDC_CLIENT_SECRET`      | –                                 | Client Secret; leer bei einem öffentlichen Client.                                                     |
| `OIDC_NAME`               | `SSO`                             | Name auf dem Anmeldeknopf („Mit … anmelden").                                                          |
| `OIDC_SCOPES`             | `openid email profile`            | Beim Anbieter angefragte Scopes.                                                                       |
| `OIDC_AUTO_CREATE`        | `true`                            | `false` = nur vorhandene Konten können sich anmelden.                                                  |
| `OIDC_ROLES_CLAIM`        | `roles`                           | Claim mit Rollen oder Gruppen, z. B. `realm_access.roles`.                                             |
| `OIDC_ADMIN_ROLE`         | –                                 | Rolle oder Gruppe, die zum Administrator macht. Leer = Rollen werden in der App verwaltet.             |
| `LOCAL_LOGIN`             | `true`                            | `false` = nur Single Sign-on (wenn OIDC eingerichtet ist).                                             |

Das Docker-Netzwerk `POCKET_DIMENSION_NETWORK` legt die App beim ersten Start selbst an; dafür
gibt es nichts einzustellen.

### Single Sign-on (OpenID Connect)

Optionale Anmeldung über Keycloak oder einen anderen OpenID-Connect-Anbieter, zusätzlich zur
normalen Anmeldung mit Passwort. Registriere einen Client mit der Redirect-URI
`https://<deine-app>/auth/oidc/callback` und setze:

```bash
OIDC_ISSUER=https://sso.example.com/realms/games
OIDC_CLIENT_ID=pocketdimension
OIDC_CLIENT_SECRET=...
OIDC_NAME=Keycloak
```

Neue Benutzer bekommen bei der ersten Anmeldung ein Konto; ein vorhandenes Konto wird verknüpft,
wenn der Anbieter die E-Mail bestätigt hat. Mit `OIDC_ADMIN_ROLE` folgt die Administratorrolle dem
Anbieter. Die Keycloak-Einrichtung Schritt für Schritt steht im
[Bedienerhandbuch, Abschnitt 9](docs/de/operator-manual.md#9-single-sign-on).

## Ohne Docker

Die App läuft auch direkt mit Node.js 22.17 oder neuer. Docker wird auf demselben Rechner trotzdem
für die Gameserver gebraucht, und der Benutzer, unter dem die App läuft, braucht Zugriff auf den
Docker-Socket (z. B. Mitgliedschaft in der Gruppe `docker`).

```bash
git clone https://github.com/damaurer/PocketDimension.git
cd PocketDimension
cp .env.example .env      # SECRET_JWT_KEY, DB_ADMIN_EMAIL und DB_ADMIN_PASSWORD setzen
npm ci
npm run build
NODE_ENV=production node --env-file=.env server.js
```

Die Datenbank landet in `shared/pocketdimension.db`. `QUERY_HOST` kann hier auf dem Standard
bleiben. Für den Dauerbetrieb einen systemd-Dienst oder einen Prozessmanager nach Wahl verwenden.

## Backup und Logs

- Das Volume `pocketdimension-data` und die Gameserver-Volumes
  `pocketdimension-server-<id>-<index>` (Welten und Spielstände) sichern; einen Server vor dem
  Sichern stoppen.
- `docker logs pocketdimension` zeigt das Log der App, `docker logs <container>` das Log eines
  Gameservers. Administratoren finden die Containernamen in der App unter **Container**.

Details und Befehle: [Bedienerhandbuch, Abschnitt 6](docs/de/operator-manual.md#6-update-backup-und-logs).

## Fehlerbehebung

| Symptom                                                     | Lösung                                                                                                                                                                            |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anmeldung scheitert, Log sagt „SECRET_JWT_KEY must be set“  | `SECRET_JWT_KEY` mit mindestens 32 Zeichen setzen.                                                                                                                                |
| „Docker ist nicht erreichbar“                               | `/var/run/docker.sock` einbinden oder `DOCKER_HOST` korrigieren.                                                                                                                  |
| „Cross-site POST form submissions are forbidden“            | `ORIGIN` passt nicht zur URL im Browser; korrigieren oder ohne Proxy weglassen.                                                                                                   |
| Karte zeigt dauerhaft „Der Server antwortet noch nicht“     | Große Spiele fertig starten lassen; in Docker `QUERY_HOST` und `--add-host` prüfen.                                                                                               |
| Freunde können sich nicht verbinden                         | Spiel-Ports mit dem richtigen Protokoll öffnen/weiterleiten; `PUBLIC_HOST` setzen, wenn die Adresse falsch ist.                                                                   |
| Hinter einem Proxy sind nach Fehlversuchen alle ausgesperrt | `ADDRESS_HEADER` und `XFF_DEPTH` setzen; ein Neustart der App hebt die Sperre auf.                                                                                                |
| Admin-Passwort vergessen                                    | Ein anderer Admin setzt es unter **Konto** zurück; sonst einmal mit neuen `DB_ADMIN_EMAIL`, `DB_ADMIN_USER` und `DB_ADMIN_PASSWORD` starten, um einen weiteren Admin zu bekommen. |

Mehr im [Bedienerhandbuch, Abschnitt 8](docs/de/operator-manual.md#8-fehlerbehebung).

## Spiele

Der Katalog bringt Minecraft (Java und Bedrock), Valheim, Terraria, Factorio, Counter-Strike 2,
Team Fortress 2, Palworld, Satisfactory, Rust, Core Keeper, Project Zomboid, 7 Days to Die,
Enshrouded, V Rising, ARK: Survival Evolved, Sons of the Forest, Necesse, OpenTTD und OpenRA mit.
Administratoren können diese deaktivieren und jedes andere Spiel, das in Docker läuft, unter
**Spiele → Neue Spielvorlage** hinzufügen (Image, Ports, Datenverzeichnisse und die Variablen, die
Spieler setzen dürfen). Jeder Server bekommt eigene Docker-Volumes; ein zweiter Server desselben
Spiels bekommt verschobene Ports (z. B. 25575 statt 25565).

### Gemeinsamer Spielekatalog

Die Spiele stammen aus [`catalog/`](catalog/), einem Katalog, den alle PocketDimension-Installationen
teilen. Jede Instanz bringt den Katalog im Stand ihres Builds mit und lädt einmal am Tag
`catalog/catalog.json` aus diesem Repository, nur lesend und ohne Konto oder Schlüssel. Neue Spiele
kommen deaktiviert an, bis ein Administrator sie aktiviert; eigene Vorlagen werden nie angefasst.
`CATALOG_URL` auf einen Fork zeigen lassen oder leer setzen, um offline zu bleiben. Um ein Spiel
für alle hinzuzufügen, es auf seiner Bearbeiten-Seite exportieren und einen Pull Request öffnen,
siehe [`catalog/README.md`](catalog/README.md).

### Live-Status

Die Serverliste zeigt CPU und Speicher jedes laufenden Servers. Für Spiele mit Abfrageprotokoll
([GameDig](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md)-ID in der Vorlage)
zeigt sie außerdem verbundene Spieler, Karte und Version. Die App fragt jedes Spiel direkt im
Netzwerk `POCKET_DIMENSION_NETWORK` und gleichzeitig über seinen veröffentlichten Port auf
`QUERY_HOST` ab (Standard `127.0.0.1`). Läuft die App selbst in Docker, sorgen die Zeilen
`--add-host` und `QUERY_HOST` oben dafür, dass sie die veröffentlichten Ports erreicht. Spiele ohne
Abfrageprotokoll zeigen nur CPU, Speicher und ob sie laufen.

### Zugriff auf Docker

PocketDimension sieht nur Container, die es selbst angelegt hat (Label
`pocketdimension.managed=true`), und Container im Netzwerk `POCKET_DIMENSION_NETWORK`. Zugriff auf
den Docker-Socket entspricht Root-Rechten auf dem Host: Bei Installationen im Internet die App
hinter einem HTTPS-Reverse-Proxy betreiben und einen
[docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) über `DOCKER_HOST` erwägen.

Das Image führt die App als unprivilegierten Benutzer `node` aus; es startet nur als root, um das
Daten-Volume zu übernehmen und der Gruppe des eingebundenen Docker-Sockets beizutreten.
Spiel-Container bekommen keine zusätzlichen Rechte (`no-new-privileges`, keine Raw-Sockets, keine
Host-Pfade) und können sich in `POCKET_DIMENSION_NETWORK` nicht gegenseitig erreichen. Was
abgedeckt ist und was nicht, steht in
[Abschnitt 4.5 des Bedienerhandbuchs](docs/de/operator-manual.md#45-was-die-app-absichert-und-was-nicht).

## Entwicklung

```bash
cp .env.example .env   # DB_ADMIN_* ausfüllen (SECRET_JWT_KEY ist in der Entwicklung optional)
npm install
npm run dev
```

| Befehl                     | Was er tut                                       |
| -------------------------- | ------------------------------------------------ |
| `npm run lint`             | Prettier und ESLint                              |
| `npm run check`            | Typprüfung (svelte-check)                        |
| `npm run test:unit`        | Unit-Tests (Vitest)                              |
| `npm run test:integration` | Browsertests gegen einen Build (Playwright)      |
| `npm run build`            | Produktions-Build, Start mit `node server.js`    |
| `npm run catalog:check`    | Gemeinsamen Spielekatalog prüfen                 |
| `npm run catalog:build`    | `catalog/catalog.json` aus den Spielen neu bauen |

**Übersetzungen:** Die Oberflächentexte liegen in `src/lib/i18n/translations/` (`en`, `de`, `es`,
`tl`), Servermeldungen in `src/lib/i18n/messages.ts` und Spieltexte in `src/lib/i18n/catalog.ts`.
Die Unit-Tests schlagen fehl, wenn ein Text in einer Sprache fehlt. Die Handbücher liegen in
`docs/<sprache>/`; Englisch ist die Hauptfassung.
