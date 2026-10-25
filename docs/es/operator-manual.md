# Pocket Dimension – Manual de operación

[English](../en/operator-manual.md) · [Deutsch](../de/operator-manual.md) · **Español** ·
[Tagalog](../tl/operator-manual.md)

Pocket Dimension es una aplicación web con la que tú y tus compañeros de juego inician sus propios
servidores de juegos con un clic. Cada servidor se ejecuta como su propio contenedor Docker en tu
ordenador o servidor. La aplicación muestra quién está jugando y cuánta CPU y memoria necesita cada
servidor.

Este manual de operación es para la persona que instala y opera Pocket Dimension. Cómo usan la
interfaz los jugadores y administradores se explica en el [manual de usuario](user-manual.md).

## Contenido

- [1. Requisitos](#1-requisitos)
- [2. Instalación](#2-instalación)
- [3. Solo en la red doméstica](#3-solo-en-la-red-doméstica)
- [4. Funcionamiento en internet](#4-funcionamiento-en-internet)
  - [4.5 Qué protege la aplicación y qué no](#45-qué-protege-la-aplicación-y-qué-no)
- [5. Todos los ajustes](#5-todos-los-ajustes)
- [6. Actualizaciones, copias de seguridad y registros](#6-actualizaciones-copias-de-seguridad-y-registros)
- [7. Jugadores en vivo y catálogo de juegos](#7-jugadores-en-vivo-y-catálogo-de-juegos)
- [8. Solución de problemas](#8-solución-de-problemas)
- [9. Inicio de sesión único](#9-inicio-de-sesión-único)

---

## 1. Requisitos

- Un equipo Linux con [Docker](https://docs.docker.com/engine/install/) (Docker Engine 24 o más
  reciente). Windows y macOS con Docker Desktop también sirven para pruebas.
- Suficiente memoria para los juegos que quieras ejecutar. Cada plantilla de juego indica su
  límite de memoria, por ejemplo 3 GB para Minecraft o 16 GB para Palworld. La aplicación en sí
  necesita unos 200 MB.
- Suficiente espacio en disco. Algunos juegos descargan mucho en el primer inicio (Counter-Strike 2
  unos 60 GB).
- Acceso a internet para el equipo, para que Docker pueda descargar las imágenes de los juegos.

> **Importante:** Pocket Dimension necesita acceso a Docker. Quien administra la aplicación puede
> iniciar cualquier contenedor con ella. Da derechos de administrador solo a personas a las que
> también confiarías el equipo.

## 2. Instalación

Pocket Dimension se ejecuta como contenedor Docker. Construyes la imagen tú mismo, una vez, desde
el repositorio de GitHub; Docker descarga el código fuente por sí solo, así que no necesitas ni Git
ni Node.js:

```bash
docker build -t pocketdimension https://github.com/damaurer/PocketDimension.git#main
```

La primera vez tarda unos minutos. Si ya clonaste el repositorio, también puedes ejecutar
`docker build -t pocketdimension .` en su carpeta. También funciona sin Docker, directamente con
Node.js; se explica en el [README](../../README.es.md#sin-docker).

### 2.1 Con `docker run`

```bash
docker run -d --name pocketdimension --restart unless-stopped \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pocketdimension-data:/app/shared \
  --add-host host.docker.internal:host-gateway \
  -e QUERY_HOST=host.docker.internal \
  -e SECRET_JWT_KEY="$(openssl rand -base64 48)" \
  -e DB_ADMIN_EMAIL=admin@example.com \
  -e DB_ADMIN_PASSWORD='una-contrasena-larga' \
  pocketdimension
```

Qué significan las líneas:

| Línea                                 | Para qué                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `-p 3000:3000`                        | La interfaz web está disponible en el puerto 3000.                                  |
| `-v /var/run/docker.sock:…`           | La aplicación puede controlar Docker para iniciar servidores de juegos.             |
| `-v pocketdimension-data:/app/shared` | Base de datos con usuarios, juegos y servidores. Debes hacer copia de este volumen. |
| `--add-host …` y `QUERY_HOST`         | La aplicación llega a los servidores de juegos para consultar los jugadores.        |
| `SECRET_JWT_KEY`                      | Clave secreta para los inicios de sesión. Obligatoria, al menos 32 caracteres.      |
| `DB_ADMIN_EMAIL`, `DB_ADMIN_PASSWORD` | La primera cuenta de administrador. Se crea en el primer inicio.                    |

> Genera `SECRET_JWT_KEY` una sola vez y guárdala. Si cambia, todos tienen que volver a iniciar
> sesión. Por eso es mejor guardarla en un archivo; ver Docker Compose más abajo.

### 2.2 Con Docker Compose (recomendado)

Crea una carpeta, por ejemplo `/opt/pocketdimension`, con dos archivos dentro.

`.env`:

```bash
SECRET_JWT_KEY=aqui-el-resultado-de-openssl-rand-base64-48
DB_ADMIN_EMAIL=admin@example.com
DB_ADMIN_PASSWORD=una-contrasena-larga
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

Construir e iniciar con:

```bash
docker compose up -d --build
```

### 2.3 Primer inicio de sesión

Abre `http://<direccion-del-equipo>:3000` e inicia sesión con `DB_ADMIN_EMAIL` (o el nombre
`admin`) y `DB_ADMIN_PASSWORD`. Después cambia tu contraseña en **Cuenta** y crea las cuentas de tus
jugadores en **Cuenta → Añadir usuario**.

La contraseña de administrador de `.env` solo se usa en el primer inicio. Después puedes quitarla
del archivo.

Cómo seguir (añadir usuarios, activar juegos, crear servidores) se explica en el
[manual de usuario](user-manual.md).

## 3. Solo en la red doméstica

Para una LAN party o la red doméstica basta con la instalación de la sección 2. La aplicación
funciona entonces con `http` simple, lo cual está bien dentro de tu propia red.

- Los jugadores abren `http://<ip-del-equipo>:3000`, por ejemplo `http://192.168.0.10:3000`.
- La dirección que la aplicación muestra a los jugadores para conectarse es el nombre con el que
  se abrió la página. Para mostrar siempre la misma dirección, define `PUBLIC_HOST=192.168.0.10`.
- Si los juegos solo deben estar disponibles en la red doméstica aunque el equipo también esté
  conectado a internet, define `PORT_BIND_IP` con la dirección del equipo en la red doméstica, por
  ejemplo `PORT_BIND_IP=192.168.0.10`. Así Docker publica los puertos de los juegos solo en esa
  interfaz de red.

## 4. Funcionamiento en internet

Si van a jugar amigos desde fuera, la interfaz web debe ir detrás de un proxy inverso con HTTPS.
Los puertos de los juegos no pasan por el proxy; se abren directamente.

### 4.1 Lista de comprobación

1. **Dominio:** apunta un dominio a tu IP pública, por ejemplo `games.example.com`.
2. **Proxy inverso con HTTPS** delante del puerto 3000 (ejemplos más abajo). No abras el puerto
   3000 directamente a internet.
3. **Ajustes de la aplicación** en `.env`:
   ```bash
   ORIGIN=https://games.example.com
   ADDRESS_HEADER=X-Forwarded-For
   XFF_DEPTH=1
   PUBLIC_HOST=games.example.com
   ```
   `ORIGIN` es la dirección pública. `ADDRESS_HEADER` y `XFF_DEPTH` hacen que el bloqueo tras
   demasiados intentos de inicio de sesión vea la IP real del visitante y no la del proxy.
4. **Abrir los puertos de los juegos:** en el router (redirección de puertos) y en el cortafuegos
   del equipo, abre los puertos de los juegos que uséis. Los puertos de cada servidor aparecen en
   la lista de servidores en **Dirección para jugadores**. Un segundo servidor del mismo juego
   recibe puertos desplazados en 10 (por ejemplo 25575 en lugar de 25565).
5. **Una contraseña de administrador fuerte** y solo administradores de confianza.
6. **Opcional pero recomendado:** usa un
   [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) para que la aplicación
   no tenga acceso completo a Docker (ver 4.4).

Cuando la página se abre por HTTPS, la aplicación marca automáticamente sus cookies de inicio de
sesión como `Secure` y envía una cabecera HSTS.

### 4.2 Ejemplo: Caddy

Caddy obtiene el certificado HTTPS por sí solo. Amplía `docker-compose.yml`:

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
    # como arriba, pero sin "ports:"

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

### 4.3 Ejemplo: nginx

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

Aquí la aplicación se ejecuta con `-p 127.0.0.1:3000:3000`, de modo que el puerto 3000 solo es
accesible localmente.

### 4.4 Limitar el acceso a Docker

En lugar de montar el socket de Docker directamente, la aplicación puede hablar con Docker a través
de un proxy de socket. El proxy solo permite las áreas que necesita Pocket Dimension:

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
    # como arriba, pero sin el socket de Docker en "volumes:"
    environment:
      DOCKER_HOST: tcp://docker-proxy:2375
```

De todas formas, Pocket Dimension solo ve los contenedores que creó él mismo o que están en la red
`POCKET_DIMENSION_NETWORK`. Todos los demás contenedores del equipo quedan invisibles.

> **Siendo sinceros:** incluso a través del proxy de socket la aplicación puede crear contenedores.
> Quien tome el control total de la aplicación puede seguir iniciando contenedores con todos los
> derechos. El proxy reduce la superficie de ataque (sin acceso a Swarm, secretos, plugins, `exec`,
> etc.), pero no sustituye una contraseña de administrador fuerte ni las actualizaciones. Nunca
> conectes el proxy de socket a la red `POCKET_DIMENSION_NETWORK`, o los servidores de juegos
> podrían alcanzarlo.

### 4.5 Qué protege la aplicación y qué no

Pocket Dimension está reforzado para funcionar en internet:

- **Inicio de sesión:** las contraseñas se guardan con bcrypt. Tras 10 intentos fallidos para la
  misma cuenta desde la misma IP, y tras 50 intentos fallidos en total desde una IP, se bloquean
  los inicios de sesión durante 15 minutos. Detrás de un proxy inverso esto solo funciona con
  `ADDRESS_HEADER` (ver 4.1); si no, la aplicación ve a todos los visitantes con la IP del proxy.
- **Protección del navegador:** Content Security Policy, protección contra la inserción en otras
  páginas y protección de formularios contra solicitudes entre sitios están siempre activas. Las
  cookies de inicio de sesión son `HttpOnly` y, con HTTPS, `Secure`.
- **Contenedor de la aplicación:** la imagen inicia la aplicación como el usuario normal `node`, no
  como `root`. Al arrancar solo toma posesión del directorio de datos y se une al grupo del socket
  de Docker; después renuncia a todos los privilegios.
- **Servidores de juegos:** cada servidor se ejecuta en su propio contenedor sin derechos
  especiales (`no-new-privileges`, sin raw sockets, límite de procesos, límite de memoria de la
  plantilla). Las plantillas de juego no pueden montar `privileged`, ni carpetas del equipo, ni el
  socket de Docker, solo sus propios volúmenes Docker. Los servidores de juegos de distintos
  usuarios no pueden alcanzarse entre sí en la red `POCKET_DIMENSION_NETWORK`, así que, por
  ejemplo, los puertos RCON siguen siendo privados.
- **Descargas:** el catálogo de juegos y las miniaturas solo se leen, tienen un límite de tamaño y
  las miniaturas nunca se cargan desde tu propia red.

Lo que debes vigilar tú:

- Los **administradores** pueden registrar cualquier imagen Docker como juego. La imagen se ejecuta
  aislada, pero puede hacer todo lo que puede hacer un programa en internet y en tu red doméstica.
  Da derechos de administrador solo a personas a las que confiarías el equipo.
- **Los servidores de juegos llegan a tu red doméstica.** Los contenedores Docker pueden hablar con
  otros dispositivos de la red local (router, NAS). Para evitarlo, ejecuta Pocket Dimension en un
  equipo aparte o en un segmento de red separado (VLAN, red de invitados).
- **CPU:** la memoria está limitada por juego, el tiempo de CPU no. Un servidor colgado puede
  ralentizar el equipo; **Detener** ayuda.
- **Catálogo compartido:** los juegos del catálogo reciben actualizaciones automáticas, incluso una
  imagen distinta. Si no lo quieres, define `CATALOG_SYNC_HOURS=0` y actualiza con el botón, o
  `CATALOG_URL=` (vacío) para no consultar el catálogo en absoluto.
- **Actualizaciones:** las imágenes de los juegos cambian constantemente. Un servidor descarga la
  imagen más reciente al crearse; los servidores existentes se quedan como están hasta que los
  elimines y los vuelvas a crear.

## 5. Todos los ajustes

Todos los ajustes son variables de entorno. Hay una plantilla con comentarios en
[`.env.example`](../../.env.example).

| Variable                  | Predeterminado                     | Significado                                                                                                    |
| ------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `SECRET_JWT_KEY`          | –                                  | Obligatoria en producción. Texto aleatorio de al menos 32 caracteres.                                          |
| `DB_ADMIN_USER`           | `admin`                            | Nombre del primer administrador (para iniciar sesión en lugar del correo).                                     |
| `DB_ADMIN_EMAIL`          | –                                  | Correo del primer administrador.                                                                               |
| `DB_ADMIN_PASSWORD`       | –                                  | Contraseña del primer administrador, solo necesaria en el primer inicio.                                       |
| `DB_PATH`                 | `/app/shared/pocketdimension.db`   | Ubicación de la base de datos.                                                                                 |
| `SESSION_MAX_AGE_SECONDS` | `86400`                            | Cuánto dura un inicio de sesión (segundos).                                                                    |
| `ORIGIN`                  | –                                  | Dirección pública detrás de un proxy inverso, p. ej. `https://games.example.com`.                              |
| `ADDRESS_HEADER`          | –                                  | Cabecera con la IP real del visitante detrás de un proxy, normalmente `X-Forwarded-For`.                       |
| `XFF_DEPTH`               | –                                  | Número de proxies delante de la aplicación, normalmente `1`.                                                   |
| `DOCKER_HOST`             | socket local                       | Otra dirección de Docker, p. ej. un proxy de socket.                                                           |
| `MAX_SERVERS_PER_USER`    | `2`                                | Cuántos servidores puede tener un jugador sin derechos de administrador. Los administradores no tienen límite. |
| `PUBLIC_HOST`             | dirección de la página             | Dirección que se muestra a los jugadores para conectarse.                                                      |
| `PORT_BIND_IP`            | todas las interfaces de red        | Interfaz de red en la que se publican los puertos de los juegos.                                               |
| `QUERY_HOST`              | `127.0.0.1`                        | Dirección en la que la aplicación alcanza los puertos publicados para el estado en vivo (ver 7.1).             |
| `PORT_OFFSET_STEP`        | `10`                               | Paso con el que se desplazan los puertos de otro servidor del mismo juego.                                     |
| `ENFORCE_MEMORY_LIMITS`   | `true`                             | `false` inicia los juegos sin el límite de memoria de su plantilla.                                            |
| `CATALOG_URL`             | catálogo del repositorio de GitHub | Dirección del catálogo compartido de juegos (ver 7.2). Vacío = solo los juegos incluidos con la aplicación.    |
| `CATALOG_SYNC_HOURS`      | `24`                               | Horas entre consultas automáticas del catálogo. `0` = solo con el botón.                                       |
| `OIDC_ISSUER`             | –                                  | Inicio de sesión único: dirección del issuer del proveedor OpenID Connect (ver 9).                             |
| `OIDC_CLIENT_ID`          | –                                  | Client ID registrado en el proveedor.                                                                          |
| `OIDC_CLIENT_SECRET`      | –                                  | Client secret; vacío para un cliente público.                                                                  |
| `OIDC_NAME`               | `SSO`                              | Nombre en el botón de inicio de sesión («Iniciar sesión con …»).                                               |
| `OIDC_SCOPES`             | `openid email profile`             | Scopes que se piden al proveedor.                                                                              |
| `OIDC_AUTO_CREATE`        | `true`                             | `false` = solo las cuentas existentes pueden entrar.                                                           |
| `OIDC_ROLES_CLAIM`        | `roles`                            | Claim con roles o grupos, p. ej. `realm_access.roles`.                                                         |
| `OIDC_ADMIN_ROLE`         | –                                  | Rol o grupo que hace administrador a alguien. Vacío = los roles se gestionan en la aplicación.                 |
| `LOCAL_LOGIN`             | `true`                             | `false` = solo inicio de sesión único (si OIDC está configurado).                                              |

## 6. Actualizaciones, copias de seguridad y registros

### Actualizaciones

```bash
docker compose build --pull --no-cache pocketdimension
docker compose up -d
```

`--no-cache` hace que Docker descargue el estado más reciente de GitHub. Con `docker run`,
reconstruye la imagen como en la sección 2, elimina el contenedor antiguo con
`docker rm -f pocketdimension` e inícialo con el mismo comando que antes. La base de datos y los
servidores de juegos se conservan mientras montes el mismo volumen `pocketdimension-data`.

Los servidores de juegos en marcha no se detienen con esto. Tras algunas actualizaciones, todos los
usuarios tienen que volver a iniciar sesión.

**Nota para instalaciones anteriores a octubre de 2026:** desde la actualización de seguridad, la
aplicación ya no se ejecuta como `root` en su contenedor. En el primer inicio toma posesión del
directorio de datos automáticamente; no tienes que hacer nada. Además separa entre sí los
servidores de juegos en la red. En instalaciones existentes esto solo se aplica cuando se vuelve a
crear la red; la aplicación lo indica en su registro («lets game servers reach each other»). Así la
vuelves a crear, mientras los servidores de juegos siguen funcionando:

```bash
docker compose stop pocketdimension
servers=$(docker ps -aq --filter network=POCKET_DIMENSION_NETWORK)
for c in $servers; do docker network disconnect POCKET_DIMENSION_NETWORK "$c"; done
docker network rm POCKET_DIMENSION_NETWORK
docker network create -o com.docker.network.bridge.enable_icc=false POCKET_DIMENSION_NETWORK
for c in $servers; do docker network connect POCKET_DIMENSION_NETWORK "$c"; done
docker compose up -d
```

### Copias de seguridad

Haz copia con regularidad de:

- el volumen `pocketdimension-data` (usuarios, plantillas de juego, lista de servidores),
- los volúmenes de los servidores de juegos. Se llaman `pocketdimension-server-<número>-<índice>`
  y contienen mundos y partidas guardadas.

Un ejemplo para un volumen:

```bash
docker run --rm -v pocketdimension-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/pocketdimension-data.tar.gz -C /data .
```

Detén un servidor de juegos antes de copiar su volumen para que la partida guardada esté completa.

### Registros

```bash
docker logs pocketdimension                  # la aplicación
docker logs pocketdimension-minecraft-java-3 # un servidor de juegos
```

El nombre del contenedor de un servidor de juegos aparece en **Contenedores** (solo
administradores).

---

## 7. Jugadores en vivo y catálogo de juegos

### 7.1 Jugadores en vivo (estado en vivo)

Para mostrar los jugadores, la aplicación consulta los servidores de juegos con
[GameDig](https://github.com/gamedig/node-gamedig). Qué juegos lo admiten se indica en el
[manual de usuario](user-manual.md#valores-en-vivo).

La aplicación intenta llegar a cada servidor de dos formas a la vez:

1. directamente en la red Docker `POCKET_DIMENSION_NETWORK`, que la aplicación crea ella misma al
   arrancar,
2. a través del puerto publicado en `QUERY_HOST`.

Si la propia aplicación se ejecuta en Docker, la segunda forma necesita
`QUERY_HOST=host.docker.internal` y `--add-host host.docker.internal:host-gateway` (o
`extra_hosts` en Compose). Ambos ya están en los ejemplos de la sección 2. Si la aplicación se
ejecuta directamente en el equipo sin Docker, basta el valor predeterminado `127.0.0.1`.

### 7.2 Catálogo compartido de juegos

Los juegos vienen de un catálogo que comparten todas las instalaciones de Pocket Dimension. Es
público en la carpeta [`catalog/`](../../catalog/) del repositorio de GitHub. La aplicación solo
descarga `catalog/catalog.json`, en modo lectura: sin cuenta, sin clave y sin coste. No se envía
ningún dato sobre tu instalación.

- **Incluido:** los juegos del catálogo también se incluyen en la imagen al construir la
  aplicación. Sin internet o con `CATALOG_URL` vacío, los juegos incluidos siempre están
  disponibles.
- **Consultas:** al arrancar y después cada `CATALOG_SYNC_HOURS` horas (24 por defecto). Con
  `CATALOG_SYNC_HOURS=0`, solo cuando un administrador pulsa **Actualizar catálogo**.
- Los **juegos nuevos** llegan desactivados; un administrador los activa. Cómo se ve en la interfaz
  se explica en el [manual de usuario, sección 13](user-manual.md#13-el-catálogo-compartido-de-juegos).
- **Tu propio catálogo:** para mantener tu propia selección, haz un fork del repositorio y define
  `CATALOG_URL` con tu propio `catalog.json`, p. ej.
  `https://raw.githubusercontent.com/<nombre>/PocketDimension/main/catalog/catalog.json`.
- **Aportar un juego:** ver [`catalog/README.md`](../../catalog/README.md).

---

## 8. Solución de problemas

**«Docker no está disponible»**
La aplicación no llega a Docker. Comprueba que el socket de Docker está montado
(`-v /var/run/docker.sock:/var/run/docker.sock`), o que `DOCKER_HOST` es correcto y el proxy de
socket está en marcha.

**El registro dice «the Docker socket … is not group-writable; the app keeps running as root»**
El socket de Docker montado solo permite acceso a `root`, así que la aplicación no puede renunciar
a sus privilegios. Funciona igualmente. Mejor: usa un proxy de socket (sección 4.4).

**«Demasiados intentos de inicio de sesión» aunque la contraseña es correcta**
Tras demasiados intentos fallidos desde una IP, la aplicación la bloquea durante 15 minutos. Si
afecta a todos los usuarios a la vez, falta `ADDRESS_HEADER` detrás del proxy inverso (sección
4.1). Reiniciar la aplicación levanta el bloqueo de inmediato.

**Un servidor se queda en «Descargando»**
Las imágenes grandes tardan. Con `docker pull <imagen>` en el equipo ves el progreso. Si la
descarga falla, la tarjeta muestra un error y **Reintentar**.

**Un servidor muestra «Error»**
El mensaje de la tarjeta indica el motivo, como una imagen incorrecta o puertos ocupados. Corrige
la causa y haz clic en **Reintentar**. Los registros del juego se ven con
`docker logs <nombre-del-contenedor>`.

**Los amigos no pueden conectarse**

- ¿Está el servidor **En marcha**?
- ¿Están los puertos de **Dirección para jugadores** redirigidos en el router y abiertos en el
  cortafuegos? Fíjate en el protocolo (`tcp` o `udp`).
- ¿Muestra la dirección el nombre correcto? Si no, define `PUBLIC_HOST`.

**Los jugadores en vivo se quedan en «El servidor todavía no responde»**

- El juego aún está arrancando. Espera unos minutos.
- Si la aplicación se ejecuta en Docker, comprueba `QUERY_HOST` y `--add-host` (sección 7.1).
- Un cortafuegos en el equipo puede bloquear la consulta.

**Al enviar un formulario aparece «Cross-site POST form submissions are forbidden»**
La dirección del navegador no coincide con `ORIGIN`. Define `ORIGIN` exactamente con la dirección
con la que se abre la página, o quita la variable si no usas un proxy inverso.

**Olvidaste la contraseña del administrador**
Otro administrador puede restablecerla en **Cuenta → Usuarios**. Si no hay ninguno, inicia la
aplicación una vez con un `DB_ADMIN_EMAIL` nuevo, un `DB_ADMIN_USER` nuevo y `DB_ADMIN_PASSWORD`;
entonces se crea una cuenta de administrador adicional.

**¿Has encontrado un error?**
Infórmalo en
[github.com/damaurer/PocketDimension/issues](https://github.com/damaurer/PocketDimension/issues) o
con **Informar de un problema** abajo en la aplicación.

## 9. Inicio de sesión único

Además del inicio de sesión normal con nombre y contraseña, Pocket Dimension puede permitir entrar
a través de un proveedor OpenID Connect, por ejemplo Keycloak, Authentik, Authelia, Zitadel o
Microsoft Entra ID. Está desactivado hasta que se definen `OIDC_ISSUER` y `OIDC_CLIENT_ID`. Entonces
la página de inicio de sesión muestra un botón **Iniciar sesión con …** debajo del formulario normal.

### 9.1 Configurar Keycloak

1. En tu realm, abre **Clients → Create client**. Client type _OpenID Connect_, Client ID por
   ejemplo `pocketdimension`.
2. Activa **Client authentication** y deja marcado solo **Standard flow**.
3. En **Login settings** introduce (con tu propia dirección):
   - **Valid redirect URIs:** `https://games.example.com/auth/oidc/callback`
   - **Valid post logout redirect URIs:** `https://games.example.com/`
   - **Web origins:** `https://games.example.com`
4. Copia el **Client secret** de la pestaña **Credentials**.
5. Opcional, derechos de administrador desde Keycloak (ver 9.3): crea un rol de realm, por ejemplo
   `pocketdimension-admin`, y asígnalo a quienes deban ser administradores. De forma predeterminada
   Keycloak pone los roles de realm solo en el access token, así que abre **Client scopes → roles →
   Mappers → realm roles** y activa **Add to ID token** y **Add to userinfo**.

Después inicia Pocket Dimension con estas variables adicionales:

```bash
OIDC_ISSUER=https://sso.example.com/realms/games
OIDC_CLIENT_ID=pocketdimension
OIDC_CLIENT_SECRET=<client secret>
OIDC_NAME=Keycloak
# opcional, ver 9.3
OIDC_ROLES_CLAIM=realm_access.roles
OIDC_ADMIN_ROLE=pocketdimension-admin
```

`OIDC_ISSUER` es la dirección bajo la que está `/.well-known/openid-configuration`; en Keycloak es
`https://<keycloak>/realms/<realm>`. La propia aplicación (dentro de su contenedor) debe poder
alcanzarla. Otros proveedores funcionan igual: registra una aplicación web con la URI de
redirección del paso 3 y usa el issuer, el client ID y el secreto que te den.

Detrás de un proxy inverso, define `ORIGIN` (sección 4), porque la URI de redirección se construye a
partir de ella.

### 9.2 Cuentas

- **Primer inicio de sesión:** la aplicación crea una cuenta con el correo y el nombre de usuario
  del proveedor. No tiene contraseña y su correo solo se puede cambiar en el proveedor. Con
  `OIDC_AUTO_CREATE=false` no se crean cuentas; entonces solo pueden entrar personas con una cuenta
  existente.
- **Cuentas existentes:** si ya existe una cuenta con el mismo correo, se vincula en el primer
  inicio de sesión, pero solo si el proveedor marca el correo como verificado (`email_verified`; en
  Keycloak, el interruptor **Email verified** del usuario). Si no, la página de inicio de sesión
  indica que el correo ya está en uso. Una cuenta vinculada puede entrar de las dos formas.
- La cuenta está ligada al ID de usuario del proveedor (`sub`), no al correo. Si el correo cambia
  después en el proveedor, no se crea una segunda cuenta.
- Un administrador puede poner una contraseña a una cuenta de inicio de sesión único en **Cuenta →
  Usuarios**. Entonces también puede entrar con el formulario normal.

### 9.3 Rol de administrador desde el proveedor

Sin `OIDC_ADMIN_ROLE`, los roles se gestionan en la aplicación como antes: las cuentas nuevas son
jugadores y un administrador las promueve.

Con `OIDC_ADMIN_ROLE`, decide el proveedor. En cada inicio de sesión la aplicación lee el claim
indicado en `OIDC_ROLES_CLAIM` del ID token y de userinfo. El valor predeterminado es `roles`; un
punto lee un claim anidado, como `realm_access.roles` de Keycloak; para grupos usa por ejemplo
`groups`. Si el claim contiene el valor de `OIDC_ADMIN_ROLE`, la cuenta pasa a ser administrador; si
no, pierde los derechos de administrador. Los cambios del rol en la aplicación se sobrescriben en el
siguiente inicio de sesión.

> **Atención:** esto también vale para cuentas vinculadas, incluido el primer administrador de
> `DB_ADMIN_EMAIL`. Asígnate el rol en el proveedor antes de entrar con esa cuenta, o después ya no
> será administrador.

### 9.4 Solo inicio de sesión único

`LOCAL_LOGIN=false` oculta el formulario de contraseña y rechaza los inicios de sesión con
contraseña. Solo tiene efecto cuando OIDC está configurado. Asegúrate antes de que al menos un
administrador pueda entrar a través del proveedor. Si el proveedor no funciona, reinicia la
aplicación sin `LOCAL_LOGIN=false` para volver a entrar.

### 9.5 Seguridad

- La aplicación usa el flujo de código de autorización con PKCE (S256), `state` y `nonce`, y
  comprueba la firma, el emisor, el destinatario y la caducidad del ID token. `state`, `nonce` y el
  verificador PKCE se guardan diez minutos en una cookie HttpOnly firmada.
- `http://` sin cifrar para el issuer solo se acepta para probar en local. En otro caso usa HTTPS.
- **Cerrar sesión** termina la sesión en la aplicación y, tras un inicio de sesión único, también en
  el proveedor, y luego vuelve a la página de inicio de sesión.
- Bloquear a alguien en el proveedor impide nuevos inicios de sesión. Una sesión ya abierta en la
  aplicación sigue siendo válida hasta que caduca (`SESSION_MAX_AGE_SECONDS`, un día de forma
  predeterminada). Para terminarla enseguida, pon una contraseña nueva a la cuenta en **Cuenta →
  Usuarios**; eso la desconecta en todas partes.

### 9.6 Solución de problemas

**«El inicio de sesión único falló»**
El registro de la aplicación (`docker logs pocketdimension`) indica el motivo. Lo habitual:
`OIDC_ISSUER` incorrecto, el proveedor no es accesible desde el contenedor o el client secret es
incorrecto.

**Keycloak muestra «Invalid parameter: redirect_uri»**
La dirección de **Valid redirect URIs** no coincide exactamente. Debe ser la dirección con la que
se abre la aplicación más `/auth/oidc/callback`. Detrás de un proxy, revisa `ORIGIN`.

**No se aplica el rol de administrador**
El claim falta en el ID token y en userinfo. En Keycloak, activa **Add to ID token** en el mapper
«realm roles» (paso 5 de 9.1) y revisa `OIDC_ROLES_CLAIM`.
