import  Database  from 'better-sqlite3';
import * as fs from 'fs';
import { findAllAdminUser, insertUser } from '$lib/server/database/repository/UserRepository';
import type { User } from '$lib/types';
import { RoleEnum } from '$lib/types';
import { registerUser } from '$lib/server/services/user-service';



const database = new Database('db/PocketDimension.db');

const SCHEMA = fs.readFileSync('src/lib/server/database/migration/initial.sql', 'utf8')


async function setup() {
	const { DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_SHOW_ADMIN_PASSWORD } = process.env;

	database.exec(SCHEMA)

	const users: User[] = findAllAdminUser()

	if((!users || users.length === 0) && DB_ADMIN_USER && DB_ADMIN_EMAIL && DB_ADMIN_PASSWORD) {
		const admin = registerUser({
			email: DB_ADMIN_EMAIL,
			password: DB_ADMIN_PASSWORD,
			name: DB_ADMIN_USER,
			roles: [
				RoleEnum.Name.ADMINISTRATOR_ROLE,
				RoleEnum.Name.USER_ROLE
			]
		})

		if (DB_SHOW_ADMIN_PASSWORD) {
			console.log({ admin: { ...admin, password: DB_ADMIN_PASSWORD } });
		} else {
			console.log({ admin });
		}
	}
}

setup().then(() => {
	console.log('DB Setup done');
}).catch(e => {
	console.error(e);
});


export default database;