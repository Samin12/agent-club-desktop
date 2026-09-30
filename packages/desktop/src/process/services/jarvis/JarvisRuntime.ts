import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';

export type JarvisChild = { kill: () => boolean; once: (event: 'exit', listener: () => void) => unknown };
export type JarvisLaunch = (port: number, token: string) => JarvisChild;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a Jarvis port'));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

/** Owns one local HUD process; concurrent tab opens share the same startup. */
export class JarvisRuntime {
  private child: JarvisChild | null = null;
  private opening: Promise<{ url: string }> | null = null;
  private generation = 0;

  constructor(
    private readonly launch: JarvisLaunch,
    private readonly timeoutMs = 30_000
  ) {}

  open(): Promise<{ url: string }> {
    if (this.opening) return this.opening;
    const generation = ++this.generation;
    this.opening = this.start(generation).catch((error: unknown) => {
      if (generation === this.generation) this.stop();
      throw error;
    });
    return this.opening;
  }

  stop(): void {
    ++this.generation;
    const child = this.child;
    this.child = null;
    this.opening = null;
    child?.kill();
  }

  private async start(generation: number): Promise<{ url: string }> {
    const port = await freePort();
    if (generation !== this.generation) throw new Error('Jarvis startup cancelled');
    const token = randomBytes(32).toString('hex');
    const origin = `http://127.0.0.1:${port}`;
    const child = this.launch(port, token);
    this.child = child;
    let exited = false;
    child.once('exit', () => {
      exited = true;
      if (this.child === child) {
        this.child = null;
        this.opening = null;
      }
    });
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      if (exited || generation !== this.generation) throw new Error('Jarvis stopped during startup');
      try {
        const response = await fetch(`${origin}/api/health`, {
          headers: { 'x-jarvis-token': token },
          signal: AbortSignal.timeout(Math.min(1000, this.timeoutMs)),
        });
        if (response.ok && (await response.json()).service === 'agent-club-jarvis') {
          return { url: `${origin}/#session=${token}` };
        }
      } catch {
        // The standalone server takes a moment to start listening.
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error('Jarvis startup timed out');
  }
}
