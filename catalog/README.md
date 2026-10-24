# Shared game catalog

Every PocketDimension installation reads this catalog. It ships inside the app image and is
fetched read-only from
`https://raw.githubusercontent.com/damaurer/PocketDimension/main/catalog/catalog.json`, so new
games and fixes reach everyone without an app update. No account, key or server is involved.

- `games/<slug>.json`: one file per game. This is what you edit.
- `catalog.json`: all games in one file, built from `games/` with `npm run catalog:build`.
  Instances download this file. Do not edit it by hand.

## Adding or changing a game

1. Create the game in your own PocketDimension under **Games → New game template** and start a
   server with it to make sure it works.
2. On the game's edit page, click **Export for the catalog**. You get `<slug>.json`.
3. Put the file into `catalog/games/`. When you change an existing game, raise its `version` by
   one; instances only take over an entry whose version is at least the one they have.
4. Run `npm run format`, `npm run catalog:build` and `npm run catalog:check`.
5. Open a pull request. Say which image you used and that you tested it.

## Entry format

The fields are those of the template editor (see the [user manual, section 12](../docs/en/user-manual.md#12-adding-your-own-game)):

| Field          | Required | Meaning                                                                                                                                                                                  |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`      | yes      | Whole number, raised on every change.                                                                                                                                                    |
| `slug`         | yes      | Short name, lowercase letters, digits and dashes. Must match the file name.                                                                                                              |
| `name`         | yes      | Game name.                                                                                                                                                                               |
| `description`  | no       | Short text for players, in English.                                                                                                                                                      |
| `image`        | yes      | Docker image, ideally from the game's well-known community image.                                                                                                                        |
| `ports`        | no       | `{ "container": 25565, "protocol": "tcp", "label": "Game" }` per port.                                                                                                                   |
| `env`          | no       | Settings players may choose, see the manual.                                                                                                                                             |
| `volumes`      | no       | `{ "container": "/data" }` per data directory.                                                                                                                                           |
| `memoryMb`     | no       | Memory limit in MB.                                                                                                                                                                      |
| `query`        | no       | `{ "type": "<GameDig id>", "port": <index into ports> }` for live status.                                                                                                                |
| `docsUrl`      | no       | Link to the image documentation.                                                                                                                                                         |
| `thumbnailUrl` | no       | https address of the card picture (PNG, JPEG, WebP, GIF or AVIF, max. 1 MB, ideally 460 × 215). For Steam games use `https://cdn.akamai.steamstatic.com/steam/apps/<app id>/header.jpg`. |

## Review rules

Instances add new games disabled, but they do take over new versions of games an admin already
enabled. Reviewers therefore check that the image comes from a trustworthy source, that it is the
image the game's community recommends, and that ports, volumes and variables match its README.
