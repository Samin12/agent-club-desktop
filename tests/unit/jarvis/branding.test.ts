import { describe, expect, it } from 'vitest';
import { brandBuiltinCatalogEntry } from '@/common/adapter/apiModelMapper';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';

describe('Agent Club catalog labels', () => {
  it('brands backend-provided built-in labels without changing the runtime identity', () => {
    const entry = brandBuiltinCatalogEntry({
      id: 'aioncli',
      agent_source: 'internal',
      name: 'Aion CLI',
      name_i18n: { 'en-US': 'AionUi Butler', 'zh-CN': 'AionUi 管家' },
    });
    expect(entry.id).toBe('aioncli');
    expect(entry.name).toBe('Agent Club Agent');
    expect(entry.name_i18n).toEqual({ 'en-US': 'Agent Club Butler', 'zh-CN': 'Agent Club 管家' });
  });

  it('does not rewrite user-authored or unclassified names', () => {
    const custom = { source: 'user', name: 'Notes about AionUi' };
    expect(brandBuiltinCatalogEntry(custom)).toBe(custom);
    const unknown = { name: 'AionUi research' };
    expect(brandBuiltinCatalogEntry(unknown)).toBe(unknown);
  });
});

describe('Agent Club distribution identity', () => {
  const packaging = load(readFileSync(resolve('packages/desktop/electron-builder.yml'), 'utf8')) as {
    appId: string;
    productName: string;
    executableName: string;
    publish: { owner: string; repo: string };
  };

  it('ships with a distinct application and executable identity', () => {
    expect(packaging.appId).toBe('club.agent.desktop');
    expect(packaging.productName).toBe('Agent Club');
    expect(packaging.executableName).toBe('AgentClub');
  });

  it('publishes updates only to the fork', () => {
    expect(packaging.publish).toMatchObject({ owner: 'Samin12', repo: 'agent-club-desktop' });
  });
});
