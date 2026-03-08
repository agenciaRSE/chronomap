
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/news", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server configuration error: API Key missing" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Provide a list of 10 current, real-time geopolitical news headlines from around the world. Focus on major international events, conflicts, and diplomatic shifts. Return ONLY a JSON array of objects with 'title', 'url', and 'source' properties. Do not include markdown formatting.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }
      
      const jsonStr = text.trim();
      const cleanedJson = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      
      const data = JSON.parse(cleanedJson);
      res.json(data);
    } catch (error) {
      console.error("Backend News Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch news from server" });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
