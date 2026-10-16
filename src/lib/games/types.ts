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
	builtin: boolean;
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
