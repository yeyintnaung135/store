import { readFileSync } from 'node:fs';
import path from 'node:path';

export function testDatabaseUrl(): string {
  const contents = readFileSync(
    path.resolve(process.cwd(), '.env.test'),
    'utf8',
  );

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('DATABASE_URL=')) {
      continue;
    }

    let value = trimmed.slice('DATABASE_URL='.length).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    return value;
  }

  throw new Error('.env.test must set DATABASE_URL');
}
