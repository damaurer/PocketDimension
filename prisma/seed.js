import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	const { DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_SHOW_ADMIN_PASSWORD } = process.env;

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
				password: await bcrypt.hash(DB_ADMIN_PASSWORD, 10)
			}
		});

		if (DB_SHOW_ADMIN_PASSWORD) {
			console.log({ admin: {...admin, password: DB_ADMIN_PASSWORD} });
		}else {
			console.log({admin})
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

