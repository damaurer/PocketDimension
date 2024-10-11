import Database from 'better-sqlite3';
import * as fs from 'fs';
import { findUsersWhereRoleIn } from '$lib/server/database/repository/user';
import { Role, User } from '$lib/types';
import { registerUser } from '$lib/server/services/user-service';


export const database: Database = new Database('shared/PocketDimension/PocketDimension.db', {
	verbose: (message, additionalArgs) => {
		if (process.env.NODE_ENV === 'development') {
			console.log(message, additionalArgs);
		}
	}
});


const SCHEMA = fs.readFileSync('src/lib/server/database/migration/initial.sql', 'utf8');
database.exec(SCHEMA);


export function checkForAdminAccess() {
	console.log('Check for Admin Users');
	const users = findUsersWhereRoleIn([Role.ADMINISTRATOR_ROLE]);

	if ((!users || (users as User[]).length === 0)) {
		console.warn('No Admin User found!');
		console.log('Try to create Admin User');
		const { DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_SHOW_ADMIN_PASSWORD } = process.env;

		const admin = registerUser(DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_ADMIN_USER, true);

		if (DB_SHOW_ADMIN_PASSWORD) {
			console.log('New Admin User (please change the password)', { admin: { ...admin, password: DB_ADMIN_PASSWORD } });
		} else {
			console.log('New Admin User', { admin });
		}
	}
}