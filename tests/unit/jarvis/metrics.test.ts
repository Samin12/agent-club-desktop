import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const config = vi.hoisted(() => ({ root: '' }));
vi.mock('../../../integrations/jarvis/lib/config', () => ({
  get VAULT_ROOT() {
    return config.root;
  },
  HUD_TZ: 'UTC',
}));
vi.mock('../../../integrations/jarvis/lib/social/providers', () => ({ readSocialAccounts: async () => [] }));
import { readMetrics, readLatestVideo, readLiveVaultState } from '../../../integrations/jarvis/lib/vault';

beforeEach(() => {
  config.root = mkdtempSync(path.join(os.tmpdir(), 'jarvis-metrics-'));
  mkdirSync(path.join(config.root, 'system/metrics'), { recursive: true });
});
afterEach(() => rmSync(config.root, { recursive: true, force: true }));

describe('honest Jarvis data', () => {
  it('excludes mock points from values and their history', () => {
    writeFileSync(
      path.join(config.root, 'system/metrics/metrics.csv'),
      'timestamp,source,metric,value,status,error\n2026-06-01T00:00:00Z,youtube,subscribers,8377,mock,\n2026-09-30T00:00:00Z,youtube,subscribers,10,ok,\n'
    );
    expect(readMetrics()[0]).toMatchObject({
      value: 10,
      delta: null,
      history: [{ timestamp: '2026-09-30T00:00:00Z', value: 10, status: 'ok' }],
    });
  });
  it('never returns the sample upload', () => {
    writeFileSync(
      path.join(config.root, 'system/metrics/latest-video.json'),
      JSON.stringify({ title: 'Sample Upload', status: 'mock' })
    );
    expect(readLatestVideo()).toBeNull();
  });
  it('does not use unidentified legacy social counts as the current account', async () => {
    writeFileSync(
      path.join(config.root, 'system/metrics/metrics.csv'),
      'timestamp,source,metric,value,status,error\n2026-09-30T00:00:00Z,youtube,subscribers,9999,ok,\n'
    );
    const state = await readLiveVaultState();
    expect(state.metrics).toEqual([]);
    expect(state.socialAccounts).toEqual([]);
  });
});
