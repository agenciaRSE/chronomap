import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, RefreshCw, GripHorizontal } from 'lucide-react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
}

const COMMONS_URL = 'https://commons.now';

// Only allow http(s) links as hrefs — defends against javascript:/data: URLs
// if the upstream feed is ever compromised.
const safeUrl = (url: string): string => (/^https?:\/\//i.test(url) ? url : '#');

export const NewsTicker: React.FC = React.memo(() => {
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
        throw new Error("El servidor no respondió con JSON.");
      }

      const data = await response.json();
      if (response.ok) {
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        } else if (Array.isArray(data)) {
          throw new Error("No hay noticias disponibles ahora mismo");
        } else {
          throw new Error("Formato de respuesta inválido");
        }
      } else {
        throw new Error(data.error || `Error del servidor: ${response.status}`);
      }
    } catch (err) {
      console.error("News Fetch Error:", err);
      setError(err instanceof Error ? err.message : "No se pudieron cargar las noticias");

      // Fallback: enlazar a The Commons
      setNews([
        { title: "The Commons — medio, agregador y archivo público. La portada la decidís vosotr@s.", url: COMMONS_URL, source: "The Commons" },
        { title: "Una voz, un voto. Entra y participa.", url: COMMONS_URL, source: "The Commons" },
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
    <div className="app-drag titlebar-strip fixed top-0 left-0 w-full bg-zinc-900/90 backdrop-blur-md border-b border-white/10 flex items-center overflow-hidden z-40 flex-none">
      {/* Inset past the OS window controls when running as an installed PWA. */}
      <div className="titlebar-safe-area h-full flex items-center overflow-hidden">
        <a
          href={COMMONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="app-no-drag flex-none bg-zinc-800 px-3 h-full flex items-center gap-2 border-r border-white/10 z-10 hover:bg-zinc-700 transition-colors"
          title="Noticias de The Commons"
        >
          <Globe className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
            The Commons
          </span>
        </a>
  
        {/* The ticker keeps its own clickable rect: draggable regions are laid out
            on the main thread and would go stale under the marquee's animation,
            which breaks the links inside it. */}
        <div className="app-no-drag flex-1 overflow-hidden relative h-full flex items-center">
          {error ? (
            <div className="px-4 text-[12px] text-red-400 flex items-center gap-2">
              <span>{error}</span>
              <button onClick={fetchNews} className="app-no-drag hover:text-white transition-colors">
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
                    href={safeUrl(item.url)}
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
                    href={safeUrl(item.url)}
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
  
        {/* Explicit grab handle, shown only when the app runs in its own window
            and this bar has replaced the OS titlebar. */}
        <div
          className="wco-only flex-none h-full w-12 items-center justify-center border-l border-white/10 bg-zinc-900/60 text-zinc-600"
          title="Arrastra para mover la ventana"
          aria-hidden="true"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
});
