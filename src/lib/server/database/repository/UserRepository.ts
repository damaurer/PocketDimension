import type { User } from '$lib/types';
import database from '$lib/server/database/database';

const SELECT_USER_WITH_ROLE = `SELECT User.email, User.password, User.name, GROUP_CONCAT(V_User_Role.roleName) AS role
FROM User
INNER JOIN V_User_Role ON User.email = V_User_Role.userEmail
WHERE User.email = ? 
GROUP BY User.email;`

const INSERT_USER = `INSERT INTO User (name, email, password) VALUES (@name, @email, @password)`

const INSERT_V_USER_ROLE = `INSERT INTO V_USER_ROLE (roleName, userEmail) VALUES (@roleName, @userEmail)`


export function findAllAdminUser(): User[] {
	return <User[]>database.prepare('Select email, password, name, createdAt, updatedAt from User').get();
}


export function insertUser(user: User): User {
	console.log(INSERT_USER, INSERT_V_USER_ROLE, SELECT_USER_WITH_ROLE, database)
	const userInsert = database.prepare(INSERT_USER);
	const vUserRoleInsert = database.prepare(INSERT_V_USER_ROLE)
	const selectUser = database.prepare(SELECT_USER_WITH_ROLE)

	const transaction = database.transaction((user: User) => {
		userInsert.run(user);
		for(const role of user.roles) {
			vUserRoleInsert.run({ roleName: role, userEmail: user.email });
		}
	});

	transaction(user);

	return <User>selectUser.get(user.email);

}