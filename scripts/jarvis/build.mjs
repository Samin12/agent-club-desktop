import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = path.join(root, 'integrations/jarvis');
const output = path.join(root, 'resources/bundled-jarvis');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const hash = createHash('sha256')
  .update(`${process.platform}-${process.arch}-v2`)
  .update(readFileSync(fileURLToPath(import.meta.url)));
function hashSource(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (
      ['node_modules', '.next', 'next-env.d.ts'].includes(entry.name) ||
      entry.name.endsWith('.tsbuildinfo') ||
      entry.name.startsWith('.env')
    )
      continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) hashSource(file);
    else hash.update(path.relative(source, file)).update(readFileSync(file));
  }
}
hashSource(source);
const fingerprint = hash.digest('hex');
if (
  existsSync(path.join(output, 'source.sha256')) &&
  readFileSync(path.join(output, 'source.sha256'), 'utf8') === fingerprint &&
  existsSync(path.join(output, 'server.js'))
) {
  console.log('Jarvis bundle is up to date.');
} else {
  execFileSync(npm, ['ci', '--include=dev', '--no-audit', '--no-fund'], {
    cwd: source,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  execFileSync(npm, ['run', 'build'], {
    cwd: source,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  cpSync(path.join(source, '.next/standalone'), output, { recursive: true, dereference: true });
  cpSync(path.join(source, '.next/static'), path.join(output, '.next/static'), { recursive: true });
  cpSync(path.join(source, 'public'), path.join(output, 'public'), { recursive: true });
  cpSync(path.join(source, 'starter-vault'), path.join(output, 'starter-vault'), { recursive: true });
  writeFileSync(path.join(output, 'source.sha256'), fingerprint);
  console.log('Agent Club Jarvis bundle ready.');
}
