import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	const { DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_SHOW_ADMIN_PASSWORD } = process.env;

	const roles = [];

	roles.push(await prisma.role.upsert({
		create: {
			name: 'ADMINISTRATOR_ROLE'
		},
		update: {
			name: 'ADMINISTRATOR_ROLE'
		},
		where: {
			name: 'ADMINISTRATOR_ROLE'
		}
	}));
	roles.push(await prisma.role.upsert({
		create: {
			name: 'USER_ROLE'
		},
		update: {
			name: 'USER_ROLE'
		},
		where: {
			name: 'USER_ROLE'
		}
	}));


	const user = await prisma.user.findUnique({
		where: {
			email: DB_ADMIN_EMAIL
		}
	});

	if (!user) {
		const admin = await prisma.user.create({
			data: {
				name: DB_ADMIN_USER,
				email: DB_ADMIN_EMAIL,
				password: await bcrypt.hash(DB_ADMIN_PASSWORD, 10),
				roles: {
					create: roles.map((r) => ({
						role: {
							connect: {
								name: r.name
							}
						}
					}))
				}
			}
		});

		if (DB_SHOW_ADMIN_PASSWORD) {
			console.log({ admin: { ...admin, password: DB_ADMIN_PASSWORD } });
		} else {
			console.log({ admin });
		}
	}

	if (process.env.NODE_ENV === 'development') {
		for(let i = 0; i < 20; i++) {
			await prisma.user.create({
				data: {
					name: `User${i}`,
					email: `user${i}@testuser.de`,
					password: await bcrypt.hash(`testuserUser${i}`, 10),
					roles: {
						create: [
							{
								role: {
									connect: {
										name: 'USER_ROLE'
									}
								}
							}
						]
					}
				}
			});
		}
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});

