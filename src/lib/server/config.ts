import { randomBytes } from 'node:crypto';

const MIN_SECRET_LENGTH = 32;

const isProduction = process.env.NODE_ENV === 'production';

function resolveJwtSecret(): string {
	const secret = process.env.SECRET_JWT_KEY;
	if (secret && secret.length >= MIN_SECRET_LENGTH) {
		return secret;
	}

	if (isProduction) {
		throw new Error(
			`SECRET_JWT_KEY must be set to a random value of at least ${MIN_SECRET_LENGTH} characters.`
		);
	}

	console.warn(
		'SECRET_JWT_KEY is missing or too short. Using a random key for this process; sessions end on restart.'
	);
	return randomBytes(48).toString('base64url');
}

let jwtSecret: string | undefined;

export const config = {
	get jwtSecret(): string {
		jwtSecret ??= resolveJwtSecret();
		return jwtSecret;
	},
	sessionMaxAgeSeconds: Number(process.env.SESSION_MAX_AGE_SECONDS) || 60 * 60 * 24,
	databasePath: process.env.DB_PATH || 'shared/pocketdimension.db',
	schemaPath: process.env.DB_SCHEMA_PATH || 'database/initial.sql',
	games: {
		/** Servers a user without admin role may own. */
		maxServersPerUser: Number(process.env.MAX_SERVERS_PER_USER ?? 2),
		/** Host ports of a new server are the game's default ports shifted by a multiple of this. */
		portOffsetStep: Number(process.env.PORT_OFFSET_STEP) || 10,
		/** Host interface game ports are published on; empty = all interfaces. */
		portBindIp: process.env.PORT_BIND_IP || '',
		/** Applies each game's memory limit to its container. */
		enforceMemoryLimits: process.env.ENFORCE_MEMORY_LIMITS !== 'false',
		/** Address shown to players; defaults to the host name the app is opened with. */
		publicHost: process.env.PUBLIC_HOST || '',
		/**
		 * Address the app reaches published game ports on for live status, used
		 * when a server cannot be reached directly in the PocketDimension network.
		 */
		queryHost:
			process.env.QUERY_HOST ||
			(process.env.PORT_BIND_IP && process.env.PORT_BIND_IP !== '0.0.0.0'
				? process.env.PORT_BIND_IP
				: '127.0.0.1')
	},
	admin: {
		name: process.env.DB_ADMIN_USER,
		email: process.env.DB_ADMIN_EMAIL?.toLowerCase().trim(),
		password: process.env.DB_ADMIN_PASSWORD
	}
};
