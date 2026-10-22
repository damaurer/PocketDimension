# Pocket Dimension – Bedienerhandbuch

Pocket Dimension ist eine Web-App, mit der du und deine Mitspieler eigene Gameserver mit einem Klick
starten. Jeder Server läuft als eigener Docker-Container auf deinem Rechner oder Server. Die App
zeigt, wer gerade spielt, und wie viel CPU und Arbeitsspeicher jeder Server braucht.

Dieses Handbuch hat zwei Teile:

- **Teil A – Betrieb** richtet sich an die Person, die Pocket Dimension installiert und betreibt.
- **Teil B – Bedienung** erklärt Spielern und Administratoren die Oberfläche.

## Inhalt

- [Teil A – Betrieb](#teil-a--betrieb)
  - [1. Voraussetzungen](#1-voraussetzungen)
  - [2. Installation](#2-installation)
  - [3. Nur im Heimnetz betreiben](#3-nur-im-heimnetz-betreiben)
  - [4. Im Internet betreiben](#4-im-internet-betreiben)
  - [5. Alle Einstellungen](#5-alle-einstellungen)
  - [6. Update, Backup und Logs](#6-update-backup-und-logs)
- [Teil B – Bedienung](#teil-b--bedienung)
  - [7. Anmelden und Sprache](#7-anmelden-und-sprache)
  - [8. Einen Server erstellen](#8-einen-server-erstellen)
  - [9. Meine Server](#9-meine-server)
  - [10. Konto](#10-konto)
  - [11. Administration](#11-administration)
- [12. Fehlerbehebung](#12-fehlerbehebung)

---

# Teil A – Betrieb

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
  mimau/pocket-dimension
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
    image: mimau/pocket-dimension
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

Starten mit:

```bash
docker compose up -d
```

### 2.3 Erste Anmeldung

Öffne `http://<adresse-des-rechners>:3000` und melde dich mit `DB_ADMIN_EMAIL` (oder dem Namen
`admin`) und `DB_ADMIN_PASSWORD` an. Ändere danach unter **Konto** dein Passwort und lege unter
**Konto → Benutzer hinzufügen** die Konten deiner Mitspieler an.

Das Admin-Passwort aus der `.env` wird nur beim allerersten Start verwendet. Du kannst es danach aus
der Datei entfernen.

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

## 5. Alle Einstellungen

Alle Einstellungen sind Umgebungsvariablen. Eine Vorlage mit Kommentaren liegt in
[`.env.example`](../.env.example).

| Variable                  | Standard                         | Bedeutung                                                                                         |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_KEY`          | –                                | Pflicht im Betrieb. Zufälliger Text, mindestens 32 Zeichen.                                       |
| `DB_ADMIN_USER`           | `admin`                          | Name des ersten Administrators (zum Anmelden statt der E-Mail).                                   |
| `DB_ADMIN_EMAIL`          | –                                | E-Mail des ersten Administrators.                                                                 |
| `DB_ADMIN_PASSWORD`       | –                                | Passwort des ersten Administrators, nur beim ersten Start nötig.                                  |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | Ort der Datenbank.                                                                                |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | Wie lange eine Anmeldung gültig bleibt (Sekunden).                                                |
| `ORIGIN`                  | –                                | Öffentliche Adresse hinter einem Reverse Proxy, z. B. `https://games.example.com`.                |
| `ADDRESS_HEADER`          | –                                | Header mit der echten Besucher-IP hinter einem Proxy, meist `X-Forwarded-For`.                    |
| `XFF_DEPTH`               | –                                | Anzahl der Proxys vor der App, meist `1`.                                                         |
| `DOCKER_HOST`             | lokaler Socket                   | Andere Docker-Adresse, z. B. ein Socket-Proxy.                                                    |
| `MAX_SERVERS_PER_USER`    | `2`                              | So viele Server darf ein Spieler ohne Adminrechte besitzen. Administratoren haben kein Limit.     |
| `PUBLIC_HOST`             | Adresse der Seite                | Adresse, die Spielern zum Verbinden angezeigt wird.                                               |
| `PORT_BIND_IP`            | alle Netzwerkkarten              | Netzwerkkarte, auf der Spiel-Ports veröffentlicht werden.                                         |
| `QUERY_HOST`              | `127.0.0.1`                      | Adresse, unter der die App veröffentlichte Spiel-Ports für den Live-Status erreicht (siehe 11.5). |
| `PORT_OFFSET_STEP`        | `10`                             | Abstand, um den die Ports eines weiteren Servers desselben Spiels verschoben werden.              |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | `false` startet Spiele ohne das Speicherlimit ihrer Vorlage.                                      |
| `CATALOG_URL`             | Katalog im GitHub-Repository     | Adresse des gemeinsamen Spielekatalogs (siehe 11.4). Leer = nur die mitgelieferten Spiele.        |
| `CATALOG_SYNC_HOURS`      | `24`                             | Abstand der automatischen Katalog-Abfrage in Stunden. `0` = nur per Knopf.                        |

## 6. Update, Backup und Logs

### Update

```bash
docker compose pull
docker compose up -d
```

Laufende Gameserver werden dabei nicht angehalten. Nach manchen Updates müssen sich alle Benutzer
neu anmelden.

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

# Teil B – Bedienung

## 7. Anmelden und Sprache

Melde dich mit deiner E-Mail oder deinem Benutzernamen und deinem Passwort an. Konten legt der
Administrator an; eine Selbstregistrierung gibt es nicht.

Oben rechts wechselst du mit **EN / DE** die Sprache. Die App merkt sich deine Wahl. Beim ersten
Besuch nimmt sie die Sprache deines Browsers.

Nach zehn fehlgeschlagenen Anmeldungen innerhalb von 15 Minuten sperrt die App weitere Versuche von
derselben Adresse für eine Weile.

Die Oberfläche passt sich an Handy und Desktop an und folgt dem hellen oder dunklen Modus deines
Geräts.

## 8. Einen Server erstellen

1. Öffne **Spiele**. Mit dem Suchfeld findest du ein Spiel schnell.
2. Jede Karte zeigt, wie viel Arbeitsspeicher das Spiel braucht, welche Ports es nutzt und ob die
   App die **Spieleranzeige** unterstützt.
3. Klicke auf **Server erstellen**.
4. Gib unter **Name in deiner Liste** einen Namen ein. Er erscheint nur in deiner Serverliste.
5. Fülle die **Spieleinstellungen** aus. Felder mit `*` sind Pflicht, zum Beispiel ein
   Serverpasswort bei Valheim oder das Steam-Token bei Counter-Strike 2.
6. Klicke auf **Server erstellen**. Du landest in **Meine Server**.

Beim ersten Start lädt Docker das Spiel herunter. Das kann je nach Spiel und Internetleitung einige
Minuten dauern. Die Karte zeigt dabei **Wird heruntergeladen** und danach **Wird eingerichtet**.

Spieler ohne Adminrechte können eine begrenzte Zahl von Servern besitzen (Standard: 2). Ist das
Limit erreicht, lösche zuerst einen Server.

## 9. Meine Server

Jeder Server ist eine Karte mit:

- **Zustand:** Läuft, Gestoppt, Startet neu, Abgestürzt, Fehler oder ein Schritt der Einrichtung.
- **Spieler:** Wie viele Spieler verbunden sind und wie viele maximal Platz haben. Unter
  **Wer ist online?** stehen ihre Namen, wenn das Spiel sie verrät.
- **Karte, Version, Ping:** Was das Spiel selbst meldet.
- **CPU, Arbeitsspeicher, Läuft seit:** Verbrauch und Laufzeit des Containers.
- **Adresse für Spieler:** Diese Adresse geben deine Freunde im Spiel ein. Mit **Kopieren** landet sie
  in der Zwischenablage.

Die Seite aktualisiert sich selbst, während ein Server eingerichtet wird alle paar Sekunden, sonst
etwa alle 15 Sekunden.

**Spieleranzeige:** Minecraft (Java und Bedrock), Valheim, Counter-Strike 2, Team Fortress 2,
Rust, Project Zomboid, Satisfactory, 7 Days to Die, Enshrouded, V Rising, ARK: Survival Evolved,
Sons of the Forest und OpenTTD melden Spielerzahl, Karte und Version. Terraria, Factorio, Palworld,
Core Keeper und Necesse zeigen nur CPU, Arbeitsspeicher und den Zustand. Steht dort „Der Server antwortet noch nicht“, startet das
Spiel meist noch; große Spiele brauchen beim ersten Start einige Minuten.

**Knöpfe:**

| Knopf                | Wirkung                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Starten**          | Startet einen gestoppten Server. Die Spielwelt bleibt erhalten.                       |
| **Stoppen**          | Fährt den Server herunter (bis zu 30 Sekunden, damit das Spiel speichern kann).       |
| **Neu starten**      | Stoppt und startet den Server.                                                        |
| **Erneut versuchen** | Nach einem Fehler beim Einrichten: versucht es noch einmal.                           |
| **Löschen**          | Löscht den Server **mit allen Spielständen**. Das lässt sich nicht rückgängig machen. |

Gestoppte Server starten nach einem Neustart des Rechners nicht von selbst; laufende Server schon.

## 10. Konto

Unter **Konto → Profil** änderst du Namen, E-Mail und Passwort. Für eine neue E-Mail oder ein neues
Passwort musst du dein aktuelles Passwort eingeben. Nach einem Passwortwechsel werden alle anderen
Anmeldungen (zum Beispiel auf einem anderen Gerät) beendet.

Abmelden kannst du dich jederzeit oben rechts mit **Abmelden**.

## 11. Administration

Administratoren sehen zusätzliche Bereiche.

### 11.1 Benutzer verwalten

Unter **Konto → Benutzer** siehst du alle Benutzer. Mit **Benutzer hinzufügen** legst du ein neues
Konto an, mit **Bearbeiten** änderst du Name, E-Mail, Passwort oder die Adminrolle. Passwörter
brauchen mindestens 10 Zeichen.

### 11.2 Alle Server

Administratoren sehen in **Meine Server** die Server aller Benutzer, jeweils mit **Besitzer**, und
können sie steuern und löschen. Für Administratoren gilt kein Serverlimit.

### 11.3 Spiele verwalten

Auf jeder Spielkarte gibt es für Administratoren **Bearbeiten** und **Deaktivieren**. Ein
deaktiviertes Spiel sehen Spieler nicht mehr; bestehende Server laufen weiter.

Spiele aus dem gemeinsamen Katalog (siehe 11.4) werden von dort aktualisiert. Eigene Änderungen
daran werden überschrieben, sobald eine neuere Version des Spiels kommt. Um ein solches Spiel
anzupassen, lege lieber eine eigene Vorlage an.

**Eigenes Spiel hinzufügen** mit **Spiele → Neue Spielvorlage**. Jedes Spiel, für das es ein
Docker-Image gibt, lässt sich hinzufügen. Die Angaben findest du meist in der Beschreibung des Images
auf Docker Hub.

| Feld                 | Beispiel                                                          | Bedeutung                                                                                              |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Name des Spiels      | `Minecraft Bedrock`                                               | Wird im Katalog angezeigt.                                                                             |
| Kurzname             | `minecraft-bedrock`                                               | Teil der Adresse; Kleinbuchstaben, Ziffern, Bindestriche.                                              |
| Docker-Image         | `itzg/minecraft-bedrock-server:latest`                            | Image auf Docker Hub oder einer anderen Registry.                                                      |
| Ports                | `19132/udp Game`                                                  | Ein Port pro Zeile: Port, Protokoll (`tcp` oder `udp`), optional eine Bezeichnung.                     |
| Datenverzeichnisse   | `/data`                                                           | Pfade im Container, in denen das Spiel seine Daten speichert. Jeder Server bekommt ein eigenes Volume. |
| Speicherlimit in MB  | `2048`                                                            | Mehr Arbeitsspeicher darf der Server nicht nutzen.                                                     |
| Einstellungen (JSON) | siehe unten                                                       | Was Spieler beim Erstellen einstellen dürfen.                                                          |
| GameDig-Spiel-ID     | `mbe`                                                             | Optional, für die Spieleranzeige.                                                                      |
| Abfrage-Port         | `0`                                                               | Position des Abfrage-Ports in der Portliste, gezählt ab 0.                                             |
| Vorschaubild         | `https://cdn.akamai.steamstatic.com/steam/apps/892970/header.jpg` | Optional. Bild auf der Spielkarte, siehe unten.                                                        |

Die **Einstellungen** sind eine Liste von Umgebungsvariablen des Images:

```json
[
	{ "key": "EULA", "label": "Accept the EULA", "options": ["TRUE"], "required": true },
	{ "key": "SERVER_NAME", "label": "Server name", "default": "Unser Server" },
	{
		"key": "LEVEL_TYPE",
		"label": "World type",
		"options": ["DEFAULT", "FLAT"],
		"default": "DEFAULT"
	},
	{ "key": "PASSWORD", "label": "Server password", "secret": true, "help": "Leer = ohne Passwort" }
]
```

- `key`: Name der Umgebungsvariable des Images.
- `label`: Beschriftung im Formular.
- `default`: Vorbelegung.
- `required`: Spieler müssen einen Wert eingeben.
- `secret`: Eingabe als Passwortfeld.
- `options`: Auswahlliste statt freiem Text.
- `help`: Hinweis unter dem Feld.

**Vorschaubilder:** Die App lädt das Bild einmal selbst herunter, speichert es in ihrer Datenbank
und liefert es danach selbst aus. Die Browser der Spieler fragen also nie bei fremden Servern an,
und die Content-Security-Policy bleibt streng. Erlaubt sind nur https-Adressen und Bilder im Format
PNG, JPEG, WebP, GIF oder AVIF bis 1 MB; Adressen im lokalen Netz lädt die App nicht. Ohne Bild oder
wenn es sich nicht laden lässt, zeigt die Karte ein farbiges Bild mit den Anfangsbuchstaben; ein
fehlgeschlagener Download wird nach einer Stunde erneut versucht. Für Spiele auf Steam passt das
Kopfbild der Shop-Seite: `https://cdn.akamai.steamstatic.com/steam/apps/<App-ID>/header.jpg`.
Achte auf die Rechte am Bild.

Spieler können nur die hier aufgeführten Variablen setzen. Ports, Image und Datenverzeichnisse legt
allein der Administrator fest.

### 11.4 Gemeinsamer Spielekatalog

Alle PocketDimension-Installationen teilen sich einen Spielekatalog. Er liegt öffentlich im
Ordner [`catalog/`](../catalog/) des GitHub-Repositorys. Die App lädt ihn nur lesend herunter:
ohne Konto, ohne Schlüssel und ohne Kosten. Es werden keine Daten über deine Installation gesendet.

- **Mitgeliefert:** Die Spiele des Katalogs stecken beim Bauen der App auch im Image. Ohne
  Internet oder mit leerem `CATALOG_URL` stehen also immer die mitgelieferten Spiele bereit.
- **Aktualisieren:** Die App fragt den Katalog beim Start und danach alle `CATALOG_SYNC_HOURS`
  Stunden ab. Administratoren können oben auf der Seite **Spiele** jederzeit **Katalog
  aktualisieren** drücken; dort steht auch, was zuletzt passiert ist.
- **Neue Spiele** aus dem Katalog erscheinen **deaktiviert**. Erst wenn ein Administrator sie
  aktiviert, können Spieler Server damit erstellen. So entscheidest du selbst, welche Images auf
  deinem Rechner laufen.
- **Neuere Versionen** bekannter Spiele (z. B. ein anderes Image oder neue Einstellungen) werden
  übernommen; ob ein Spiel aktiviert ist, bleibt dabei erhalten.
- **Eigene Spiele** werden nie überschrieben. Hat ein Katalogspiel denselben Kurznamen wie ein
  eigenes Spiel, wird es übersprungen und als solches angezeigt.
- Jeder Eintrag wird mit denselben Regeln geprüft wie das Formular für eigene Spiele; ungültige
  Einträge werden ausgelassen.

**Ein Spiel für alle beisteuern:** Lege das Spiel zuerst bei dir als eigene Vorlage an und teste
es. Auf der Bearbeiten-Seite lädt **Für den Katalog exportieren** die Datei `<kurzname>.json`
herunter. Lege sie per Pull Request in `catalog/games/` ab und führe vorher `npm run catalog:build`
aus (das aktualisiert `catalog/catalog.json`). Details stehen in
[`catalog/README.md`](../catalog/README.md).

**Eigener Katalog:** Wer eine eigene Auswahl pflegen will, forkt das Repository und setzt
`CATALOG_URL` auf die eigene `catalog.json`, z. B.
`https://raw.githubusercontent.com/<name>/PocketDimension/main/catalog/catalog.json`.

### 11.5 Spieleranzeige (Live-Status)

Für die Spieleranzeige fragt die App die Gameserver mit [GameDig](https://github.com/gamedig/node-gamedig)
ab. Die passende Spiel-ID steht in der
[GameDig-Spieleliste](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md).

Die App versucht jeden Server auf zwei Wegen gleichzeitig:

1. direkt im Docker-Netzwerk `POCKET_DIMENSION_NETWORK`,
2. über den veröffentlichten Port unter `QUERY_HOST`.

Läuft die App selbst in Docker, braucht sie für den zweiten Weg `QUERY_HOST=host.docker.internal`
und `--add-host host.docker.internal:host-gateway` (bzw. `extra_hosts` in Compose). Beides ist in den
Beispielen aus Abschnitt 2 schon enthalten.

### 11.6 Container

**Container** zeigt alle Docker-Container, die Pocket Dimension verwaltet, mit Zustand und Ports.
Dort kannst du Container direkt starten, stoppen und neu starten, zum Beispiel wenn ein Server hängt.

---

## 12. Fehlerbehebung

**„Docker ist nicht erreichbar“**
Die App kommt nicht an Docker. Prüfe, ob der Docker-Socket eingebunden ist
(`-v /var/run/docker.sock:/var/run/docker.sock`) bzw. ob `DOCKER_HOST` stimmt und der Socket-Proxy
läuft.

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
- Läuft die App in Docker, prüfe `QUERY_HOST` und `--add-host` (Abschnitt 11.5).
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
