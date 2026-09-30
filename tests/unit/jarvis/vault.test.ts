import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { preparePersonalVault } from '@/process/services/jarvis/vault';

const roots: string[] = [];
function setup() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'jarvis-vault-'));
  roots.push(root);
  const vault = path.join(root, 'personal');
  const starter = path.resolve('integrations/jarvis/starter-vault');
  const backup = path.join(root, 'backup');
  return { vault, starter, backup };
}
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('personal Jarvis vault', () => {
  it('starts without sample metrics, runs, or personal notes', () => {
    const { vault, starter, backup } = setup();
    preparePersonalVault(vault, starter, backup);
    expect(existsSync(path.join(vault, 'system/metrics/metrics.csv'))).toBe(false);
    expect(existsSync(path.join(vault, 'daily-notes'))).toBe(false);
    expect(existsSync(path.join(vault, 'system/schemas/daily-note.md'))).toBe(true);
  });
  it('archives unchanged demo metrics from the previous version without losing them', () => {
    const { vault, starter, backup } = setup();
    const rel = 'system/metrics/metrics.csv';
    mkdirSync(path.dirname(path.join(vault, rel)), { recursive: true });
    writeFileSync(path.join(vault, rel), readFileSync(path.join(starter, rel)));
    preparePersonalVault(vault, starter, backup);
    preparePersonalVault(vault, starter, backup);
    expect(existsSync(path.join(vault, rel))).toBe(false);
    expect(readFileSync(path.join(backup, rel))).toEqual(readFileSync(path.join(starter, rel)));
  });
  it('preserves user edits even if the filename matches a demo file', () => {
    const { vault, starter, backup } = setup();
    const rel = 'daily-notes/2026-06-01.md';
    mkdirSync(path.dirname(path.join(vault, rel)), { recursive: true });
    writeFileSync(path.join(vault, rel), 'My actual note');
    preparePersonalVault(vault, starter, backup);
    expect(readFileSync(path.join(vault, rel), 'utf8')).toBe('My actual note');
    expect(existsSync(path.join(backup, rel))).toBe(false);
  });
});
