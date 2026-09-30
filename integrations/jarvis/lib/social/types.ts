export type SocialAccount = {
  platform: "youtube" | "instagram";
  status: "connected" | "not_connected" | "unavailable";
  account: string | null;
  url: string | null;
  audience: number | null;
  views: number | null;
  posts: number | null;
  checkedAt: string | null;
  source: "YouTube Data API" | "Instagram API";
  rounded: boolean;
};
