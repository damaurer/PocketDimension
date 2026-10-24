# PocketDimension

[English](README.md) · [Deutsch](README.de.md) · **Español** · [Tagalog](README.tl.md)

Aplicación web autoalojada para iniciar y administrar servidores de juegos como contenedores Docker.

Elige un juego del catálogo, ponle un nombre al servidor y PocketDimension descarga la imagen,
inicia el servidor en su propio contenedor y muestra quién está jugando, además del uso de CPU y
memoria. Está pensada para un grupo de amigos: un administrador crea las cuentas, cada jugador
puede tener un número limitado de servidores, y la aplicación está reforzada para internet, pero
funciona igual de bien en una red doméstica.

La interfaz y los manuales están disponibles en inglés, alemán, español y tagalo.

| Manual                                                                                                                                                         | Para                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Manual de usuario: [ES](docs/es/user-manual.md) · [EN](docs/en/user-manual.md) · [DE](docs/de/user-manual.md) · [TL](docs/tl/user-manual.md)                   | Jugadores y administradores que usan la interfaz web                                       |
| Manual de operación: [ES](docs/es/operator-manual.md) · [EN](docs/en/operator-manual.md) · [DE](docs/de/operator-manual.md) · [TL](docs/tl/operator-manual.md) | Quien la instala y la mantiene: proxy inverso, HTTPS, copias de seguridad, actualizaciones |

## Requisitos

- Un equipo Linux con [Docker Engine](https://docs.docker.com/engine/install/) 24 o posterior
  (Docker Desktop en Windows o macOS sirve para probarla).
- Memoria suficiente para los juegos que quieras ejecutar: cada juego indica su límite, p. ej.
  3 GB para Minecraft o 16 GB para Palworld. La aplicación en sí necesita unos 200 MB.
- Espacio en disco suficiente; algunos juegos descargan mucho en el primer inicio
  (Counter-Strike 2 unos 60 GB).
- Acceso a internet para el equipo, para que Docker pueda descargar las imágenes de los juegos.
- Solo para ejecutarla sin Docker: Node.js 22.17 o posterior.

## Inicio rápido con Docker

**1. Construye la imagen.** Docker descarga el código por sí mismo; no necesitas Git ni Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

(O `docker build -t pocketdimension .` dentro de un clon.)

**2. Crea una clave secreta** y guárdala. Si cambia, todos tienen que volver a iniciar sesión:

```bash
openssl rand -base64 48
```

**3. Inicia la aplicación:**

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY='<la clave del paso 2>' \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='una-contrasena-larga' \
  pocketdimension
```

| Línea                                 | Para qué                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | La interfaz web escucha en el puerto 3000.                                                                    |
| `-v /var/run/docker.sock:…`           | Permite a la aplicación iniciar y detener contenedores de servidores de juegos.                               |
| `-v pocketdimension-data:/app/shared` | La base de datos SQLite (usuarios, juegos, servidores). Haz copia de seguridad de este volumen.               |
| `--add-host …` y `QUERY_HOST`         | Permite a la aplicación llegar a los puertos publicados de los juegos para mostrar jugadores, mapa y versión. |
| `SECRET_JWT_KEY`                      | Firma las sesiones. Obligatoria, al menos 32 caracteres; sin ella falla todo inicio de sesión.                |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | El primer administrador, creado en el primer inicio si el correo todavía no existe.                           |

**4. Inicia sesión** en `http://<host>:3000` con el correo del administrador (o el nombre `admin`)
y la contraseña. Cambia la contraseña en **Cuenta** y crea allí a tus jugadores con **Añadir
usuario**. La contraseña de administrador del entorno solo se usa en el primer inicio; después
puedes quitarla.

**5. Abre los puertos de los juegos.** Los jugadores se conectan directamente a los puertos del
juego, no a través de la aplicación web. Cada tarjeta de servidor muestra su dirección y puertos en
**Dirección para jugadores**; ábrelos en el cortafuegos y, para jugadores fuera de tu red,
redirígelos en el router. Fíjate en el protocolo (`tcp` o `udp`). Un segundo servidor del mismo
juego usa puertos desplazados en 10 (p. ej. 25575 en lugar de 25565).

### Docker Compose

Pon la configuración en un archivo `.env` junto al `docker-compose.yml`:

```bash
SECRET_JWT_KEY=<salida de openssl rand -base64 48>
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=una-contrasena-larga
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

### Actualizar

```bash
docker compose build --pull --no-cache pocketdimension && docker compose up -d
```

Con `docker run`: vuelve a construir la imagen (paso 1), ejecuta `docker rm -f pocketdimension` e
iníciala de nuevo con el mismo comando y volumen. Los servidores de juegos siguen funcionando
durante la actualización.

## Internet o red doméstica

- **Red doméstica / LAN party:** basta con el inicio rápido. `http` sin cifrar está bien dentro de
  tu propia red. Pon en `PUBLIC_HOST` la dirección que deben ver los jugadores (p. ej.
  `192.168.0.10`) y en `PORT_BIND_IP` la dirección LAN del equipo si los puertos de los juegos no
  deben publicarse en otras interfaces.
- **Internet:** coloca la interfaz web detrás de un proxy inverso con HTTPS (no expongas el puerto
  3000 directamente) y define

  ```bash
  ORIGIN=https://games.example.com
  ADDRESS_HEADER=X-Forwarded-For
  XFF_DEPTH=1
  PUBLIC_HOST=games.example.com
  ```

  `ORIGIN` debe coincidir exactamente con la dirección del navegador; si no, los formularios fallan
  con «Cross-site POST form submissions are forbidden». `ADDRESS_HEADER` permite que el límite de
  intentos de inicio de sesión vea la dirección real del cliente en lugar de la del proxy. Con
  HTTPS la aplicación marca sus cookies como `Secure` y envía HSTS. Ejemplos listos para Caddy y
  nginx, una configuración con docker-socket-proxy y la lista de riesgos que siguen siendo tuyos
  están en el [manual de operación, sección 4](docs/es/operator-manual.md#4-funcionamiento-en-internet).

## Configuración

Todos los ajustes son variables de entorno; [`.env.example`](.env.example) las contiene con
comentarios.

| Variable                  | Valor por defecto                | Significado                                                                                                  |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SECRET_JWT_KEY`          | –                                | **Obligatoria en producción.** Cadena aleatoria de al menos 32 caracteres.                                   |
| `DB_ADMIN_EMAIL`          | –                                | Correo del primer administrador, creado al iniciar si todavía no existe.                                     |
| `DB_ADMIN_PASSWORD`       | –                                | Contraseña de ese administrador. Solo se lee al crear la cuenta.                                             |
| `DB_ADMIN_USER`           | `admin`                          | Nombre de inicio de sesión de ese administrador.                                                             |
| `DB_PATH`                 | `/app/shared/pocketdimension.db` | Archivo de la base de datos SQLite (`shared/pocketdimension.db` fuera de Docker).                            |
| `SESSION_MAX_AGE_SECONDS` | `86400`                          | Cuánto tiempo sigue válida una sesión.                                                                       |
| `PORT`, `HOST`            | `3000`, `0.0.0.0`                | Dónde escucha la interfaz web.                                                                               |
| `ORIGIN`                  | –                                | URL pública detrás de un proxy inverso, p. ej. `https://games.example.com`.                                  |
| `ADDRESS_HEADER`          | –                                | Cabecera con la IP del cliente detrás de un proxy, normalmente `X-Forwarded-For`.                            |
| `XFF_DEPTH`               | –                                | Número de proxies delante de la aplicación, normalmente `1`.                                                 |
| `DOCKER_HOST`             | socket local                     | API de Docker, p. ej. `tcp://docker-proxy:2375` para un docker-socket-proxy.                                 |
| `MAX_SERVERS_PER_USER`    | `2`                              | Servidores que puede tener un jugador sin rol de administrador. Los administradores no tienen límite.        |
| `PUBLIC_HOST`             | nombre de host de la URL         | Dirección que se muestra a los jugadores para conectarse.                                                    |
| `PORT_BIND_IP`            | todas las interfaces             | Interfaz del host en la que se publican los puertos de los juegos.                                           |
| `QUERY_HOST`              | `127.0.0.1`                      | Dónde alcanza la aplicación los puertos publicados para el estado en vivo; `host.docker.internal` en Docker. |
| `PORT_OFFSET_STEP`        | `10`                             | Desplazamiento de puertos para cada servidor adicional del mismo juego.                                      |
| `ENFORCE_MEMORY_LIMITS`   | `true`                           | `false` ejecuta los contenedores de juegos sin su límite de memoria.                                         |
| `CATALOG_URL`             | `catalog/catalog.json` en GitHub | Catálogo compartido de juegos. Vacío = solo los juegos incluidos, sin acceso a la red.                       |
| `CATALOG_SYNC_HOURS`      | `24`                             | Horas entre actualizaciones del catálogo; `0` = solo con el botón.                                           |

La aplicación crea la red Docker `POCKET_DIMENSION_NETWORK` en el primer inicio; no hay nada que
configurar.

## Sin Docker

La aplicación también puede ejecutarse directamente con Node.js 22.17 o posterior. Docker sigue
siendo necesario en el mismo equipo para los servidores de juegos, y el usuario que ejecuta la
aplicación necesita acceso al socket de Docker (p. ej. pertenecer al grupo `docker`).

```bash
git clone https://github.com/damaurer/PocketDimension.git
cd PocketDimension
cp .env.example .env      # define SECRET_JWT_KEY, DB_ADMIN_EMAIL y DB_ADMIN_PASSWORD
npm ci
npm run build
NODE_ENV=production node --env-file=.env server.js
```

La base de datos queda en `shared/pocketdimension.db`. Aquí `QUERY_HOST` puede quedarse con su
valor por defecto. Para mantenerla en marcha, usa un servicio de systemd o el gestor de procesos
que prefieras.

## Copias de seguridad y registros

- Haz copia de seguridad del volumen `pocketdimension-data` y de los volúmenes de los servidores
  `pocketdimension-server-<id>-<index>` (mundos y partidas guardadas); detén el servidor antes.
- `docker logs pocketdimension` muestra el registro de la aplicación y `docker logs <container>` el
  de un servidor de juego. Los administradores encuentran los nombres de los contenedores en
  **Contenedores** dentro de la aplicación.

Detalles y comandos: [manual de operación, sección 6](docs/es/operator-manual.md#6-actualizaciones-copias-de-seguridad-y-registros).

## Solución de problemas

| Síntoma                                                                   | Solución                                                                                                                                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El inicio de sesión falla y el registro dice «SECRET_JWT_KEY must be set» | Define `SECRET_JWT_KEY` con al menos 32 caracteres.                                                                                                                               |
| «Docker no está disponible»                                               | Monta `/var/run/docker.sock` o corrige `DOCKER_HOST`.                                                                                                                             |
| «Cross-site POST form submissions are forbidden»                          | `ORIGIN` no coincide con la URL del navegador; corrígela o déjala sin definir si no hay proxy.                                                                                    |
| La tarjeta sigue diciendo «El servidor todavía no responde»               | Espera a que terminen de arrancar los juegos grandes; en Docker revisa `QUERY_HOST` y `--add-host`.                                                                               |
| Los amigos no pueden conectarse                                           | Abre o redirige los puertos del juego con el protocolo correcto; define `PUBLIC_HOST` si la dirección es incorrecta.                                                              |
| Todos bloqueados tras intentos fallidos detrás de un proxy                | Define `ADDRESS_HEADER` y `XFF_DEPTH`; reiniciar la aplicación elimina el bloqueo.                                                                                                |
| Olvidaste la contraseña de administrador                                  | Otro administrador la restablece en **Cuenta**; si no, inicia una vez con nuevos `DB_ADMIN_EMAIL`, `DB_ADMIN_USER` y `DB_ADMIN_PASSWORD` para obtener un administrador adicional. |

Más en el [manual de operación, sección 8](docs/es/operator-manual.md#8-solución-de-problemas).

## Juegos

El catálogo incluye Minecraft (Java y Bedrock), Valheim, Terraria, Factorio, Counter-Strike 2,
Team Fortress 2, Palworld, Satisfactory, Rust, Core Keeper, Project Zomboid, 7 Days to Die,
Enshrouded, V Rising, ARK: Survival Evolved, Sons of the Forest, Necesse y OpenTTD. Los
administradores pueden desactivarlos y añadir cualquier otro juego que funcione en Docker en
**Juegos → Nueva plantilla de juego** (imagen, puertos, directorios de datos y las variables que
pueden definir los jugadores). Cada servidor recibe sus propios volúmenes Docker; un segundo
servidor del mismo juego recibe puertos desplazados (p. ej. 25575 en lugar de 25565).

### Catálogo compartido de juegos

Los juegos vienen de [`catalog/`](catalog/), un catálogo compartido por todas las instalaciones de
PocketDimension. Cada instancia incluye el catálogo tal como estaba al construirla y descarga
`catalog/catalog.json` de este repositorio una vez al día, solo lectura y sin cuenta ni clave. Los
juegos nuevos llegan desactivados hasta que un administrador los activa; las plantillas propias
nunca se tocan. Define `CATALOG_URL` para apuntar a un fork, o déjala vacía para no conectarse. Para
añadir un juego para todos, expórtalo desde su página de edición y abre un pull request; consulta
[`catalog/README.md`](catalog/README.md).

### Estado en vivo

La lista de servidores muestra CPU y memoria de cada servidor en marcha. Para juegos con protocolo
de consulta (id de [GameDig](https://github.com/gamedig/node-gamedig/blob/master/GAMES_LIST.md) en
la plantilla) también muestra jugadores conectados, mapa y versión. La aplicación consulta cada
juego directamente en la red `POCKET_DIMENSION_NETWORK` y, a la vez, en su puerto publicado en
`QUERY_HOST` (por defecto `127.0.0.1`). Cuando la aplicación se ejecuta en Docker, las líneas
`--add-host` y `QUERY_HOST` de arriba le permiten alcanzar los puertos publicados. Los juegos sin
protocolo de consulta solo muestran CPU, memoria y si están en marcha.

### Acceso a Docker

PocketDimension solo ve los contenedores que ha creado (etiqueta `pocketdimension.managed=true`) y
los conectados a la red `POCKET_DIMENSION_NETWORK`. El acceso al socket de Docker equivale a ser
root en el host: en instalaciones expuestas a internet, ejecútala detrás de un proxy inverso con
HTTPS y considera un [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) mediante
`DOCKER_HOST`.

La imagen ejecuta la aplicación como el usuario sin privilegios `node`; solo arranca como root para
tomar el volumen de datos y unirse al grupo del socket de Docker montado. Los contenedores de juegos
no reciben privilegios adicionales (`no-new-privileges`, sin sockets raw, sin rutas del host) y no
pueden alcanzarse entre sí en `POCKET_DIMENSION_NETWORK`. Qué está cubierto y qué no se explica en
la [sección 4.5 del manual de operación](docs/es/operator-manual.md#45-qué-protege-la-aplicación-y-qué-no).

## Desarrollo

```bash
cp .env.example .env   # rellena DB_ADMIN_* (SECRET_JWT_KEY es opcional en desarrollo)
npm install
npm run dev
```

| Comando                    | Qué hace                                               |
| -------------------------- | ------------------------------------------------------ |
| `npm run lint`             | Prettier y ESLint                                      |
| `npm run check`            | Comprobación de tipos (svelte-check)                   |
| `npm run test:unit`        | Pruebas unitarias (Vitest)                             |
| `npm run test:integration` | Pruebas de navegador contra un build (Playwright)      |
| `npm run build`            | Build de producción, se inicia con `node server.js`    |
| `npm run catalog:check`    | Valida el catálogo compartido de juegos                |
| `npm run catalog:build`    | Regenera `catalog/catalog.json` a partir de los juegos |

**Traducciones:** los textos de la interfaz están en `src/lib/i18n/translations/` (`en`, `de`,
`es`, `tl`), los mensajes del servidor en `src/lib/i18n/messages.ts` y los textos de los juegos en
`src/lib/i18n/catalog.ts`. Las pruebas unitarias fallan cuando falta un texto en algún idioma. Los
manuales están en `docs/<idioma>/`; la versión principal es la inglesa.
