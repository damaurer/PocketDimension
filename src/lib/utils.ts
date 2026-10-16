import { Role } from '#lib/types.ts';

export const email_regexp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export const isAdmin = (roles: Role[]): boolean => roles.includes(Role.ADMINISTRATOR_ROLE);

export const isValid = (role: Role): boolean => Object.values(Role).includes(role);
