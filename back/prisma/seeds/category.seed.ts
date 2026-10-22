import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Home & Living', slug: 'home-living' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  console.log('Categories seeded');
}
