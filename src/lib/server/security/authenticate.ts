import * as jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY } from "$env/static/private";
import type { Cookies } from "@sveltejs/kit";
import type { User } from '@prisma/client';

export function authenticate(cookies: Cookies): jwt.JwtPayload |  string | undefined {
	const token = cookies.get("auth-token");
	if (!token) return undefined;
	try {
		const auth = jwt.verify(token, SECRET_JWT_KEY);
		if (!auth) return undefined;
		return auth;
	} catch {
		return undefined;
	}
}


export function createToken(user: User) {
	return jwt.sign({ email: user.email }, SECRET_JWT_KEY);
}