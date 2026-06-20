import { fetchCommonsNews } from "../lib/commonsFeed";

// Vercel serverless function: same-origin proxy for The Commons JSON Feed.
// (The Commons feed sends no CORS header, so the browser can't fetch it directly.)
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const news = await fetchCommonsNews();
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
