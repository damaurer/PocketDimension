export type Protocol = 'tcp' | 'udp';

export interface TemplatePort {
	/** Port inside the container. */
	container: number;
	protocol: Protocol;
	/** What the port is for, shown to players (e.g. "Game", "Query"). */
	label?: string;
}

export interface TemplateEnv {
	/** Environment variable name. */
	key: string;
	/** Label shown in the create form. */
	label: string;
	default?: string;
	/** The user has to provide a value. */
	required?: boolean;
	/** Rendered as a password field and never shown again after creation. */
	secret?: boolean;
	/** Allowed values; rendered as a select. */
	options?: string[];
	/** Shown below the field. */
	help?: string;
}

export interface TemplateVolume {
	/** Absolute path inside the container that holds game data. */
	container: string;
}

/** How live status is read from the server (used by the live status view). */
export interface TemplateQuery {
	/** GameDig game id, e.g. "minecraft". */
	type: string;
	/** Index into `ports` of the port that answers queries. */
	port: number;
}

export interface GameTemplateInput {
	slug: string;
	name: string;
	description: string;
	image: string;
	ports: TemplatePort[];
	env: TemplateEnv[];
	volumes: TemplateVolume[];
	memoryMb?: number | null;
	query?: TemplateQuery | null;
	docsUrl?: string | null;
}

export interface GameTemplate extends GameTemplateInput {
	id: number;
	/** Comes from the shared game catalog and is updated from there. */
	builtin: boolean;
	/** Catalog version the template was last updated to; null for own templates. */
	catalogVersion: number | null;
	enabled: boolean;
}

export type ServerStatus = 'pending' | 'pulling' | 'creating' | 'ready' | 'error';

export interface GameServerView {
	id: number;
	name: string;
	ownerId: number;
	ownerName: string | null;
	template: { id: number; slug: string; name: string };
	status: ServerStatus;
	statusMessage: string | null;
	/** Docker state when the container exists: running, exited, ... */
	state: string | null;
	ports: { host: number; protocol: Protocol; label?: string }[];
	createdAt: string;
}

/** What the game server itself reports (via GameDig). */
export interface ServerQueryInfo {
	name: string;
	map: string;
	version: string;
	players: number;
	maxPlayers: number;
	/** Names of connected players, when the game reports them. */
	playerNames: string[];
	passwordProtected: boolean;
	/** Round trip time of the query in milliseconds. */
	ping: number;
}

/** Resource usage of the server's container. */
export interface ServerResources {
	cpuPercent: number;
	memoryBytes: number;
	/** Memory limit of the container, null when unlimited. */
	memoryLimitBytes: number | null;
}

export interface ServerLiveStatus {
	/**
	 * ok: the game answered. unreachable: it did not answer (yet), e.g. while
	 * it is still starting. unsupported: the game has no query protocol.
	 */
	queryState: 'ok' | 'unreachable' | 'unsupported';
	query: ServerQueryInfo | null;
	resources: ServerResources | null;
	/** When the container was last started (ISO time). */
	startedAt: string | null;
}
