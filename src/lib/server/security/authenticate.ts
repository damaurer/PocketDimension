import jsonwebtoken from 'jsonwebtoken';
import { SECRET_JWT_KEY } from "$env/static/private";
import type { Cookies } from "@sveltejs/kit";
import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';

export function authenticate(cookies: Cookies): jsonwebtoken.JwtPayload |  string | undefined {
	const token = cookies.get("auth-token");
	if (!token) return undefined;
	try {
		const auth = jsonwebtoken.verify(token, SECRET_JWT_KEY);
		if (!auth) return undefined;
		return auth;
	} catch {
		return undefined;
	}
}


export function createToken(user: User) {
	return jsonwebtoken.sign({ email: user.email }, SECRET_JWT_KEY);
}

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 10)
}