import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import { hashPassword } from '$lib/server/security/authentication';
import { Role } from '$lib/types';
import { VUserRoleRepository } from '$lib/server/database/repository/vUserRole.repository';
import { UserRepository } from '$lib/server/database/repository/user.repository';

const isDev = process.env.NODE_ENV === 'development';

const sqliteDb = isDev ? sqlite3.verbose() : sqlite3;


export const client = new sqliteDb.Database('shared/PocketDimension/PocketDimension.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

if (isDev) {
	client.on('trace', (sql: string) => console.log(sql));
	client.on('error', (err: string) => console.error(err));
}

export const vUserRoleRepository = new VUserRoleRepository(client)
export const userRepository = new UserRepository(client, vUserRoleRepository)




async function initDatabase() {

	const SCHEMA = fs.readFileSync('src/lib/server/database/migration/initial.sql', 'utf8');
	client.exec(SCHEMA);


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
		}
		if (isDev) {
			console.log(user);
		}
	}
}

await initDatabase()