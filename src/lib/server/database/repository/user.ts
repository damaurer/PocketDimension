import type { User } from '$lib/types';
import { database } from '$lib/server/database/config';
import { Role } from '$lib/types';

const SELECT_USER_ROLE = `
    SELECT User.id,
           User.name,
           User.email,
           User.updatedAt,
           User.createdAt,
           GROUP_CONCAT(V_User_Role.role_name) AS role
    FROM User
             INNER JOIN V_User_Role ON User.email = V_User_Role.user_id`;

const SELECT_USER_GROUP_BY = 'GROUP BY User.id';


function SelectUser(where: string) {
	return `${SELECT_USER_ROLE} ${where} ${SELECT_USER_GROUP_BY}`;
}

export function findUserById(id: number): User {
	return database.prepare(SelectUser("WHERE User.id = ?")).get(id)
}

export function findAllUsersWhereEmailIsNot(email: string): User {
	return database.prepare(SelectUser('where email != ?')).all(email);
}

export function findUserWhereEmail(email: string): User {
	return database.prepare(SelectUser('where email = ?')).get(email);
}

export function findUsersWhereRoleIn(roles: Role[]): User[] {
	return database.prepare(SelectUser(`WHERE V_User_Role.role_name IN (?)`)).all(roles);
}

export function insertUser(	password: string,
														 roles: Role[],
														 email: string,
														 name?: string): User {
	const userInsert = database.prepare(`
      INSERT INTO User (name, email, password)
      VALUES (@name, @email, @password)
	`);

	const vUserRoleInsert = database.prepare(`
      INSERT INTO V_USER_ROLE (role_name, user_id)
      VALUES (@roleName, @userEmail)
	`);

	const transaction = database.transaction((user: User) => {
		userInsert.run(user);
		for (const role of user.roles) {
			vUserRoleInsert.run({ roleName: role, userEmail: user.email });
		}
	});

	transaction({password, email, roles, name});

	return database.prepare(SelectUser('WHERE User.email = ?')).get(email);
}

export function updateUser(user: User): User {
	const userUpdate = database.prepare(`
      UPDATE User
      set name     = @name,
          password = @password,
          email    = @email
      where id = @id
	`);

	const vUserRoleInsert = database.prepare(`
      INSERT INTO V_USER_ROLE (role_name, user_id)
      VALUES (@roleName, @userEmail)
	`);


	const transaction = database.transaction((user: User) => {
		userUpdate.run(user);
		for (const role of user.roles) {
			vUserRoleInsert.run({ roleName: role, userEmail: user.email });
		}
	});

	transaction(user);

	return findUserById(user.id);
}

export function findUserByEmailOrName(email_or_name: string): User[] {
	return database.prepare(
		SelectUser('WHERE User.email = @email or User.name = @name')
	).all({
		email: email_or_name.toLowerCase().trim(),
		name: email_or_name.trim()
	});
}

