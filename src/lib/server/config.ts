import { randomBytes } from 'node:crypto';

const MIN_SECRET_LENGTH = 32;

const DEFAULT_CATALOG_URL =
	'https://raw.githubusercontent.com/damaurer/PocketDimension/main/catalog/catalog.json';

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

const oidcIssuer = process.env.OIDC_ISSUER?.trim() || '';
const oidcClientId = process.env.OIDC_CLIENT_ID?.trim() || '';
const oidcEnabled = Boolean(oidcIssuer && oidcClientId);

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
	catalog: {
		/** Shared game catalog fetched read-only; empty = only the games shipped with the app. */
		url: process.env.CATALOG_URL ?? DEFAULT_CATALOG_URL,
		/** Hours between automatic catalog updates; 0 = only when an admin asks. */
		syncHours: Number(process.env.CATALOG_SYNC_HOURS ?? 24)
	},
	/** Login through an OpenID Connect provider such as Keycloak; off unless issuer and client id are set. */
	oidc: {
		enabled: oidcEnabled,
		issuer: oidcIssuer,
		clientId: oidcClientId,
		/** Empty for a public client, which then relies on PKCE alone. */
		clientSecret: process.env.OIDC_CLIENT_SECRET || '',
		/** Shown on the login button. */
		name: process.env.OIDC_NAME?.trim() || 'SSO',
		scopes: process.env.OIDC_SCOPES?.trim() || 'openid email profile',
		/** Creates an account on the first login; otherwise only linked accounts may sign in. */
		autoCreate: process.env.OIDC_AUTO_CREATE !== 'false',
		/** Claim holding the user's roles or groups; dots walk into nested objects. */
		rolesClaim: process.env.OIDC_ROLES_CLAIM?.trim() || 'roles',
		/** Value in the roles claim that makes a user administrator; empty = roles are managed in the app. */
		adminRole: process.env.OIDC_ADMIN_ROLE?.trim() || ''
	},
	/** Login with email/name and password. Can only be switched off when OIDC is configured. */
	localLogin: !oidcEnabled || process.env.LOCAL_LOGIN !== 'false',
	admin: {
		name: process.env.DB_ADMIN_USER,
		email: process.env.DB_ADMIN_EMAIL?.toLowerCase().trim(),
		password: process.env.DB_ADMIN_PASSWORD
	}
};
