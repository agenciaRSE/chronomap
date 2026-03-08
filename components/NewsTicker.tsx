
import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, RefreshCw } from 'lucide-react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
}

export const NewsTicker: React.FC = () => {
  console.log("NewsTicker rendering...");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/news');
      
      // Verificar si la respuesta es JSON antes de intentar parsearla
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error("El servidor no respondió con JSON. Revisa la configuración de las rutas en el deploy.");
      }

      const data = await response.json();
      if (response.ok) {
        if (Array.isArray(data)) {
          setNews(data);
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } else {
        throw new Error(data.error || `Error del servidor: ${response.status}`);
      }
    } catch (err) {
      console.error("News Fetch Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load news");
      
      // Fallback news
      setNews([
        { title: "Global geopolitical shifts continue to evolve.", url: "#", source: "System" },
        { title: "Diplomatic discussions ongoing in major international forums.", url: "#", source: "System" },
        { title: "Regional stability remains a key focus for international observers.", url: "#", source: "System" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Refresh news every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full bg-zinc-900/90 backdrop-blur-md border-b border-white/10 h-10 flex items-center overflow-hidden z-40 flex-none">
      <div className="flex-none bg-zinc-800 px-3 h-full flex items-center gap-2 border-r border-white/10 z-10">
        <Globe className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
          Geopolitical Feed
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {error ? (
          <div className="px-4 text-[12px] text-red-400 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={fetchNews} className="hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex whitespace-nowrap animate-marquee items-center">
            {news.map((item, index) => (
              <div key={index} className="flex items-center gap-4 px-6 border-r border-white/5 h-full group">
                <span className="text-[13px] font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter bg-zinc-800 px-1.5 py-0.5 rounded">
                  {item.source}
                </span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {news.map((item, index) => (
              <div key={`dup-${index}`} className="flex items-center gap-4 px-6 border-r border-white/5 h-full group">
                <span className="text-[13px] font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter bg-zinc-800 px-1.5 py-0.5 rounded">
                  {item.source}
                </span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
