// Vercel serverless function: same-origin proxy for The Commons JSON Feed.
// (The feed sends no CORS header, so the browser can't fetch it cross-origin.)
//
// Self-contained on purpose: Vercel's ESM function bundler ("type":"module")
// does not reliably trace a shared ../lib import, which 500s at runtime with
// ERR_MODULE_NOT_FOUND. Keep this handler dependency-free. The same logic lives
// in lib/commonsFeed.ts for the local dev server (server.ts).

const FEED_URL = process.env.COMMONS_FEED_URL || "https://commons.now/feed.json";
const MAX_ITEMS = 12;

interface JsonFeedItem {
  title?: string;
  url?: string;
  tags?: string[];
  authors?: { name?: string }[];
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(FEED_URL, {
      headers: { accept: "application/feed+json, application/json" },
    });
    if (!upstream.ok) {
      throw new Error(`The Commons feed responded ${upstream.status}`);
    }

    const feed = (await upstream.json()) as { items?: JsonFeedItem[] };
    const items = Array.isArray(feed.items) ? feed.items : [];

    const news = items
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

    // Mirror The Commons' own edge cache (5 min) so we don't hammer it.
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );
    return res.status(200).json(news);
  } catch (error) {
    console.error("News proxy error:", error);
    return res.status(502).json({ error: "Failed to fetch The Commons feed" });
  }
}
