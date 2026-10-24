import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

import { seedCategories } from './category.seed.js';
import { seedProducts } from './product.seed.js';
import { seedUsers } from './user.seed.js';
import { seedOrders } from './orders.seed.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedUsers(prisma);
  await seedCategories(prisma);
  await seedProducts(prisma);
  await seedOrders(prisma);

  console.log('All seeds completed');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
