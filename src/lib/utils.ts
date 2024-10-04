import type { User, V_User_Role } from '@prisma/client';

export const email_regexp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const one_day = 60 * 60 * 24;

export const cookie_options = {
	httpOnly: true,
	secure: true,
	path: "/",
	maxAge: one_day
} as const;


export class ROLE_ENUM {

	static ADMINISTRATOR_ROLE = 'ADMINISTRATOR_ROLE'
	static USER_ROLE = 'USER_ROLE'

	static getRoles(): string[] {
      return Object.values(ROLE_ENUM);
  }

	static getRoleForName(name: string): string[] {
		return Object.values(ROLE_ENUM).find(role => role === name);
	}

	static isValidRole(role: string): boolean {
      return Object.values(ROLE_ENUM).includes(role);
  }

	static isAdmin(user: User): boolean {
		return !!user.roles.find((r: V_User_Role) => r.roleName === ROLE_ENUM.ADMINISTRATOR_ROLE);
	}
}