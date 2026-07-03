import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { fetchCommonsNews } from "./lib/commonsFeed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers (mirrors vercel.json for local / self-hosted parity).
  app.use((_req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' https://va.vercel-scripts.com",
        "connect-src 'self' https://vitals.vercel-insights.com",
        "manifest-src 'self'",
        "worker-src 'self'",
        "upgrade-insecure-requests",
      ].join("; ")
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), browsing-topics=()"
    );
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // API: same-origin proxy for The Commons public JSON Feed.
  app.get("/api/news", async (_req, res) => {
    try {
      const news = await fetchCommonsNews();
      res.json(news);
    } catch (error) {
      console.error("News proxy error:", error);
      res.status(502).json({ error: "Failed to fetch The Commons feed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    // `extensions: ['html']` serves /discord-timestamp-generator from the built
    // .html file (clean URL), matching how Vercel serves it in production.
    app.use(express.static(path.join(__dirname, "dist"), { extensions: ["html"] }));
    // SPA fallback — middleware form (no wildcard pattern) is express 5 /
    // path-to-regexp 8 safe; `app.get("*")` throws "Missing parameter name".
    app.use((_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
