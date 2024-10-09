import { Prisma, PrismaClient } from '@prisma/client';
import { ROLE_ENUM } from '$lib/utils';
import { registerUser } from '$lib/server/services/user-service';

const prisma =  new PrismaClient({
		transactionOptions: {
			isolationLevel: Prisma.TransactionIsolationLevel.Serializable
		}
	}
);

async function setup(){
	const {DB_ADMIN_USER, DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_SHOW_ADMIN_PASSWORD} = process.env

	const roles = [];

	roles.push(await prisma.role.upsert({
		create: {
			name: ROLE_ENUM.ADMINISTRATOR_ROLE
		},
		update: {
			name: ROLE_ENUM.ADMINISTRATOR_ROLE
		},
		where: {
			name: ROLE_ENUM.ADMINISTRATOR_ROLE
		}
	}));
	roles.push(await prisma.role.upsert({
		create: {
			name: ROLE_ENUM.USER_ROLE
		},
		update: {
			name: ROLE_ENUM.USER_ROLE
		},
		where: {
			name: ROLE_ENUM.USER_ROLE
		}
	}));

	const user = await prisma.user.findFirst({
		where: {
			roles: {
				every: {
					role: {
						name: ROLE_ENUM.ADMINISTRATOR_ROLE
					}
				}
			}
		}
	});

	if (!user && DB_ADMIN_USER && DB_ADMIN_EMAIL && DB_ADMIN_PASSWORD) {
		const admin = await registerUser(DB_ADMIN_EMAIL, DB_ADMIN_PASSWORD, DB_ADMIN_USER, ROLE_ENUM.ADMINISTRATOR_ROLE)

		if (DB_SHOW_ADMIN_PASSWORD) {
			console.log({ admin: { ...admin, password: DB_ADMIN_PASSWORD } });
		} else {
			console.log({ admin });
		}
	}
}

setup().then(() => {console.log("DB Setup done")}).catch(e => {console.error(e)});


export default prisma;