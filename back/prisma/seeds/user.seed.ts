import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
    12,
  );

  await prisma.user.upsert({
    where: {
      email: 'admin@mmstore.local',
    },
    update: {
      name: 'MM Store Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@mmstore.local',
      name: 'MM Store Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user seeded');
}
