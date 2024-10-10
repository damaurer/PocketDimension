
export interface User {
	email: string,
	password: string,
	name: string,
	createdAt?: Date,
	updatedAt?: Date,
	roles: RoleEnum.Name[]
}
export interface V_User_Role {
	roleName: string,
	userEmail: string
}

export namespace RoleEnum {
	export type Name = 'ADMINISTRATOR_ROLE' | 'USER_ROLE'
	export const Name = {
		ADMINISTRATOR_ROLE: 'ADMINISTRATOR_ROLE',
		USER_ROLE: 'USER_ROLE'
	}

	export const isAdmin = (role: Name): boolean => role === Name.ADMINISTRATOR_ROLE
	export const isValid = (role: Name): boolean => Object.values(Name).includes(role)
}
