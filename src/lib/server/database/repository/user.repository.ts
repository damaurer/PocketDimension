import type { Database, RunResult } from 'sqlite3';
import type { User } from '$lib/types';
import type {
	InsertQueryParams,
	QueryWhere,
	Repository,
	UpdateQueryParams
} from '$lib/server/database/types';
import { SELECT_USER_GROUP_BY, SELECT_USER_ROLE } from '$lib/server/database/constante';
import { Role } from '$lib/types';
import type { VUserRoleRepository } from '$lib/server/database/repository/vUserRole.repository';
import { hashPassword } from '$lib/server/security/authentication';


export class UserRepository implements Repository<User> {


	constructor(private database: Database, private vUserRoleRepository: VUserRoleRepository) {

	}

	private query(where?: string) {
		return `${SELECT_USER_ROLE} ${where ? `WHERE ${where}` : ''} ${SELECT_USER_GROUP_BY}`;
	}

	async findAll({ value, params }: QueryWhere): Promise<User[]> {
		return new Promise<User[]>((resolve, reject) => {
			this.database.all(this.query(value), params, (err: Error | null, rows: User[]) => {
				if (err) {
					reject(err);
					return;
				}

				rows.forEach(row => {
					if(row.roles) {
						row.roles = (row.roles as string).split(",") as Role[]
					}else {
						row.roles = []
					}
				})

				resolve(rows);
			});
		});
	}

	async findBy({ value, params }: QueryWhere): Promise<User> {
		return new Promise<User>((resolve, reject) => {
			this.database.get(this.query(value), params, (err: Error | null, row: User) => {
				if (err) {
					reject(err);
					return;
				}
				if(row.roles) {
					row.roles = (row.roles as string).split(",") as Role[]
				}else {
					row.roles = []
				}

				resolve(row);
			});
		});
	}

	async insertWithRole({ where, values }: InsertQueryParams, roles: Role[]): Promise<User> {
		return this.insert({ where, values }).then(user => {
			roles.forEach(role =>
				this.vUserRoleRepository.insert({
					values: {
						$role_name: role,
						$user_id: user.id
					}
				})
			);
			user.roles = roles;

			return user;
		});
	}


	async insert({ where, values }: InsertQueryParams): Promise<User> {
		try {
			const insertPromise = await new Promise((resolve, reject) => {
				const query = `INSERT into User (${Object.keys(values).map(key => key.slice(1)).join(',')})
                       VALUES (${Object.keys(values).map(key => key).join(',')})`;

				this.database.run(query, values, (runResult: RunResult, err: Error | null) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(true);
				});
			});

			if (insertPromise && where) {
				return this.findBy(where);
			}
			return new Promise(resolve => resolve(undefined));
		} catch (err) {
			console.error(err);
		}
	}

	async updateWithRole({ where, values }: UpdateQueryParams, roles: Role[]): Promise<User> {
		return this.update({ where, values }).then(async user => {
			const rolesToRemove = user.roles.filter(role => !roles.includes(role))
			if (rolesToRemove.length > 0) {
				await new Promise.all(rolesToRemove.map(role => this.vUserRoleRepository.delete({
					value: "role_name = $role_name and user_id = $user_id",
					params: {
						$role_name: role,
						$user_id: user.id
					}
				})))
			}
			const rolesToAdd = roles.filter(role => !user.roles.includes(role))
			if(rolesToAdd.length > 0) {
				await new Promise.all(rolesToAdd.map(role => this.vUserRoleRepository.insert({
					values: {
						$role_name: role,
						$user_id: user.id
					}
				})))
			}

			user.roles = roles

			return user
		});
	}

	async update({ where, values }: UpdateQueryParams): Promise<User> {
		try {
			const updatePromise = await new Promise((resolve, reject) => {
				const query = `
            UPDATE User
            set ${Object.keys(values).map(key => `${key.slice(1)} = ${key}`).join(',')}
                    ${where.value}
				`;

				this.database.run(query, where.params, values, (runResult: RunResult, err: Error | null) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(true);
				});
			});

			if (updatePromise && where) {
				return this.findBy(where);
			}
			return new Promise(resolve => resolve(undefined));
		} catch (err) {
			console.error(err);
		}
	}

	async delete({ values, params }: QueryWhere): Promise<void> {
		return new Promise((resolve, reject) => {
			const query = `DELETE from User where ${values}`

			this.database.run(query, params, (runResult: RunResult, err: Error | null) => {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		})
	}
}

let userRepository

export const initUserRepository = async (database: Database, vUserRoleRepository: VUserRoleRepository) => {
	if (userRepository) {
		return userRepository
	}
	userRepository = new UserRepository(database, vUserRoleRepository);


	const { DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD } = process.env;

	if (DB_ADMIN_EMAIL && DB_ADMIN_PASSWORD) {
		let user = await userRepository.findBy({
			value: 'email = $email',
			params: { $email: DB_ADMIN_EMAIL }
		});

		if (!user) {
			user = await userRepository.insertWithRole({
				values: {
					$email: DB_ADMIN_EMAIL,
					$password: await hashPassword(DB_ADMIN_PASSWORD),
					$name: DB_ADMIN_USER
				},
				where: {
					value: 'email = $email',
					params: {
						$email: DB_ADMIN_EMAIL
					}
				}
			}, [Role.ADMINISTRATOR_ROLE, Role.USER_ROLE]);

			console.log("Admin User created: ", {...user, password: "***********"})
		}
	}

	return userRepository;
}