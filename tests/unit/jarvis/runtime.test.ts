import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { JarvisRuntime, type JarvisChild } from '@/process/services/jarvis/JarvisRuntime';

const runtimes: JarvisRuntime[] = [];
const servers: Server[] = [];
afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.stop();
  for (const server of servers.splice(0)) server.close();
});

function fixture() {
  const launch = vi.fn((port: number, token: string): JarvisChild => {
    const server = createServer((request, response) => {
      if (request.headers['x-jarvis-token'] !== token) {
        response.writeHead(401).end();
        return;
      }
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ service: 'agent-club-jarvis' }));
    });
    servers.push(server);
    server.listen(port, '127.0.0.1');
    return {
      kill: () => {
        server.close();
        return true;
      },
      once: (_event, listener) => server.once('close', listener),
    };
  });
  const runtime = new JarvisRuntime(launch, 1500);
  runtimes.push(runtime);
  return { runtime, launch };
}

describe('Jarvis lifecycle', () => {
  it('shares a single server when the tab opens concurrently', async () => {
    const { runtime, launch } = fixture();
    const results = await Promise.all([runtime.open(), runtime.open()]);
    expect(launch).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
    expect(new URL(results[0].url).hostname).toBe('127.0.0.1');
  });

  it('uses a new capability when a stopped server is reopened', async () => {
    const { runtime } = fixture();
    const first = await runtime.open();
    runtime.stop();
    const second = await runtime.open();
    expect(new URL(second.url).hash).not.toBe(new URL(first.url).hash);
  });

  it('rejects a missing bundle and allows another attempt', async () => {
    const launch = vi.fn(() => {
      throw new Error('Missing bundle');
    });
    const runtime = new JarvisRuntime(launch, 100);
    runtimes.push(runtime);
    await expect(runtime.open()).rejects.toThrow('Missing bundle');
    await expect(runtime.open()).rejects.toThrow('Missing bundle');
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it('kills a server that never becomes healthy', async () => {
    const kill = vi.fn(() => true);
    const runtime = new JarvisRuntime(() => ({ kill, once: vi.fn() }), 30);
    runtimes.push(runtime);
    await expect(runtime.open()).rejects.toThrow('timed out');
    expect(kill).toHaveBeenCalledTimes(1);
  });
});
