import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
		transactionOptions: {
			isolationLevel: Prisma.TransactionIsolationLevel.Serializable
		}
	}
);

export default prisma;