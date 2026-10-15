import type { Database } from '#lib/server/database/client.ts';
import { Role, type User } from '#lib/types.ts';

/** Server-side user record, including the password hash. Never send this to the browser. */
export interface UserRecord extends User {
	password: string;
	sessionVersion: number;
}

interface UserRow extends Omit<UserRecord, 'roles'> {
	roles: string | null;
}

export interface UserChanges {
	name?: string;
	email?: string;
	passwordHash?: string;
}

const SELECT_USER = `
	SELECT User.id, User.name, User.email, User.password, User.sessionVersion,
	       User.createdAt, User.updatedAt,
	       GROUP_CONCAT(V_User_Role.role_name) AS roles
	FROM User
	LEFT JOIN V_User_Role ON User.id = V_User_Role.user_id`;

function toRecord(row: UserRow): UserRecord {
	return {
		...row,
		roles: row.roles ? (row.roles.split(',') as Role[]) : []
	};
}

export function toPublicUser({ id, email, name, roles, createdAt, updatedAt }: UserRecord): User {
	return { id, email, name, roles, createdAt, updatedAt };
}

export class UserRepository {
	constructor(private db: Database) {}

	async findById(id: number): Promise<UserRecord | undefined> {
		const row = await this.db.get<UserRow>(`${SELECT_USER} WHERE User.id = ? GROUP BY User.id`, [
			id
		]);
		return row && toRecord(row);
	}

	async findByEmail(email: string): Promise<UserRecord | undefined> {
		const row = await this.db.get<UserRow>(`${SELECT_USER} WHERE User.email = ? GROUP BY User.id`, [
			email
		]);
		return row && toRecord(row);
	}

	async findByEmailOrName(value: string): Promise<UserRecord[]> {
		const rows = await this.db.all<UserRow>(
			`${SELECT_USER} WHERE User.email = ? OR User.name = ? GROUP BY User.id`,
			[value.toLowerCase(), value]
		);
		return rows.map(toRecord);
	}

	async findAllExcept(id: number): Promise<UserRecord[]> {
		const rows = await this.db.all<UserRow>(
			`${SELECT_USER} WHERE User.id != ? GROUP BY User.id ORDER BY User.id`,
			[id]
		);
		return rows.map(toRecord);
	}

	async create(
		{ name, email, passwordHash }: Required<UserChanges>,
		roles: Role[]
	): Promise<UserRecord> {
		const id = await this.db.transaction(async () => {
			const { lastID } = await this.db.run(
				'INSERT INTO User (name, email, password) VALUES (?, ?, ?)',
				[name, email, passwordHash]
			);
			await this.replaceRoles(lastID, roles);
			return lastID;
		});
		return (await this.findById(id))!;
	}

	/**
	 * Applies the given changes. A password change bumps the session version,
	 * which signs out every existing session of that user.
	 */
	async update(id: number, changes: UserChanges, roles?: Role[]): Promise<UserRecord | undefined> {
		await this.db.transaction(async () => {
			const assignments: string[] = [];
			const params: (string | number)[] = [];

			if (changes.name !== undefined) {
				assignments.push('name = ?');
				params.push(changes.name);
			}
			if (changes.email !== undefined) {
				assignments.push('email = ?');
				params.push(changes.email);
			}
			if (changes.passwordHash !== undefined) {
				assignments.push('password = ?', 'sessionVersion = sessionVersion + 1');
				params.push(changes.passwordHash);
			}

			if (assignments.length > 0) {
				assignments.push('updatedAt = CURRENT_TIMESTAMP');
				await this.db.run(`UPDATE User SET ${assignments.join(', ')} WHERE id = ?`, [
					...params,
					id
				]);
			}

			if (roles) {
				await this.replaceRoles(id, roles);
			}
		});

		return this.findById(id);
	}

	private async replaceRoles(id: number, roles: Role[]) {
		await this.db.run('DELETE FROM V_User_Role WHERE user_id = ?', [id]);
		for (const role of new Set(roles)) {
			await this.db.run('INSERT INTO V_User_Role (role_name, user_id) VALUES (?, ?)', [role, id]);
		}
	}
}

/** Creates the initial administrator from the DB_ADMIN_* variables if it does not exist yet. */
export async function ensureAdminUser(
	repository: UserRepository,
	admin: { name?: string; email?: string; password?: string },
	hashPassword: (password: string) => Promise<string>
) {
	if (!admin.email || !admin.password) return;
	if (await repository.findByEmail(admin.email)) return;

	await repository.create(
		{
			name: admin.name || 'admin',
			email: admin.email,
			passwordHash: await hashPassword(admin.password)
		},
		[Role.ADMINISTRATOR_ROLE, Role.USER_ROLE]
	);
	console.log(`Admin user created: ${admin.email}`);
}
