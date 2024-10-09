import jsonwebtoken from 'jsonwebtoken';
import type { Cookies } from "@sveltejs/kit";
import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';

export function authentication(cookies: Cookies): jsonwebtoken.JwtPayload |  string | undefined {
	const token = cookies.get("auth-token");
	const {SECRET_JWT_KEY} = process.env
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
	const {SECRET_JWT_KEY} = process.env
	return jsonwebtoken.sign({ email: user.email }, SECRET_JWT_KEY);
}

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 10)
}