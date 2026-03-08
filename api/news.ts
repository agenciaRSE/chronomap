
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Solo permitir peticiones GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server configuration error: API Key missing in Vercel" });
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
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Vercel API Error:", error);
    // Si el error es de la API de Gemini (como el de API Key inválida)
    if (error.message && error.message.includes("API key not valid")) {
      return res.status(400).json({ error: "La API Key de Gemini no es válida. Por favor, revísala en Vercel." });
    }
    return res.status(500).json({ error: "Error al obtener noticias desde el servidor" });
  }
}
