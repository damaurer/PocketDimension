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
	admin: {
		name: process.env.DB_ADMIN_USER,
		email: process.env.DB_ADMIN_EMAIL?.toLowerCase().trim(),
		password: process.env.DB_ADMIN_PASSWORD
	}
};
