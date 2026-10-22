import type { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedProducts(prisma: PrismaClient) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: 'electronics' },
  });

  const products = [
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      price: '59.99',
      stock: 25,
    },
    {
      name: 'Mechanical Keyboard',
      slug: 'mechanical-keyboard',
      price: '89.99',
      stock: 15,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
        categoryId: category.id,
        status: 'ACTIVE',
      },
      create: {
        ...product,
        categoryId: category.id,
        status: 'ACTIVE',
      },
    });
  }

  console.log('Products seeded');
}
