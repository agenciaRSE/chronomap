// Shared helper: fetch The Commons public JSON Feed and map it to the
// lightweight shape the NewsTicker consumes: { title, url, source }[].
//
// The Commons feed: https://commons.now/feed.json (JSON Feed 1.1, ~5 min edge cache).
// `url` is the permalink on The Commons, so the ticker links back there.

export interface NewsItem {
  title: string;
  url: string;
  source: string;
}

interface JsonFeedItem {
  title?: string;
  url?: string;
  tags?: string[];
  authors?: { name?: string }[];
}

const FEED_URL = process.env.COMMONS_FEED_URL || "https://commons.now/feed.json";
const MAX_ITEMS = 12;

export async function fetchCommonsNews(): Promise<NewsItem[]> {
  const upstream = await fetch(FEED_URL, {
    headers: { accept: "application/feed+json, application/json" },
  });
  if (!upstream.ok) {
    throw new Error(`The Commons feed responded ${upstream.status}`);
  }

  const feed = (await upstream.json()) as { items?: JsonFeedItem[] };
  const items = Array.isArray(feed.items) ? feed.items : [];

  return items
    .filter(
      (it): it is JsonFeedItem & { title: string; url: string } =>
        Boolean(it.title && it.url)
    )
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      title: it.title,
      url: it.url,
      source: it.tags?.[0] || it.authors?.[0]?.name || "The Commons",
    }));
}
