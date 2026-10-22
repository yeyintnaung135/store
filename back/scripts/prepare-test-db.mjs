import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';

function readDatabaseUrl(filePath) {
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (key !== 'DATABASE_URL') {
      continue;
    }

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    return value;
  }

  throw new Error(`${filePath} must set DATABASE_URL`);
}

const testDatabaseUrl = readDatabaseUrl(new URL('../.env.test', import.meta.url));
const testUrl = new URL(testDatabaseUrl);
const testDatabase = decodeURIComponent(testUrl.pathname.replace(/^\//, ''));

if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(testDatabase)) {
  throw new Error(`Refusing to create database "${testDatabase}"`);
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = '/store';

const client = new Client({ connectionString: adminUrl.toString() });
await client.connect();

try {
  const existing = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [testDatabase],
  );

  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${testDatabase}"`);
  }
} finally {
  await client.end();
}

const migrate = spawn(
  process.execPath,
  ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  },
);

const exitCode = await new Promise((resolve, reject) => {
  migrate.on('error', reject);
  migrate.on('exit', (code) => resolve(code ?? 1));
});

process.exit(exitCode);
