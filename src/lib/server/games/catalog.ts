import type { GameTemplateInput } from '#lib/games/types.ts';

/**
 * Games that ship with PocketDimension. They are inserted on start and kept up
 * to date by slug; administrators can disable them or add their own templates.
 *
 * Images, ports and variables follow each image's README.
 */
export const BUILTIN_TEMPLATES: GameTemplateInput[] = [
	{
		slug: 'minecraft-java',
		name: 'Minecraft: Java Edition',
		description:
			'Vanilla, Paper, Fabric, Forge and more. Downloads the server on first start. By creating the server you accept the Minecraft EULA.',
		image: 'itzg/minecraft-server:latest',
		ports: [{ container: 25565, protocol: 'tcp', label: 'Game' }],
		env: [
			{
				key: 'EULA',
				label: 'Accept the Minecraft EULA',
				options: ['TRUE'],
				default: 'TRUE',
				required: true
			},
			{
				key: 'TYPE',
				label: 'Server type',
				options: ['VANILLA', 'PAPER', 'FABRIC', 'FORGE', 'NEOFORGE', 'PURPUR'],
				default: 'VANILLA'
			},
			{ key: 'VERSION', label: 'Minecraft version', default: 'LATEST' },
			{ key: 'MEMORY', label: 'Java memory', default: '2G' },
			{ key: 'MOTD', label: 'Message of the day', default: 'A PocketDimension server' },
			{
				key: 'DIFFICULTY',
				label: 'Difficulty',
				options: ['peaceful', 'easy', 'normal', 'hard'],
				default: 'normal'
			},
			{ key: 'MAX_PLAYERS', label: 'Max players', default: '10' },
			{
				key: 'ONLINE_MODE',
				label: 'Check accounts with Mojang',
				options: ['TRUE', 'FALSE'],
				default: 'TRUE'
			}
		],
		volumes: [{ container: '/data' }],
		memoryMb: 3072,
		query: { type: 'minecraft', port: 0 },
		docsUrl: 'https://docker-minecraft-server.readthedocs.io/'
	},
	{
		slug: 'valheim',
		name: 'Valheim',
		description: 'Viking survival. The server password needs at least 5 characters.',
		image: 'lloesche/valheim-server:latest',
		ports: [
			{ container: 2456, protocol: 'udp', label: 'Game' },
			{ container: 2457, protocol: 'udp', label: 'Query' }
		],
		env: [
			{ key: 'SERVER_NAME', label: 'Server name', default: 'PocketDimension', required: true },
			{ key: 'WORLD_NAME', label: 'World name', default: 'Dedicated', required: true },
			{
				key: 'SERVER_PASS',
				label: 'Server password (min. 5 characters)',
				required: true,
				secret: true
			},
			{
				key: 'SERVER_PUBLIC',
				label: 'List in server browser',
				options: ['false', 'true'],
				default: 'false'
			}
		],
		volumes: [{ container: '/config' }, { container: '/opt/valheim' }],
		memoryMb: 4096,
		query: { type: 'valheim', port: 1 },
		docsUrl: 'https://github.com/lloesche/valheim-server-docker'
	},
	{
		slug: 'terraria',
		name: 'Terraria',
		description: 'Vanilla Terraria server. A new world is created on first start.',
		image: 'passivelemon/terraria-docker:terraria-latest',
		ports: [{ container: 7777, protocol: 'tcp', label: 'Game' }],
		env: [
			{ key: 'WORLDNAME', label: 'World name', default: 'World', required: true },
			{
				key: 'AUTOCREATE',
				label: 'World size (1 small, 2 medium, 3 large)',
				options: ['1', '2', '3'],
				default: '2',
				required: true
			},
			{
				key: 'DIFFICULTY',
				label: 'Difficulty (0 normal, 1 expert, 2 master, 3 journey)',
				options: ['0', '1', '2', '3'],
				default: '0'
			},
			{ key: 'MAXPLAYERS', label: 'Max players', default: '8' },
			{ key: 'PASSWORD', label: 'Server password', secret: true },
			{ key: 'MOTD', label: 'Message of the day' }
		],
		volumes: [{ container: '/opt/terraria/config' }],
		memoryMb: 2048,
		docsUrl: 'https://github.com/PassiveLemon/terraria-docker'
	},
	{
		slug: 'factorio',
		name: 'Factorio',
		description: 'Factory building. Creates a new save on first start.',
		image: 'factoriotools/factorio:stable',
		ports: [
			{ container: 34197, protocol: 'udp', label: 'Game' },
			{ container: 27015, protocol: 'tcp', label: 'RCON' }
		],
		env: [],
		volumes: [{ container: '/factorio' }],
		memoryMb: 2048,
		docsUrl: 'https://github.com/factoriotools/factorio-docker'
	},
	{
		slug: 'counter-strike-2',
		name: 'Counter-Strike 2',
		description:
			'Needs a Game Server Login Token from steamcommunity.com/dev/managegameservers. Downloads about 60 GB on first start.',
		image: 'joedwards32/cs2:latest',
		ports: [
			{ container: 27015, protocol: 'tcp', label: 'Game (TCP)' },
			{ container: 27015, protocol: 'udp', label: 'Game' },
			{ container: 27020, protocol: 'udp', label: 'SourceTV' }
		],
		env: [
			{ key: 'SRCDS_TOKEN', label: 'Game Server Login Token', required: true, secret: true },
			{ key: 'CS2_SERVERNAME', label: 'Server name', default: 'PocketDimension CS2' },
			{ key: 'CS2_PW', label: 'Server password', secret: true },
			{ key: 'CS2_RCONPW', label: 'RCON password', secret: true },
			{ key: 'CS2_MAXPLAYERS', label: 'Max players', default: '10' }
		],
		volumes: [{ container: '/home/steam/cs2-dedicated' }],
		memoryMb: 4096,
		query: { type: 'counterstrike2', port: 1 },
		docsUrl: 'https://github.com/joedwards32/CS2'
	},
	{
		slug: 'palworld',
		name: 'Palworld',
		description: 'Creature collecting survival game.',
		image: 'thijsvanloef/palworld-server-docker:latest',
		ports: [
			{ container: 8211, protocol: 'udp', label: 'Game' },
			{ container: 27015, protocol: 'udp', label: 'Query' }
		],
		env: [
			{ key: 'SERVER_NAME', label: 'Server name', default: 'PocketDimension Palworld' },
			{ key: 'PLAYERS', label: 'Max players', default: '16' },
			{ key: 'SERVER_PASSWORD', label: 'Server password', secret: true },
			{ key: 'ADMIN_PASSWORD', label: 'Admin password', required: true, secret: true },
			{
				key: 'COMMUNITY',
				label: 'List in community servers',
				options: ['false', 'true'],
				default: 'false'
			}
		],
		volumes: [{ container: '/palworld' }],
		memoryMb: 16384,
		docsUrl: 'https://palworld-server-docker.loef.dev/'
	},
	{
		slug: 'satisfactory',
		name: 'Satisfactory',
		description: 'Factory building in 3D. The server is claimed in-game by the first player.',
		image: 'wolveix/satisfactory-server:latest',
		ports: [
			{ container: 7777, protocol: 'udp', label: 'Game' },
			{ container: 7777, protocol: 'tcp', label: 'API' },
			{ container: 8888, protocol: 'tcp', label: 'Reliable messaging' }
		],
		env: [{ key: 'MAXPLAYERS', label: 'Max players', default: '4' }],
		volumes: [{ container: '/config' }],
		memoryMb: 8192,
		query: { type: 'satisfactory', port: 0 },
		docsUrl: 'https://github.com/wolveix/satisfactory-server'
	},
	{
		slug: 'rust',
		name: 'Rust',
		description: 'Survival game. Downloads the server on every start.',
		image: 'didstopia/rust-server:latest',
		ports: [
			{ container: 28015, protocol: 'udp', label: 'Game' },
			{ container: 28016, protocol: 'tcp', label: 'RCON' }
		],
		env: [
			{ key: 'RUST_SERVER_NAME', label: 'Server name', default: 'PocketDimension Rust' },
			{ key: 'RUST_SERVER_MAXPLAYERS', label: 'Max players', default: '50' },
			{ key: 'RUST_SERVER_WORLDSIZE', label: 'World size', default: '3500' },
			{ key: 'RUST_SERVER_SEED', label: 'Map seed', default: '12345' },
			{ key: 'RUST_RCON_PASSWORD', label: 'RCON password', required: true, secret: true }
		],
		volumes: [{ container: '/steamcmd/rust' }],
		memoryMb: 12288,
		query: { type: 'rust', port: 0 },
		docsUrl: 'https://github.com/Didstopia/rust-server'
	},
	{
		slug: 'core-keeper',
		name: 'Core Keeper',
		description:
			'Mining sandbox. Players join with the Game ID from the server log; no ports need to be opened.',
		image: 'escaping/core-keeper-dedicated:latest',
		ports: [],
		env: [
			{ key: 'WORLD_NAME', label: 'World name', default: 'Core Keeper Server' },
			{ key: 'MAX_PLAYERS', label: 'Max players', default: '8' },
			{
				key: 'GAME_ID',
				label: 'Game ID (15-28 letters and digits, empty = generate)',
				secret: true
			}
		],
		volumes: [
			{ container: '/home/steam/core-keeper-data' },
			{ container: '/home/steam/core-keeper-dedicated' }
		],
		memoryMb: 4096,
		docsUrl: 'https://github.com/escapingnetwork/core-keeper-dedicated'
	},
	{
		slug: 'project-zomboid',
		name: 'Project Zomboid',
		description: 'Zombie survival.',
		image: 'renegademaster/zomboid-dedicated-server:latest',
		ports: [
			{ container: 16261, protocol: 'udp', label: 'Game' },
			{ container: 16262, protocol: 'udp', label: 'Direct' }
		],
		env: [
			{ key: 'SERVER_NAME', label: 'Server name', default: 'PocketDimension' },
			{
				key: 'ADMIN_PASSWORD',
				label: 'Admin password (letters and digits)',
				required: true,
				secret: true
			},
			{ key: 'SERVER_PASSWORD', label: 'Server password', secret: true },
			{ key: 'MAX_PLAYERS', label: 'Max players', default: '16' },
			{ key: 'MAX_RAM', label: 'Java memory', default: '4096m' }
		],
		volumes: [
			{ container: '/home/steam/Zomboid' },
			{ container: '/home/steam/ZomboidDedicatedServer' }
		],
		memoryMb: 6144,
		query: { type: 'projectzomboid', port: 0 },
		docsUrl: 'https://github.com/Renegade-Master/zomboid-dedicated-server'
	}
];
