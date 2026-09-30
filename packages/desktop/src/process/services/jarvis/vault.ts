import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import path from 'node:path';

const DEMO_FILES = [
  'system/metrics/metrics.csv',
  'system/metrics/latest-video.json',
  'system/runs/sample01.md',
  'system/runs/sample01.json',
  'inbox/reports/morning/2026-06-01-morning-report-sample.md',
  'daily-notes/2026-06-01.md',
];

/** Start empty; archive only byte-identical demo files seeded by the previous release. */
export function preparePersonalVault(vault: string, starter: string, backup: string): void {
  mkdirSync(vault, { recursive: true });
  for (const relative of DEMO_FILES) {
    const existing = path.join(vault, relative);
    const demo = path.join(starter, relative);
    const archived = path.join(backup, relative);
    if (!existsSync(existing) || !existsSync(demo) || existsSync(archived)) continue;
    if (!readFileSync(existing).equals(readFileSync(demo))) continue;
    mkdirSync(path.dirname(archived), { recursive: true });
    renameSync(existing, archived);
  }
  const schema = 'system/schemas/daily-note.md';
  if (!existsSync(path.join(vault, schema))) {
    mkdirSync(path.join(vault, 'system/schemas'), { recursive: true });
    copyFileSync(path.join(starter, schema), path.join(vault, schema));
  }
}
