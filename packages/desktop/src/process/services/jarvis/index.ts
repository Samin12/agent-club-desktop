import { app, utilityProcess } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { preparePersonalVault } from './vault';
import { JarvisRuntime } from './JarvisRuntime';

const runtime = new JarvisRuntime((port, token) => {
  const root = app.isPackaged
    ? path.join(process.resourcesPath, 'bundled-jarvis')
    : path.join(app.getAppPath(), 'resources', 'bundled-jarvis');
  const entry = path.join(root, 'server.js');
  if (!existsSync(entry)) throw new Error('Jarvis bundle is missing. Run bun run jarvis:build.');
  const dataRoot = path.join(app.getPath('userData'), 'jarvis');
  const vault = process.env.VAULT_ROOT || path.join(dataRoot, 'vault');
  if (!process.env.VAULT_ROOT) {
    preparePersonalVault(vault, path.join(root, 'starter-vault'), path.join(dataRoot, 'demo-backup'));
  }
  // Start only the HUD. The optional runner/voice services require user configuration.
  return utilityProcess.fork(entry, [], {
    cwd: root,
    serviceName: 'Agent Club Jarvis',
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
      VAULT_ROOT: vault,
      HUD_TZ: process.env.HUD_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
      JARVIS_AUTH_TOKEN: token,
      JARVIS_HOME_ENV: path.join(dataRoot, '.env'),
    },
  });
});

app.once('before-quit', () => runtime.stop());

/** Starts (or reuses) the isolated Jarvis HUD and returns its local session URL. */
export const openJarvis = (): Promise<{ url: string }> => runtime.open();
