# Pocket Dimension – Bedienerhandbuch

[English](../en/operator-manual.md) · **Deutsch** · [Español](../es/operator-manual.md) ·
[Tagalog](../tl/operator-manual.md)

Pocket Dimension ist eine Web-App, mit der du und deine Mitspieler eigene Gameserver mit einem Klick
starten. Jeder Server läuft als eigener Docker-Container auf deinem Rechner oder Server. Die App
zeigt, wer gerade spielt, und wie viel CPU und Arbeitsspeicher jeder Server braucht.

Dieses Bedienerhandbuch richtet sich an die Person, die Pocket Dimension installiert und betreibt.
Wie Spieler und Administratoren die Oberfläche bedienen, steht im
[Benutzerhandbuch](user-manual.md).

## Inhalt

- [1. Voraussetzungen](#1-voraussetzungen)
- [2. Installation](#2-installation)
- [3. Nur im Heimnetz betreiben](#3-nur-im-heimnetz-betreiben)
- [4. Im Internet betreiben](#4-im-internet-betreiben)
  - [4.5 Was die App absichert und was nicht](#45-was-die-app-absichert-und-was-nicht)
- [5. Alle Einstellungen](#5-alle-einstellungen)
- [6. Update, Backup und Logs](#6-update-backup-und-logs)
- [7. Spieleranzeige und Spielekatalog](#7-spieleranzeige-und-spielekatalog)
- [8. Fehlerbehebung](#8-fehlerbehebung)
- [9. Single Sign-on](#9-single-sign-on)

---

## 1. Voraussetzungen

- Ein Linux-Rechner mit [Docker](https://docs.docker.com/engine/install/) (Docker Engine 24 oder
  neuer). Windows und macOS mit Docker Desktop funktionieren für Tests ebenfalls.
- Genug Arbeitsspeicher für die Spiele, die laufen sollen. Jede Spielvorlage nennt ihr Speicherlimit,
  zum Beispiel 3 GB für Minecraft oder 16 GB für Palworld. Rechne für die App selbst etwa 200 MB.
- Genug Speicherplatz. Manche Spiele laden beim ersten Start viel herunter (Counter-Strike 2 etwa
  60 GB).
- Internetzugang für den Rechner, damit Docker die Spiele-Images herunterladen kann.

> **Wichtig:** Pocket Dimension braucht Zugriff auf Docker. Wer die App administriert, kann damit
> beliebige Container starten. Gib Administratorrechte deshalb nur Personen, denen du auch den
> Rechner anvertrauen würdest.

## 2. Installation

Pocket Dimension läuft als Docker-Container. Das Image baust du einmal selbst aus dem
GitHub-Repository; Docker lädt den Quellcode dafür selbst herunter, du brauchst weder Git noch
Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

Das dauert beim ersten Mal ein paar Minuten. Wer das Repository schon geklont hat, kann im Ordner
auch `docker build -t pocketdimension .` ausführen. Ohne Docker, direkt mit Node.js, geht es
ebenfalls; das steht im [README](../../README.de.md#ohne-docker).

### 2.1 Mit `docker run`

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='ein-langes-passwort' \
  pocketdimension
```

Was die Zeilen bedeuten:

| Zeile                                 | Zweck                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `-p 3000:3000`                        | Die Weboberfläche ist unter Port 3000 erreichbar.                             |
| `-v /var/run/docker.sock:…`           | Die App darf Docker steuern, um Gameserver zu starten.                        |
| `-v pocketdimension-data:/app/shared` | Datenbank mit Benutzern, Spielen und Servern. Dieses Volume musst du sichern. |
| `--add-host …` und `QUERY_HOST`       | Die App erreicht die Gameserver, um Spielerzahlen abzufragen.                 |
| `SECRET_JWT_KEY`                      | Geheimer Schlüssel für Anmeldungen. Pflicht, mindestens 32 Zeichen.           |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | Das erste Administratorkonto. Es wird beim ersten Start angelegt.             |

> Erzeuge `SECRET_JWT_KEY` einmal und bewahre ihn auf. Ändert er sich, müssen sich alle neu
> anmelden. Lege ihn deshalb besser in einer Datei ab, siehe Docker Compose unten.

### 2.2 Mit Docker Compose (empfohlen)

Lege einen Ordner an, zum Beispiel `/opt/pocketdimension`, und darin zwei Dateien.

`.env`:

```bash
SECRET_JWT_KEY=hier-das-ergebnis-von-openssl-rand-base64-48
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=ein-langes-passwort
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

Bauen und starten mit:

```bash
docker compose up -d --build
```

### 2.3 Erste Anmeldung

Öffne `http://<adresse-des-rechners>:3000` und melde dich mit `DB_ADMIN_EMAIL` (oder dem Namen
`admin`) und `DB_ADMIN_PASSWORD` an. Ändere danach unter **Konto** dein Passwort und lege unter
**Konto → Benutzer hinzufügen** die Konten deiner Mitspieler an.

Das Admin-Passwort aus der `.env` wird nur beim allerersten Start verwendet. Du kannst es danach aus
der Datei entfernen.

Wie es dann weitergeht (Benutzer anlegen, Spiele freischalten, Server erstellen), steht im
[Benutzerhandbuch](user-manual.md).

## 3. Nur im Heimnetz betreiben

Für eine LAN-Party oder das Heimnetz reicht die Installation aus Abschnitt 2. Die App läuft dann
über einfaches `http`, das ist im eigenen Netz in Ordnung.

- Mitspieler öffnen `http://<ip-des-rechners>:3000`, zum Beispiel `http://192.168.0.10:3000`.
- Die Adresse, die die App Spielern zum Verbinden anzeigt, ist der Name, unter dem die Seite
  aufgerufen wurde. Soll dort immer dieselbe Adresse stehen, setze `PUBLIC_HOST=192.168.0.10`.
- Sollen die Spiele nur im Heimnetz erreichbar sein, obwohl der Rechner auch am Internet hängt,
  setze `PORT_BIND_IP` auf die Heimnetz-Adresse des Rechners, zum Beispiel `PORT_BIND_IP=192.168.0.10`.
  Dann veröffentlicht Docker die Spiel-Ports nur auf dieser Netzwerkkarte.

## 4. Im Internet betreiben

Wenn Freunde von außerhalb mitspielen sollen, gehört die Weboberfläche hinter einen Reverse Proxy
mit HTTPS. Die Spiel-Ports selbst laufen nicht über den Proxy, sondern werden direkt freigegeben.

### 4.1 Checkliste

1. **Domain:** Richte eine Domain auf deine öffentliche IP, zum Beispiel `games.example.com`.
2. **Reverse Proxy mit HTTPS** vor Port 3000 (Beispiele unten). Port 3000 selbst nicht ins Internet
   freigeben.
3. **App-Einstellungen** in der `.env`:
   ```bash
   ORIGIN=https://games.example.com
   ADDRESS_HEADER=X-Forwarded-For
   XFF_DEPTH=1
   PUBLIC_HOST=games.example.com
   ```
   `ORIGIN` ist die öffentliche Adresse. `ADDRESS_HEADER` und `XFF_DEPTH` sorgen dafür, dass die
   Sperre nach zu vielen Anmeldeversuchen die echte IP des Besuchers sieht und nicht die des Proxys.
4. **Spiel-Ports freigeben:** Im Router (Portweiterleitung) und in der Firewall des Rechners die
   Ports der Spiele öffnen, die ihr nutzt. Die Ports jedes Servers stehen in der Serverliste unter
   **Adresse für Spieler**. Ein zweiter Server desselben Spiels bekommt um 10 verschobene Ports
   (zum Beispiel 25575 statt 25565).
5. **Starkes Admin-Passwort** und nur vertrauenswürdige Administratoren.
6. **Optional, aber empfohlen:** Einen
   [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) verwenden, damit die App
   nicht den kompletten Docker-Zugriff hat (siehe 4.4).

Wenn die Seite über HTTPS aufgerufen wird, setzt die App die Anmelde-Cookies automatisch als
`Secure` und schickt einen HSTS-Header.

### 4.2 Beispiel: Caddy

Caddy holt sich das HTTPS-Zertifikat selbst. Ergänze die `docker-compose.yml`:

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
    # wie oben, aber ohne "ports:"

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

### 4.3 Beispiel: nginx

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

Hier läuft die App mit `-p 127.0.0.1:3000:3000`, damit Port 3000 nur lokal erreichbar ist.

### 4.4 Docker-Zugriff einschränken

Statt den Docker-Socket direkt einzubinden, kann die App über einen Socket-Proxy mit Docker
sprechen. Der Proxy erlaubt nur die Bereiche, die Pocket Dimension braucht:

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
    # wie oben, aber ohne den Docker-Socket unter "volumes:"
    environment:
      DOCKER_HOST: tcp://docker-proxy:2375
```

Pocket Dimension sieht ohnehin nur Container, die es selbst erstellt hat oder die im Netzwerk
`POCKET_DIMENSION_NETWORK` hängen. Alle anderen Container auf dem Rechner bleiben unsichtbar.

> **Ehrlich gesagt:** Auch über den Socket-Proxy darf die App Container anlegen. Wer die App
> vollständig übernimmt, kann damit weiterhin Container mit vollen Rechten starten. Der Proxy
> verkleinert die Angriffsfläche (kein Zugriff auf Swarm, Secrets, Plugins, `exec` usw.), ersetzt
> aber nicht ein starkes Admin-Passwort und aktuelle Updates. Hänge den Socket-Proxy nie in das
> Netzwerk `POCKET_DIMENSION_NETWORK`, sonst könnten Gameserver ihn erreichen.

### 4.5 Was die App absichert und was nicht

Pocket Dimension ist für den Betrieb im Internet gehärtet:

- **Anmeldung:** Passwörter werden mit bcrypt gespeichert. Nach 10 Fehlversuchen für dasselbe Konto
  von derselben IP und nach 50 Fehlversuchen insgesamt von einer IP ist für 15 Minuten Schluss.
  Hinter einem Reverse Proxy funktioniert das nur mit `ADDRESS_HEADER` (siehe 4.1), sonst sieht
  die App alle Besucher unter der IP des Proxys.
- **Browser-Schutz:** Content Security Policy, Schutz vor Einbettung in fremde Seiten und
  Formular-Schutz gegen Cross-Site-Anfragen sind immer aktiv. Anmelde-Cookies sind `HttpOnly` und
  über HTTPS `Secure`.
- **App-Container:** Das Image startet die App als normaler Benutzer `node`, nicht als `root`. Beim
  Start übernimmt es nur das Datenverzeichnis und tritt der Gruppe des Docker-Sockets bei, danach
  werden alle Rechte abgegeben.
- **Gameserver:** Jeder Server läuft in einem eigenen Container ohne Sonderrechte
  (`no-new-privileges`, keine Raw-Sockets, Prozesslimit, Speicherlimit der Vorlage). Spielvorlagen
  können weder `privileged` noch Ordner des Rechners noch den Docker-Socket einbinden, nur eigene
  Docker-Volumes. Die Gameserver verschiedener Benutzer können sich im Netzwerk
  `POCKET_DIMENSION_NETWORK` nicht gegenseitig erreichen, so bleiben etwa RCON-Ports privat.
- **Downloads:** Spielekatalog und Vorschaubilder werden nur gelesen, haben eine Größengrenze, und
  Vorschaubilder werden nie aus dem eigenen Netz geladen.

Was du selbst im Blick behalten musst:

- **Administratoren** können beliebige Docker-Images als Spiel eintragen. Ein Image läuft zwar
  eingesperrt, kann aber alles tun, was ein Programm im Internet und in deinem Heimnetz tun kann.
  Vergib Adminrechte nur an Personen, denen du den Rechner anvertrauen würdest.
- **Gameserver erreichen dein Heimnetz.** Docker-Container können andere Geräte im lokalen Netz
  ansprechen (Router, NAS). Wer das ausschließen will, betreibt Pocket Dimension auf einem eigenen
  Rechner oder in einem eigenen Netzsegment (VLAN, Gastnetz).
- **CPU:** Speicher ist pro Spiel begrenzt, Rechenzeit nicht. Ein hängender Server kann den Rechner
  ausbremsen; **Stoppen** hilft.
- **Gemeinsamer Katalog:** Spiele aus dem Katalog bekommen Updates automatisch, auch ein anderes
  Image. Wer das nicht möchte, setzt `CATALOG_SYNC_HOURS=0` und aktualisiert per Knopf, oder
  `CATALOG_URL=` (leer) für gar keine Katalog-Abfrage.
- **Updates:** Spiele-Images ändern sich ständig. Ein Server holt beim Erstellen das neueste Image;
  bestehende Server bleiben auf ihrem Stand, bis du sie löschst und neu anlegst.

## 5. Alle Einstellungen

Alle Einstellungen sind Umgebungsvariablen. Eine Vorlage mit Kommentaren liegt in
[`.env.example`](../../.env.example).

| Variable                  | Standard                         | Bedeutung                                                                                        |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `SECRET_JWT_KEY`          | –                                | Pflicht im Betrieb. Zufälliger Text, mindestens 32 Zeichen.                                      |
| `DB_ADMIN_USER`           | `admin`                          | Name des ersten Administrators (zum Anmelden statt der E-Mail).                                  |
| `DB_ADMIN_EMAIL`          | –                                | E-Mail des ersten Administrators.                                                                |
| `DB_ADMIN_PASSWORD`       | –                                | Passwort des ersten Administrators, nur beim ersten Start nötig.                                 |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | Ort der Datenbank.                                                                               |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | Wie lange eine Anmeldung gültig bleibt (Sekunden).                                               |
| `ORIGIN`                  | –                                | Öffentliche Adresse hinter einem Reverse Proxy, z. B. `https://games.example.com`.               |
| `ADDRESS_HEADER`          | –                                | Header mit der echten Besucher-IP hinter einem Proxy, meist `X-Forwarded-For`.                   |
| `XFF_DEPTH`               | –                                | Anzahl der Proxys vor der App, meist `1`.                                                        |
| `DOCKER_HOST`             | lokaler Socket                   | Andere Docker-Adresse, z. B. ein Socket-Proxy.                                                   |
| `MAX_SERVERS_PER_USER`    | `2`                              | So viele Server darf ein Spieler ohne Adminrechte besitzen. Administratoren haben kein Limit.    |
| `PUBLIC_HOST`             | Adresse der Seite                | Adresse, die Spielern zum Verbinden angezeigt wird.                                              |
| `PORT_BIND_IP`            | alle Netzwerkkarten              | Netzwerkkarte, auf der Spiel-Ports veröffentlicht werden.                                        |
| `QUERY_HOST`              | `127.0.0.1`                      | Adresse, unter der die App veröffentlichte Spiel-Ports für den Live-Status erreicht (siehe 7.1). |
| `PORT_OFFSET_STEP`        | `10`                             | Abstand, um den die Ports eines weiteren Servers desselben Spiels verschoben werden.             |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | `false` startet Spiele ohne das Speicherlimit ihrer Vorlage.                                     |
| `CATALOG_URL`             | Katalog im GitHub-Repository     | Adresse des gemeinsamen Spielekatalogs (siehe 7.2). Leer = nur die mitgelieferten Spiele.        |
| `CATALOG_SYNC_HOURS`      | `24`                             | Abstand der automatischen Katalog-Abfrage in Stunden. `0` = nur per Knopf.                       |
| `OIDC_ISSUER`             | –                                | Single Sign-on: Issuer-Adresse des OpenID-Connect-Anbieters (siehe 9).                           |
| `OIDC_CLIENT_ID`          | –                                | Beim Anbieter registrierte Client-ID.                                                            |
| `OIDC_CLIENT_SECRET`      | –                                | Client Secret; leer bei einem öffentlichen Client.                                               |
| `OIDC_NAME`               | `SSO`                            | Name auf dem Anmeldeknopf („Mit … anmelden").                                                    |
| `OIDC_SCOPES`             | `openid email profile`           | Beim Anbieter angefragte Scopes.                                                                 |
| `OIDC_AUTO_CREATE`        | `true`                           | `false` = nur vorhandene Konten können sich anmelden.                                            |
| `OIDC_ROLES_CLAIM`        | `roles`                          | Claim mit Rollen oder Gruppen, z. B. `realm_access.roles`.                                       |
| `OIDC_ADMIN_ROLE`         | –                                | Rolle oder Gruppe, die zum Administrator macht. Leer = Rollen werden in der App verwaltet.       |
| `LOCAL_LOGIN`             | `true`                           | `false` = nur Single Sign-on (wenn OIDC eingerichtet ist).                                       |

## 6. Update, Backup und Logs

### Update

```bash
docker compose build --pull --no-cache pocketdimension
docker compose up -d
```

`--no-cache` sorgt dafür, dass Docker den neuesten Stand aus GitHub holt. Mit `docker run`
baust du das Image wie in Abschnitt 2 neu, entfernst den alten Container mit
`docker rm -f pocketdimension` und startest ihn mit demselben Befehl wie vorher. Datenbank und
Gameserver bleiben erhalten, solange du dasselbe Volume `pocketdimension-data` einbindest.

Laufende Gameserver werden dabei nicht angehalten. Nach manchen Updates müssen sich alle Benutzer
neu anmelden.

**Hinweis für Installationen vor Oktober 2026:** Seit dem Sicherheits-Update läuft die App im
Container nicht mehr als `root`. Beim ersten Start übernimmt sie das Datenverzeichnis automatisch,
du musst nichts tun. Außerdem trennt sie die Gameserver im Netzwerk voneinander. Bei bestehenden
Installationen gilt das erst, wenn das Netzwerk neu angelegt wird; die App weist im Log darauf hin
(„lets game servers reach each other“). So legst du es neu an, die Gameserver laufen dabei weiter:

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

Sichere regelmäßig:

- das Volume `pocketdimension-data` (Benutzer, Spielvorlagen, Serverliste),
- die Volumes der Gameserver. Sie heißen `pocketdimension-server-<nummer>-<index>` und enthalten
  Welten und Spielstände.

Ein Beispiel für ein Volume:

```bash
docker run --rm -v pocketdimension-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/pocketdimension-data.tar.gz -C /data .
```

Stoppe einen Gameserver vor dem Sichern seines Volumes, damit der Spielstand vollständig ist.

### Logs

```bash
docker logs pocketdimension                  # die App
docker logs pocketdimension-minecraft-java-3 # ein Gameserver
```

Der Containername eines Gameservers steht unter **Container** (nur für Administratoren).

---

## 7. Spieleranzeige und Spielekatalog

### 7.1 Spieleranzeige (Live-Status)

Für die Spieleranzeige fragt die App die Gameserver mit [GameDig](https://github.com/gamedig/node-gamedig)
ab. Welche Spiele das können, steht im [Benutzerhandbuch](user-manual.md#live-werte).

Die App versucht jeden Server auf zwei Wegen gleichzeitig:

1. direkt im Docker-Netzwerk `POCKET_DIMENSION_NETWORK`, das die App beim Start selbst anlegt,
2. über den veröffentlichten Port unter `QUERY_HOST`.

Läuft die App selbst in Docker, braucht sie für den zweiten Weg `QUERY_HOST=host.docker.internal`
und `--add-host host.docker.internal:host-gateway` (bzw. `extra_hosts` in Compose). Beides ist in den
Beispielen aus Abschnitt 2 schon enthalten. Läuft die App ohne Docker direkt auf dem Rechner,
reicht der Standard `127.0.0.1`.

### 7.2 Gemeinsamer Spielekatalog

Die Spiele kommen aus einem Katalog, den sich alle Pocket-Dimension-Installationen teilen. Er liegt
öffentlich im Ordner [`catalog/`](../../catalog/) des GitHub-Repositorys. Die App lädt
`catalog/catalog.json` nur lesend herunter: ohne Konto, ohne Schlüssel und ohne Kosten. Es werden
keine Daten über deine Installation gesendet.

- **Mitgeliefert:** Die Spiele des Katalogs stecken beim Bauen der App auch im Image. Ohne
  Internet oder mit leerem `CATALOG_URL` stehen also immer die mitgelieferten Spiele bereit.
- **Abfrage:** beim Start und danach alle `CATALOG_SYNC_HOURS` Stunden (Standard 24). Mit
  `CATALOG_SYNC_HOURS=0` nur, wenn ein Administrator **Katalog aktualisieren** drückt.
- **Neue Spiele** kommen deaktiviert an; ein Administrator schaltet sie frei. Wie das in der
  Oberfläche aussieht, steht im
  [Benutzerhandbuch, Abschnitt 13](user-manual.md#13-der-gemeinsame-spielekatalog).
- **Eigener Katalog:** Wer eine eigene Auswahl pflegen will, forkt das Repository und setzt
  `CATALOG_URL` auf die eigene `catalog.json`, z. B.
  `https://raw.githubusercontent.com/<name>/PocketDimension/main/catalog/catalog.json`.
- **Ein Spiel beisteuern:** siehe [`catalog/README.md`](../../catalog/README.md).

---

## 8. Fehlerbehebung

**„Docker ist nicht erreichbar“**
Die App kommt nicht an Docker. Prüfe, ob der Docker-Socket eingebunden ist
(`-v /var/run/docker.sock:/var/run/docker.sock`) bzw. ob `DOCKER_HOST` stimmt und der Socket-Proxy
läuft.

**Im Log steht „the Docker socket … is not group-writable; the app keeps running as root“**
Der eingebundene Docker-Socket erlaubt nur `root` den Zugriff, deshalb kann die App ihre Rechte
nicht abgeben. Sie funktioniert trotzdem. Besser: einen Socket-Proxy verwenden (Abschnitt 4.4).

**„Too many login attempts“ / „Zu viele Anmeldeversuche“, obwohl das Passwort stimmt**
Nach zu vielen Fehlversuchen von einer IP sperrt die App diese für 15 Minuten. Trifft es alle
Benutzer gleichzeitig, fehlt hinter dem Reverse Proxy `ADDRESS_HEADER` (Abschnitt 4.1). Ein
Neustart der App hebt die Sperre sofort auf.

**Ein Server bleibt bei „Wird heruntergeladen“**
Große Images brauchen Zeit. Mit `docker pull <image>` auf dem Rechner siehst du den Fortschritt.
Schlägt der Download fehl, zeigt die Karte einen Fehler und **Erneut versuchen**.

**Ein Server zeigt „Fehler“**
Die Meldung auf der Karte nennt den Grund, etwa ein falsches Image oder belegte Ports. Behebe die
Ursache und klicke **Erneut versuchen**. Die Logs des Spiels findest du mit
`docker logs <containername>`.

**Freunde können sich nicht verbinden**

- Steht der Server auf **Läuft**?
- Sind die Ports aus **Adresse für Spieler** im Router weitergeleitet und in der Firewall offen?
  Achte auf das Protokoll (`tcp` oder `udp`).
- Zeigt die Adresse den richtigen Namen? Sonst `PUBLIC_HOST` setzen.

**Die Spieleranzeige bleibt bei „Der Server antwortet noch nicht“**

- Das Spiel startet noch. Warte ein paar Minuten.
- Läuft die App in Docker, prüfe `QUERY_HOST` und `--add-host` (Abschnitt 7.1).
- Eine Firewall auf dem Rechner kann die Abfrage blockieren.

**Nach dem Absenden eines Formulars erscheint „Cross-site POST form submissions are forbidden“**
Die Adresse im Browser passt nicht zu `ORIGIN`. Setze `ORIGIN` genau auf die Adresse, unter der die
Seite aufgerufen wird, oder lass die Variable weg, wenn du keinen Reverse Proxy verwendest.

**Passwort des Administrators vergessen**
Ein anderer Administrator kann es unter **Konto → Benutzer** neu setzen. Gibt es keinen, starte die
App einmal mit einer neuen `DB_ADMIN_EMAIL`, einem neuen `DB_ADMIN_USER` und `DB_ADMIN_PASSWORD`;
dann wird ein zusätzliches Administratorkonto angelegt.

**Fehler gefunden?**
Melde ihn unter [github.com/damaurer/PocketDimension/issues](https://github.com/damaurer/PocketDimension/issues)
oder über **Problem melden** unten in der App.

## 9. Single Sign-on

Neben der normalen Anmeldung mit Name und Passwort kann Pocket Dimension die Anmeldung über einen
OpenID-Connect-Anbieter erlauben, zum Beispiel Keycloak, Authentik, Authelia, Zitadel oder
Microsoft Entra ID. Das ist ausgeschaltet, bis `OIDC_ISSUER` und `OIDC_CLIENT_ID` gesetzt sind. Die
Anmeldeseite zeigt dann unter dem normalen Formular einen Knopf **Mit … anmelden**.

### 9.1 Keycloak einrichten

1. Öffne in deinem Realm **Clients → Create client**. Client type _OpenID Connect_, Client ID zum
   Beispiel `pocketdimension`.
2. Schalte **Client authentication** ein und lass nur **Standard flow** angehakt.
3. Trage unter **Login settings** ein (mit deiner eigenen Adresse):
   - **Valid redirect URIs:** `https://games.example.com/auth/oidc/callback`
   - **Valid post logout redirect URIs:** `https://games.example.com/`
   - **Web origins:** `https://games.example.com`
4. Kopiere das **Client secret** aus dem Reiter **Credentials**.
5. Optional, Administratorrechte aus Keycloak (siehe 9.3): Lege eine Realm-Rolle an, zum Beispiel
   `pocketdimension-admin`, und gib sie den Personen, die Administratoren sein sollen. Keycloak
   schreibt Realm-Rollen standardmäßig nur ins Access Token. Öffne deshalb **Client scopes → roles
   → Mappers → realm roles** und schalte **Add to ID token** und **Add to userinfo** ein.

Starte Pocket Dimension dann mit diesen zusätzlichen Variablen:

```bash
OIDC_ISSUER=https://sso.example.com/realms/games
OIDC_CLIENT_ID=pocketdimension
OIDC_CLIENT_SECRET=<Client secret>
OIDC_NAME=Keycloak
# optional, siehe 9.3
OIDC_ROLES_CLAIM=realm_access.roles
OIDC_ADMIN_ROLE=pocketdimension-admin
```

`OIDC_ISSUER` ist die Adresse, unter der `/.well-known/openid-configuration` liegt; bei Keycloak
ist das `https://<keycloak>/realms/<realm>`. Die App selbst (in ihrem Container) muss sie erreichen
können. Andere Anbieter funktionieren genauso: Registriere eine Webanwendung mit der Redirect-URI
aus Schritt 3 und nutze Issuer, Client-ID und Secret, die du dort bekommst.

Hinter einem Reverse Proxy muss `ORIGIN` gesetzt sein (Abschnitt 4), weil die Redirect-URI daraus
gebildet wird.

### 9.2 Konten

- **Erste Anmeldung:** Die App legt ein Konto mit E-Mail und Benutzername vom Anbieter an. Es hat
  kein Passwort, und die E-Mail lässt sich nur beim Anbieter ändern. Mit `OIDC_AUTO_CREATE=false`
  werden keine Konten angelegt; dann können sich nur Personen mit vorhandenem Konto anmelden.
- **Vorhandene Konten:** Gibt es schon ein Konto mit derselben E-Mail, wird es bei der ersten
  Anmeldung verknüpft, aber nur, wenn der Anbieter die E-Mail als bestätigt meldet
  (`email_verified`; in Keycloak der Schalter **Email verified** beim Benutzer). Sonst meldet die
  Anmeldeseite, dass die E-Mail schon vergeben ist. Ein verknüpftes Konto kann sich auf beiden Wegen
  anmelden.
- Das Konto hängt an der Benutzer-ID beim Anbieter (`sub`), nicht an der E-Mail. Ändert sich die
  E-Mail später beim Anbieter, entsteht kein zweites Konto.
- Ein Administrator kann einem Single-Sign-on-Konto unter **Konto → Benutzer** ein Passwort geben.
  Dann kann es sich auch über das normale Formular anmelden.

### 9.3 Administratorrolle vom Anbieter

Ohne `OIDC_ADMIN_ROLE` werden Rollen wie bisher in der App verwaltet: Neue Konten sind Spieler, und
ein Administrator macht sie bei Bedarf zu Administratoren.

Mit `OIDC_ADMIN_ROLE` entscheidet der Anbieter. Bei jeder Anmeldung liest die App den Claim aus
`OIDC_ROLES_CLAIM` aus ID-Token und Userinfo. Standard ist `roles`; ein Punkt liest einen
verschachtelten Claim, etwa `realm_access.roles` bei Keycloak; für Gruppen zum Beispiel `groups`.
Enthält der Claim den Wert von `OIDC_ADMIN_ROLE`, wird das Konto Administrator, sonst verliert es
die Administratorrechte. Änderungen an der Rolle in der App werden bei der nächsten Anmeldung
überschrieben.

> **Achtung:** Das gilt auch für verknüpfte Konten, auch für den ersten Administrator aus
> `DB_ADMIN_EMAIL`. Gib dir die Rolle beim Anbieter, bevor du dich mit diesem Konto per Single
> Sign-on anmeldest, sonst ist es danach kein Administrator mehr.

### 9.4 Nur Single Sign-on

`LOCAL_LOGIN=false` blendet das Passwortformular aus und lehnt Anmeldungen mit Passwort ab. Es
wirkt nur, wenn OIDC eingerichtet ist. Stell vorher sicher, dass sich mindestens ein Administrator
über den Anbieter anmelden kann. Fällt der Anbieter aus, starte die App ohne `LOCAL_LOGIN=false`,
um wieder hineinzukommen.

### 9.5 Sicherheit

- Die App nutzt den Authorization Code Flow mit PKCE (S256), `state` und `nonce` und prüft
  Signatur, Aussteller, Empfänger und Ablauf des ID-Tokens. `state`, `nonce` und der PKCE-Verifier
  liegen zehn Minuten lang in einem signierten HttpOnly-Cookie.
- Einfaches `http://` beim Issuer ist nur zum lokalen Ausprobieren gedacht. Sonst immer HTTPS.
- **Abmelden** beendet die Sitzung in der App und nach einem Single Sign-on auch beim Anbieter und
  führt dann zurück zur Anmeldeseite.
- Wer beim Anbieter gesperrt wird, kann sich nicht mehr neu anmelden. Eine schon offene Sitzung in
  der App bleibt aber gültig, bis sie abläuft (`SESSION_MAX_AGE_SECONDS`, standardmäßig ein Tag).
  Um sie sofort zu beenden, setze unter **Konto → Benutzer** ein neues Passwort für das Konto; das
  meldet es überall ab.

### 9.6 Fehlerbehebung

**„Die Anmeldung über den Anmeldedienst ist fehlgeschlagen"**
Das App-Log (`docker logs pocketdimension`) nennt den Grund. Häufig: falscher `OIDC_ISSUER`, der
Anbieter ist aus dem Container nicht erreichbar, falsches Client Secret.

**Keycloak zeigt „Invalid parameter: redirect_uri"**
Die Adresse unter **Valid redirect URIs** passt nicht genau. Sie muss die Adresse sein, unter der
die App geöffnet wird, plus `/auth/oidc/callback`. Hinter einem Proxy `ORIGIN` prüfen.

**Administratorrolle wird nicht übernommen**
Der Claim fehlt im ID-Token und in Userinfo. Schalte in Keycloak beim Mapper „realm roles" **Add to
ID token** ein (Schritt 5 in 9.1) und prüfe `OIDC_ROLES_CLAIM`.
