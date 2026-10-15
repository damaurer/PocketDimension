export type Role = 'ADMINISTRATOR_ROLE' | 'USER_ROLE';

export const Role = {
	ADMINISTRATOR_ROLE: 'ADMINISTRATOR_ROLE' as Role,
	USER_ROLE: 'USER_ROLE' as Role
};

/** A user as it may be sent to the browser: never contains the password hash. */
export interface User {
	id: number;
	email: string;
	name: string | null;
	createdAt?: string;
	updatedAt?: string;
	roles: Role[];
}

export type ContainerStatus = 'START' | 'STOP' | 'RESTART';

export const ContainerStatus = {
	START: 'START' as ContainerStatus,
	STOP: 'STOP' as ContainerStatus,
	RESTART: 'RESTART' as ContainerStatus
};
