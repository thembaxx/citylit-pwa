import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const VITE_BIN = 'node_modules/vite/bin/vite.js';

/** Start a Vite server for an automated QA run, or reuse an already healthy one. */
export async function startQaServer({ mode, port, path = '/', timeoutMs = 30000 }) {
  const url = `http://127.0.0.1:${port}`;
  const probe = async () => {
    try {
      const response = await fetch(`${url}${path}`, { redirect: 'manual' });
      return response.ok || response.status === 304;
    } catch {
      return false;
    }
  };

  if (await probe()) return { url, owned: false, stop: async () => {} };

  const server = spawn(
    process.execPath,
    [
      VITE_BIN,
      ...(mode === 'preview' ? ['preview'] : []),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
  let exitInfo = null;
  server.once('exit', (code, signal) => {
    exitInfo = { code, signal };
  });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) {
      return {
        url,
        owned: true,
        stop: async () => {
          if (server.exitCode !== null || server.signalCode !== null) return;
          server.kill('SIGTERM');
          await Promise.race([
            new Promise((resolve) => server.once('exit', resolve)),
            delay(3000).then(() => {
              if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
            }),
          ]);
        },
      };
    }
    if (exitInfo) {
      throw new Error(`${mode} server exited (${exitInfo.signal ?? `code ${exitInfo.code}`})`);
    }
    await delay(250);
  }

  server.kill('SIGTERM');
  throw new Error(`${mode} server did not become ready at ${url}${path} within ${timeoutMs}ms`);
}
