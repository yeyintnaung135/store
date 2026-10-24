import bcrypt from 'bcrypt';
import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedUsers(prisma: PrismaClient) {
  // Admin user
  const adminPasswordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
    12,
  );

  await prisma.user.upsert({
    where: {
      email: 'admin@mmstore.local',
    },
    update: {
      name: 'MM Store Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@mmstore.local',
      name: 'MM Store Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Customer user
  const customerPasswordHash = await bcrypt.hash(
    process.env.SEED_CUSTOMER_PASSWORD ?? 'Customer123!',
    12,
  );

  await prisma.user.upsert({
    where: {
      email: 'customer@mmstore.local',
    },
    update: {
      name: 'MM Store Customer',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
    },
    create: {
      email: 'customer@mmstore.local',
      name: 'MM Store Customer',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  console.log('Admin user seeded');
  console.log('Customer user seeded');
}
