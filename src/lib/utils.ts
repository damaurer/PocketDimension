import { Role } from '$lib/types';

export const email_regexp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

const one_day = 60 * 60 * 24;

export const cookie_options = {
	httpOnly: true,
	secure: true,
	path: "/",
	maxAge: one_day
} as const;


export const isAdmin = (roles: Role[]): boolean => roles.includes(Role.ADMINISTRATOR_ROLE);

export const isValid = (role: Role): boolean => Object.values(Role).includes(role);