import { type ChildProcess, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { testDatabaseUrl } from './test-database.js';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function reservePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function stopProcess(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const forceKill = setTimeout(() => {
      child.kill('SIGKILL');
    }, 5_000);

    child.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    child.kill();
  });
}

async function waitForReady(url: string, child: ChildProcess): Promise<void> {
  const started = Date.now();
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    output += chunk.toString();
  });

  while (Date.now() - started < 20_000) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early:\n${output}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Server did not become ready:\n${output}`);
}

export async function startTestServer(): Promise<{
  baseUrl: string;
  stop: () => Promise<void>;
}> {
  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['dist/main.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForReady(`${baseUrl}/health`, child);
  } catch (error) {
    await stopProcess(child);
    throw error;
  }

  return {
    baseUrl,
    stop: () => stopProcess(child),
  };
}
