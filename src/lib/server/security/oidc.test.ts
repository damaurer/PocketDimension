import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Role } from '#lib/types.ts';
import { localizeServerMessage } from '#lib/i18n/messages.ts';

process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), 'pd-oidc-')), 'test.db');
process.env.SECRET_JWT_KEY = 'test-secret-that-is-long-enough-for-hs256-signing';

const { claimAt, readProfile, signIn, SSO_ERRORS } = await import('./oidc.ts');
const { connectDatabaseClient } = await import('#lib/server/database/client.ts');
const { UserRepository } = await import('#lib/server/database/repository/user.repository.ts');

const ISSUER = 'https://sso.example.com/realms/games';
const MAPPING = { rolesClaim: 'realm_access.roles', adminRole: 'pd-admin' };

describe('claimAt', () => {
	it('reads plain and nested claims', () => {
		expect(claimAt({ groups: ['a'] }, 'groups')).toEqual(['a']);
		expect(claimAt({ realm_access: { roles: ['x'] } }, 'realm_access.roles')).toEqual(['x']);
		expect(claimAt({ 'https://example.com/roles': ['y'] }, 'https://example.com/roles')).toEqual([
			'y'
		]);
		expect(claimAt({ a: 1 }, 'a.b')).toBeUndefined();
	});
});

describe('readProfile', () => {
	it('reads email, name and admin role', () => {
		const profile = readProfile(
			ISSUER,
			{
				sub: 'abc',
				email: ' Alice@Example.com ',
				email_verified: true,
				preferred_username: 'alice',
				realm_access: { roles: ['pd-admin', 'offline_access'] }
			},
			MAPPING
		);
		expect(profile).toEqual({
			issuer: ISSUER,
			subject: 'abc',
			email: 'alice@example.com',
			emailVerified: true,
			name: 'alice',
			isAdmin: true
		});
	});

	it('skips names the app does not accept and leaves roles alone without mapping', () => {
		const profile = readProfile(
			ISSUER,
			{ sub: 'abc', email: 'not-an-email', preferred_username: 'a@b', name: 'Alice' },
			{ rolesClaim: 'roles', adminRole: '' }
		);
		expect(profile.email).toBeUndefined();
		expect(profile.emailVerified).toBe(false);
		expect(profile.name).toBe('Alice');
		expect(profile.isAdmin).toBeUndefined();
	});

	it('accepts a space separated roles string', () => {
		const profile = readProfile(
			ISSUER,
			{ sub: 'x', groups: 'users pd-admin' },
			{
				rolesClaim: 'groups',
				adminRole: 'pd-admin'
			}
		);
		expect(profile.isAdmin).toBe(true);
	});
});

describe('signIn', () => {
	let users: InstanceType<typeof UserRepository>;
	let count = 0;

	beforeEach(async () => {
		users = new UserRepository(await connectDatabaseClient());
		count++;
	});

	function profile(overrides: Partial<ReturnType<typeof readProfile>> = {}) {
		return {
			issuer: ISSUER,
			subject: `sub-${count}`,
			email: `user${count}@example.com`,
			emailVerified: false,
			name: `user${count}`,
			isAdmin: undefined,
			...overrides
		};
	}

	it('creates a passwordless user on the first login and finds it again', async () => {
		const first = await signIn(users, profile());
		expect(first.password).toBe('');
		expect(first.roles).toEqual([Role.USER_ROLE]);
		expect(await users.hasIdentity(first.id)).toBe(true);

		const again = await signIn(users, profile({ email: 'changed@example.com' }));
		expect(again.id).toBe(first.id);
	});

	it('links an existing account only by a verified email', async () => {
		const local = await users.create(
			{ name: 'local', email: `user${count}@example.com`, passwordHash: 'hash' },
			[Role.USER_ROLE]
		);
		await expect(signIn(users, profile())).rejects.toMatchObject({ code: 'email-taken' });

		const linked = await signIn(users, profile({ emailVerified: true }));
		expect(linked.id).toBe(local.id);
		expect(linked.password).toBe('hash');
	});

	it('refuses unknown users when accounts are not created automatically', async () => {
		await expect(signIn(users, profile(), false)).rejects.toMatchObject({ code: 'not-allowed' });
	});

	it('needs an email for a new account', async () => {
		await expect(signIn(users, profile({ email: undefined }))).rejects.toMatchObject({
			code: 'no-email'
		});
	});

	it('follows the provider for the administrator role', async () => {
		const admin = await signIn(users, profile({ isAdmin: true }));
		expect(admin.roles).toContain(Role.ADMINISTRATOR_ROLE);

		const demoted = await signIn(users, profile({ isAdmin: false }));
		expect(demoted.roles).toEqual([Role.USER_ROLE]);

		// Without role mapping, roles set in the app stay.
		await users.setRoles(admin.id, [Role.ADMINISTRATOR_ROLE, Role.USER_ROLE]);
		const kept = await signIn(users, profile());
		expect(kept.roles).toContain(Role.ADMINISTRATOR_ROLE);
	});
});

describe('SSO_ERRORS', () => {
	it('are translated into every language', () => {
		for (const message of Object.values(SSO_ERRORS)) {
			for (const locale of ['de', 'es', 'tl'] as const) {
				expect(localizeServerMessage(locale, message)).not.toBe(message);
			}
		}
	});
});
