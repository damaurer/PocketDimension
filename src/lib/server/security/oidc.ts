import * as client from 'openid-client';
import jsonwebtoken from 'jsonwebtoken';
import type { Cookies } from '@sveltejs/kit';
import { config } from '#lib/server/config.ts';
import { validEmail, verify_name } from '#lib/server/security/validation.ts';
import type {
	UserRecord,
	UserRepository
} from '#lib/server/database/repository/user.repository.ts';
import { Role } from '#lib/types.ts';

export const CALLBACK_PATH = '/auth/oidc/callback';
const FLOW_COOKIE = 'oidc-flow';
/** Kept so that logout can end the session at the provider without asking again. */
const ID_TOKEN_COOKIE = 'oidc-id-token';
const FLOW_MAX_AGE_SECONDS = 10 * 60;
const FLOW_AUDIENCE = 'pocketdimension-oidc-flow';

/** Reasons a single sign-on can fail, as shown on the login page. */
export const SSO_ERRORS = {
	failed: 'Single sign-on failed. Please try again.',
	'no-email': 'Your single sign-on account has no email address.',
	'email-taken':
		'An account with this email already exists. Verify your email at the sign-on provider or ask your administrator.',
	'not-allowed': 'There is no account for you here. Ask your administrator.',
	'too-many': 'Too many login attempts. Try again later.'
} as const;

export type SsoError = keyof typeof SSO_ERRORS;

export class SsoLoginError extends Error {
	constructor(readonly code: SsoError) {
		super(SSO_ERRORS[code]);
	}
}

let provider: Promise<client.Configuration> | undefined;

/** Discovers the provider once; a failed discovery is retried on the next login. */
export function getProvider(): Promise<client.Configuration> {
	const { issuer, clientId, clientSecret } = config.oidc;
	provider ??= client.discovery(
		new URL(issuer),
		clientId,
		clientSecret || undefined,
		clientSecret ? client.ClientSecretPost(clientSecret) : client.None(),
		// Plain http is only for trying it out with a local provider.
		{ execute: new URL(issuer).protocol === 'http:' ? [client.allowInsecureRequests] : [] }
	);
	provider.then(
		(configuration) => {
			const endSession = configuration.serverMetadata().end_session_endpoint;
			endSessionOrigin = endSession && new URL(endSession).origin;
		},
		(e) => {
			console.error('OIDC discovery failed:', e);
			provider = undefined;
		}
	);
	return provider;
}

let endSessionOrigin: string | undefined;

/** Origins a logout form may be redirected to, for the CSP form-action directive. */
export function providerOrigins(): string[] {
	if (!config.oidc.enabled) return [];
	const origins = new Set([new URL(config.oidc.issuer).origin]);
	if (endSessionOrigin) origins.add(endSessionOrigin);
	return [...origins];
}

function cookieOptions(url: URL, path: string, maxAge: number) {
	return {
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path,
		maxAge
	} as const;
}

interface Flow {
	state: string;
	nonce: string;
	verifier: string;
}

/** Remembers state, nonce and PKCE verifier in a signed cookie and returns the provider's login URL. */
export async function startLogin(cookies: Cookies, url: URL): Promise<URL> {
	const configuration = await getProvider();
	const flow: Flow = {
		state: client.randomState(),
		nonce: client.randomNonce(),
		verifier: client.randomPKCECodeVerifier()
	};

	const token = jsonwebtoken.sign(flow, config.jwtSecret, {
		algorithm: 'HS256',
		audience: FLOW_AUDIENCE,
		expiresIn: FLOW_MAX_AGE_SECONDS
	});
	cookies.set(FLOW_COOKIE, token, cookieOptions(url, CALLBACK_PATH, FLOW_MAX_AGE_SECONDS));

	return client.buildAuthorizationUrl(configuration, {
		redirect_uri: new URL(CALLBACK_PATH, url.origin).href,
		scope: config.oidc.scopes,
		state: flow.state,
		nonce: flow.nonce,
		code_challenge: await client.calculatePKCECodeChallenge(flow.verifier),
		code_challenge_method: 'S256'
	});
}

function readFlow(cookies: Cookies): Flow | undefined {
	try {
		const claims = jsonwebtoken.verify(cookies.get(FLOW_COOKIE) ?? '', config.jwtSecret, {
			algorithms: ['HS256'],
			audience: FLOW_AUDIENCE
		});
		if (
			typeof claims === 'object' &&
			typeof claims.state === 'string' &&
			typeof claims.nonce === 'string' &&
			typeof claims.verifier === 'string'
		) {
			return { state: claims.state, nonce: claims.nonce, verifier: claims.verifier };
		}
	} catch {
		// missing, expired or forged
	}
}

export interface SsoProfile {
	issuer: string;
	subject: string;
	email: string | undefined;
	emailVerified: boolean;
	name: string | null;
	/** undefined when roles are managed in the app */
	isAdmin: boolean | undefined;
}

/** Reads a claim; a dotted path such as `realm_access.roles` walks into nested objects. */
export function claimAt(claims: Record<string, unknown>, path: string): unknown {
	if (path in claims) return claims[path];
	let value: unknown = claims;
	for (const part of path.split('.')) {
		if (typeof value !== 'object' || value === null) return undefined;
		value = (value as Record<string, unknown>)[part];
	}
	return value;
}

export function readProfile(
	issuer: string,
	claims: Record<string, unknown>,
	options: { rolesClaim: string; adminRole: string } = config.oidc
): SsoProfile {
	const email = typeof claims.email === 'string' ? claims.email.toLowerCase().trim() : '';

	let name: string | null = null;
	for (const candidate of [claims.preferred_username, claims.name, claims.given_name]) {
		if (typeof candidate === 'string' && !verify_name(candidate.trim())) {
			name = candidate.trim();
			break;
		}
	}

	let isAdmin: boolean | undefined;
	if (options.adminRole) {
		const roles = claimAt(claims, options.rolesClaim);
		const list = Array.isArray(roles)
			? roles
			: typeof roles === 'string'
				? roles.split(/[\s,]+/)
				: [];
		isAdmin = list.includes(options.adminRole);
	}

	return {
		issuer,
		subject: String(claims.sub),
		email: validEmail(email) ? email : undefined,
		emailVerified: claims.email_verified === true,
		name,
		isAdmin
	};
}

/** Exchanges the code from the provider's redirect and returns who signed in. */
export async function finishLogin(
	cookies: Cookies,
	url: URL
): Promise<{ profile: SsoProfile; idToken: string | undefined }> {
	const flow = readFlow(cookies);
	cookies.delete(FLOW_COOKIE, { path: CALLBACK_PATH });
	if (!flow) throw new SsoLoginError('failed');

	const configuration = await getProvider();
	const tokens = await client.authorizationCodeGrant(configuration, url, {
		pkceCodeVerifier: flow.verifier,
		expectedState: flow.state,
		expectedNonce: flow.nonce,
		idTokenExpected: true
	});

	const idClaims = tokens.claims()!;
	let claims: Record<string, unknown> = { ...idClaims };
	if (configuration.serverMetadata().userinfo_endpoint) {
		const userInfo = await client.fetchUserInfo(configuration, tokens.access_token, idClaims.sub);
		claims = { ...claims, ...userInfo };
	}

	return {
		profile: readProfile(configuration.serverMetadata().issuer, claims),
		idToken: tokens.id_token
	};
}

function rolesFor(isAdmin: boolean): Role[] {
	return isAdmin ? [Role.ADMINISTRATOR_ROLE, Role.USER_ROLE] : [Role.USER_ROLE];
}

/**
 * Finds the user for a provider account. An unknown account is linked to the
 * local user with the same email if the provider verified that email, or gets
 * a new user. With role mapping, the administrator role follows the provider.
 */
export async function signIn(
	users: UserRepository,
	profile: SsoProfile,
	autoCreate: boolean = config.oidc.autoCreate
): Promise<UserRecord> {
	let user = await users.findByIdentity(profile.issuer, profile.subject);

	if (!user) {
		if (!profile.email) throw new SsoLoginError('no-email');

		const existing = await users.findByEmail(profile.email);
		if (existing) {
			if (!profile.emailVerified) throw new SsoLoginError('email-taken');
			await users.linkIdentity(existing.id, profile.issuer, profile.subject);
			user = existing;
		} else {
			if (!autoCreate) throw new SsoLoginError('not-allowed');
			return users.create(
				{ name: profile.name, email: profile.email, passwordHash: '' },
				rolesFor(profile.isAdmin ?? false),
				profile
			);
		}
	}

	if (
		profile.isAdmin !== undefined &&
		profile.isAdmin !== user.roles.includes(Role.ADMINISTRATOR_ROLE)
	) {
		await users.setRoles(user.id, rolesFor(profile.isAdmin));
		user = (await users.findById(user.id))!;
	}
	return user;
}

export function rememberIdToken(cookies: Cookies, url: URL, idToken: string | undefined) {
	if (!idToken) return;
	cookies.set(ID_TOKEN_COOKIE, idToken, cookieOptions(url, '/', config.sessionMaxAgeSeconds));
}

/** Where to send the browser to end the provider session too, if the user signed in through it. */
export async function logoutUrl(cookies: Cookies, url: URL): Promise<URL | undefined> {
	const idToken = cookies.get(ID_TOKEN_COOKIE);
	if (!idToken) return undefined;
	cookies.delete(ID_TOKEN_COOKIE, { path: '/' });
	if (!config.oidc.enabled) return undefined;

	try {
		const configuration = await getProvider();
		if (!configuration.serverMetadata().end_session_endpoint) return undefined;
		return client.buildEndSessionUrl(configuration, {
			id_token_hint: idToken,
			post_logout_redirect_uri: new URL('/', url.origin).href
		});
	} catch {
		return undefined;
	}
}
