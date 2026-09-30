import { describe, expect, it, vi } from 'vitest';
import { createSocialReader, fetchSocialAccounts } from '../../../integrations/jarvis/lib/social/providers';

const youtube = {
  items: [
    {
      id: 'UC_personal',
      snippet: { title: 'My channel' },
      statistics: { subscriberCount: '1230', viewCount: '48010', videoCount: '14', hiddenSubscriberCount: false },
    },
  ],
};
const response = (data: unknown) => new Response(JSON.stringify(data), { status: 200 });

describe('personal social accounts', () => {
  it('shows unconnected accounts without requesting or inventing counts', async () => {
    const request = vi.fn();
    const accounts = await fetchSocialAccounts({}, request);
    expect(accounts.map((a) => [a.status, a.audience])).toEqual([
      ['not_connected', null],
      ['not_connected', null],
    ]);
    expect(request).not.toHaveBeenCalled();
  });
  it('keeps the account identity, counts, source and API rounding together', async () => {
    const request = vi.fn(async () => response(youtube));
    const [account] = await fetchSocialAccounts({ youtubeKey: 'secret', youtubeChannel: '@my-channel' }, request);
    expect(account).toMatchObject({
      status: 'connected',
      account: 'My channel',
      audience: 1230,
      rounded: true,
      views: 48010,
      posts: 14,
      source: 'YouTube Data API',
    });
    expect((request.mock.calls as unknown as [URL][])[0][0].searchParams.get('forHandle')).toBe('@my-channel');
    expect(JSON.stringify(account)).not.toContain('secret');
  });
  it('does not turn hidden subscribers into zero', async () => {
    const data = structuredClone(youtube);
    data.items[0].statistics.hiddenSubscriberCount = true;
    const [account] = await fetchSocialAccounts({ youtubeKey: 'key', youtubeChannel: 'UC_personal' }, async () =>
      response(data)
    );
    expect(account.audience).toBeNull();
    expect(account.status).toBe('connected');
  });
  it('rejects a token connected to a different Instagram account', async () => {
    const accounts = await fetchSocialAccounts({ instagramToken: 'secret', instagramUsername: 'mine' }, async () =>
      response({ id: '1', username: 'someone_else', followers_count: 30, media_count: 2 })
    );
    expect(accounts[1]).toMatchObject({ status: 'unavailable', account: null, audience: null });
  });
  it('accepts real zero followers and validates the expected username', async () => {
    const accounts = await fetchSocialAccounts({ instagramToken: 'secret', instagramUsername: '@Mine' }, async () =>
      response({ id: '1', username: 'mine', followers_count: 0, media_count: 2 })
    );
    expect(accounts[1]).toMatchObject({ status: 'connected', account: '@mine', audience: 0, posts: 2 });
  });
  it('hides unavailable or malformed counts instead of retaining unrelated stats', async () => {
    const accounts = await fetchSocialAccounts({ instagramToken: 'secret' }, async () =>
      response({ id: '1', username: 'mine', followers_count: -1 })
    );
    expect(accounts[1]).toMatchObject({ status: 'unavailable', audience: null });
  });
  it('does not expose upstream errors containing credentials', async () => {
    const accounts = await fetchSocialAccounts({ instagramToken: 'secret' }, async () => {
      throw new Error('URL contains secret');
    });
    expect(accounts[1].status).toBe('unavailable');
    expect(JSON.stringify(accounts)).not.toContain('secret');
  });
  it('shares concurrent requests, caches for five minutes, then clears values after a failed refresh', async () => {
    let now = 0;
    const request = vi.fn().mockResolvedValueOnce(response(youtube)).mockRejectedValueOnce(new Error('Offline'));
    const read = createSocialReader(
      () => ({ youtubeKey: 'key', youtubeChannel: '@mine' }),
      request,
      () => now
    );
    await Promise.all([read(), read(), read()]);
    expect(request).toHaveBeenCalledTimes(1);
    now = 300001;
    const [account] = await read();
    expect(request).toHaveBeenCalledTimes(2);
    expect(account).toMatchObject({ status: 'unavailable', audience: null });
  });
});
