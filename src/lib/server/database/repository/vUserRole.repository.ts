import type { Database, RunResult } from 'sqlite3';
import type {  V_User_Role } from '$lib/types';
import type {
	InsertQueryParams,
	QueryWhere,
	Repository,
	UpdateQueryParams
} from '$lib/server/database/types';

export class VUserRoleRepository implements Repository<V_User_Role>{

	constructor(private database: Database) {
	}

	private query(where?: string) {
		return `SELECT V_User_Role.role_name, V_User_Role.user_id ${where ? `WHERE ${where}` : ''}`;
	}

	async findAll({ value, params }: QueryWhere): Promise<V_User_Role[]> {
		return new Promise<V_User_Role[]>((resolve, reject) => {
			this.database.all(this.query(value), params, (err: Error | null, rows: V_User_Role[]) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(rows);
			});
		});
	}

	async findBy({ value, params }: QueryWhere): Promise<V_User_Role> {
		return new Promise<V_User_Role>((resolve, reject) => {
			this.database.get(this.query(value), params, (err: Error | null, row: V_User_Role) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(row);
			});
		});
	}

	async insert({  where, values }: InsertQueryParams): Promise<V_User_Role> {
		try {
			const insertPromise = await new Promise((resolve, reject) => {
				const query = `INSERT into V_User_Role (${Object.keys(values).map(key => key.slice(1)).join(',')})
                       VALUES (${Object.keys(values).map(key => key).join(',')})`;

				this.database.run(query, values,  (runResult: RunResult, err: Error | null) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(true);
				});
			});

			if (insertPromise && where) {
				return this.findBy( where );
			}
			return new Promise(resolve => resolve(undefined))
		} catch (err) {
			console.error(err);
		}
	}

	async update({ where, values }: UpdateQueryParams): Promise<V_User_Role> {
		try {
			const updatePromise = await new Promise((resolve, reject) => {
				const query = `
            UPDATE V_User_Role
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
				return this.findBy( where );
			}
			return new Promise(resolve => resolve(undefined))
		} catch (err) {
			console.error(err);
		}
	}

	async delete({values, params}: QueryWhere): Promise<void> {
		return new Promise((resolve, reject) => {
			const query = `DELETE from V_User_Role where ${values}`

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


let vUserRoleRepository

export const initVUserRoleRepository = (database: Database) => {
	if(vUserRoleRepository) {
		return vUserRoleRepository
	}
	vUserRoleRepository = new VUserRoleRepository(database);
  return vUserRoleRepository;
}