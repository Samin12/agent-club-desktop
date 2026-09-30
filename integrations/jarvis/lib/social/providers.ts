import { homeEnv } from "../homeEnv";
import type { SocialAccount } from "./types";

type Config = {
  youtubeKey?: string;
  youtubeChannel?: string;
  instagramToken?: string;
  instagramUsername?: string;
};
type Fetch = typeof fetch;
const INTERVAL = 5 * 60 * 1000;

function count(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (value === "") return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

async function json(url: URL, headers: Record<string, string>, request: Fetch): Promise<Record<string, unknown>> {
  const response = await request(url, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Account request failed");
  return response.json();
}

function empty(platform: SocialAccount["platform"]): SocialAccount {
  return { platform, status: "not_connected", account: null, url: null, audience: null, views: null, posts: null,
    checkedAt: null, source: platform === "youtube" ? "YouTube Data API" : "Instagram API", rounded: platform === "youtube" };
}

/** Fetch only configured accounts. Never substitute demo, zero, or another account on failure. */
export async function fetchSocialAccounts(config: Config, request: Fetch = fetch): Promise<SocialAccount[]> {
  return Promise.all(["youtube", "instagram"].map(async (platform) => {
    const result = empty(platform as SocialAccount["platform"]);
    const channel = config.youtubeChannel?.trim();
    if (platform === "youtube" && (!config.youtubeKey || !channel)) return result;
    if (platform === "instagram" && !config.instagramToken) return result;
    try {
      if (platform === "youtube") {
        const url = new URL("https://www.googleapis.com/youtube/v3/channels");
        url.searchParams.set("part", "snippet,statistics");
        url.searchParams.set(channel!.startsWith("UC") ? "id" : "forHandle", channel!);
        const data = await json(url, { "X-Goog-Api-Key": config.youtubeKey! }, request);
        const item = (data.items as { id?: string; snippet?: { title?: string }; statistics?: Record<string, unknown> }[] | undefined)?.[0];
        if (!item?.id || !item.snippet?.title || !item.statistics) throw new Error("Channel unavailable");
        result.account = item.snippet.title;
        result.url = `https://www.youtube.com/channel/${encodeURIComponent(item.id)}`;
        result.audience = item.statistics.hiddenSubscriberCount === true ? null : count(item.statistics.subscriberCount);
        result.views = count(item.statistics.viewCount);
        result.posts = count(item.statistics.videoCount);
      } else {
        const url = new URL("https://graph.instagram.com/v25.0/me");
        url.searchParams.set("fields", "id,username,followers_count,media_count");
        const data = await json(url, { Authorization: `Bearer ${config.instagramToken}` }, request);
        if (typeof data.username !== "string" || !data.username || !data.id) throw new Error("Account unavailable");
        const expected = config.instagramUsername?.replace(/^@/, "").toLowerCase();
        if (expected && expected !== data.username.toLowerCase()) throw new Error("Different account");
        result.account = `@${data.username}`;
        result.url = `https://www.instagram.com/${encodeURIComponent(data.username)}/`;
        result.audience = count(data.followers_count);
        result.posts = count(data.media_count);
        if (result.audience === null) throw new Error("Followers unavailable");
      }
      result.checkedAt = new Date().toISOString();
      result.status = "connected";
      return result;
    } catch {
      // Never relay upstream errors: they can include tokens or request URLs.
      return { ...empty(platform as SocialAccount["platform"]), status: "unavailable" as const };
    }
  }));
}

/** Share one in-flight request and poll providers at most once every five minutes. */
export function createSocialReader(getConfig: () => Config, request: Fetch = fetch, now = Date.now) {
  let cached: Promise<SocialAccount[]> | undefined;
  let refreshedAt = 0;
  let previousConfig = "";
  return () => {
    const config = getConfig();
    const key = JSON.stringify(config);
    if (!cached || key !== previousConfig || now() - refreshedAt >= INTERVAL) {
      previousConfig = key;
      refreshedAt = now();
      cached = fetchSocialAccounts(config, request);
    }
    return cached;
  };
}

export const readSocialAccounts = createSocialReader(() => ({
  youtubeKey: homeEnv("YOUTUBE_API_KEY"),
  youtubeChannel: homeEnv("YOUTUBE_CHANNEL_ID") || homeEnv("YOUTUBE_HANDLE"),
  instagramToken: homeEnv("INSTAGRAM_ACCESS_TOKEN"),
  instagramUsername: homeEnv("INSTAGRAM_USERNAME"),
}));
