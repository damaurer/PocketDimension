import type { ActionFailure } from '@sveltejs/kit';

export interface User {
	id: number,
	email: string,
	password: string,
	name?: string,
	createdAt?: Date,
	updatedAt?: Date,
	roles: Role[]
}
export interface V_User_Role {
	role_name: string,
	user_id: string
}

export type Role = 'ADMINISTRATOR_ROLE' | 'USER_ROLE';

export const Role = {
	ADMINISTRATOR_ROLE: 'ADMINISTRATOR_ROLE' as Role,
	USER_ROLE: 'USER_ROLE' as Role
};


export type Failure = ActionFailure<{ message: string }>