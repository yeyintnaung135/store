import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { OrderStatus } from '../../src/generated/prisma/enums.js';

export async function seedOrders(prisma: PrismaClient) {
  console.log('Starting order seed...');

  const customer = await prisma.user.findUnique({
    where: {
      email: 'customer@mmstore.local',
    },
  });

  if (!customer) {
    console.error('Customer not found. Run user seed first.');
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    take: 3,
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (products.length === 0) {
    console.error(
      'No ACTIVE products found. Create or activate products first.',
    );
    return;
  }

  const existingCount = await prisma.order.count({
    where: {
      orderNumber: {
        startsWith: 'ORD-SEED-',
      },
    },
  });

  if (existingCount > 0) {
    console.log(`${existingCount} sample orders already exist. Skipping.`);
    return;
  }

  const statuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.SHIPPED,
  ];

  for (let i = 0; i < statuses.length; i++) {
    const selectedProducts = products.map((product, index) => {
      const quantity = index + 1;
      const subtotal = Number(product.price) * quantity;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity,
        subtotal: subtotal.toFixed(2),
      };
    });

    const total = selectedProducts.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    await prisma.order.create({
      data: {
        orderNumber: `ORD-SEED-${String(i + 1).padStart(4, '0')}`,
        userId: customer.id,
        status: statuses[i],
        total: total.toFixed(2),
        items: {
          create: selectedProducts,
        },
      },
    });

    console.log(`Created ORD-SEED-${String(i + 1).padStart(4, '0')}`);
  }

  console.log('Order seed completed successfully.');
}
