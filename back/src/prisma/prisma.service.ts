import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    assertTestDatabase(connectionString);
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

function assertTestDatabase(connectionString: string): void {
  if (process.env.NODE_ENV !== 'test') {
    return;
  }

  const database = decodeURIComponent(
    new URL(connectionString).pathname.replace(/^\//, ''),
  );
  if (database !== 'store_test') {
    throw new Error(
      `Tests must use the store_test database, got "${database}"`,
    );
  }
}
